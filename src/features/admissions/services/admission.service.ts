import "server-only";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/core/errors";
import { prisma } from "@/lib/prisma";

export async function admitPatient(input: {
  patientId: string;
  bedId: string;
  attendingDoctorId: string;
  admissionDiagnosis: string;
}) {
  const [patient, bed, doctor, existingAdmission] = await Promise.all([
    prisma.patient.findFirst({ where: { id: input.patientId, deletedAt: null }, select: { id: true } }),
    prisma.bed.findUnique({ where: { id: input.bedId }, select: { id: true, status: true } }),
    prisma.staffProfile.findUnique({ where: { id: input.attendingDoctorId }, select: { id: true } }),
    prisma.admission.findFirst({ where: { patientId: input.patientId, status: "ADMITTED" }, select: { id: true } }),
  ]);

  if (!patient) throw new NotFoundError("El paciente");
  if (!bed) throw new NotFoundError("La cama");
  if (!doctor) throw new NotFoundError("El médico responsable");
  if (bed.status !== "AVAILABLE") {
    throw new BusinessRuleError("La cama seleccionada ya no está disponible");
  }
  if (existingAdmission) {
    throw new BusinessRuleError("El paciente ya tiene una hospitalización activa");
  }

  // The checks above are TOCTOU-vulnerable under concurrency (two requests can
  // both pass them before either commits). The conditional update below is the
  // real guard: it only flips the bed if it's still AVAILABLE, and the partial
  // unique indexes (one ADMITTED admission per patient/bed) back it up at the
  // DB level — same pattern as the appointment double-booking constraint.
  try {
    return await prisma.$transaction(async (tx) => {
      const claimed = await tx.bed.updateMany({
        where: { id: input.bedId, status: "AVAILABLE" },
        data: { status: "OCCUPIED" },
      });
      if (claimed.count === 0) {
        throw new ConflictError("La cama seleccionada ya no está disponible");
      }
      return tx.admission.create({
        data: {
          patientId: input.patientId,
          bedId: input.bedId,
          attendingDoctorId: input.attendingDoctorId,
          admissionDiagnosis: input.admissionDiagnosis,
        },
        select: { id: true },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error, "admissions_one_active_per_patient_key")) {
      throw new ConflictError("El paciente ya tiene una hospitalización activa");
    }
    if (isUniqueConstraintError(error, "admissions_one_active_per_bed_key")) {
      throw new ConflictError("La cama seleccionada ya no está disponible");
    }
    throw error;
  }
}

/** Prisma P2002 exposes the violated constraint name in `meta.target` (or a raw driver message). */
function isUniqueConstraintError(error: unknown, constraintName: string): boolean {
  if (typeof error !== "object" || error === null || !("code" in error) || error.code !== "P2002") {
    return false;
  }
  const meta = (error as { meta?: { target?: unknown } }).meta;
  const target = meta?.target;
  if (Array.isArray(target)) return target.includes(constraintName);
  if (typeof target === "string") return target.includes(constraintName);
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message.includes(constraintName);
}

export async function transferBed(input: { admissionId: string; toBedId: string; reason?: string }) {
  const [admission, toBed] = await Promise.all([
    prisma.admission.findUnique({ where: { id: input.admissionId }, select: { id: true, status: true, bedId: true } }),
    prisma.bed.findUnique({ where: { id: input.toBedId }, select: { id: true, status: true } }),
  ]);

  if (!admission) throw new NotFoundError("La hospitalización");
  if (admission.status !== "ADMITTED") {
    throw new BusinessRuleError("Solo se puede trasladar a un paciente hospitalizado activo");
  }
  if (!toBed) throw new NotFoundError("La cama de destino");
  if (toBed.status !== "AVAILABLE") {
    throw new BusinessRuleError("La cama de destino no está disponible");
  }
  if (toBed.id === admission.bedId) {
    throw new BusinessRuleError("El paciente ya está en esa cama");
  }

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.bed.updateMany({
      where: { id: input.toBedId, status: "AVAILABLE" },
      data: { status: "OCCUPIED" },
    });
    if (claimed.count === 0) {
      throw new ConflictError("La cama de destino ya no está disponible");
    }

    const transfer = await tx.bedTransfer.create({
      data: {
        admissionId: admission.id,
        fromBedId: admission.bedId,
        toBedId: input.toBedId,
        reason: input.reason ?? null,
      },
      select: { id: true },
    });
    await tx.admission.update({ where: { id: admission.id }, data: { bedId: input.toBedId } });
    await tx.bed.update({ where: { id: admission.bedId }, data: { status: "CLEANING" } });
    return transfer;
  });
}

export async function dischargePatient(input: { admissionId: string; dischargeSummary: string }) {
  const admission = await prisma.admission.findUnique({
    where: { id: input.admissionId },
    select: { id: true, status: true, bedId: true },
  });
  if (!admission) throw new NotFoundError("La hospitalización");
  if (admission.status !== "ADMITTED") {
    throw new BusinessRuleError("Esta hospitalización ya fue cerrada");
  }

  return prisma.$transaction(async (tx) => {
    const discharged = await tx.admission.update({
      where: { id: admission.id },
      data: { status: "DISCHARGED", dischargedAt: new Date(), dischargeSummary: input.dischargeSummary },
      select: { id: true },
    });
    await tx.bed.update({ where: { id: admission.bedId }, data: { status: "CLEANING" } });
    return discharged;
  });
}

/** Housekeeping marks a bed clean and ready — CLEANING/MAINTENANCE → AVAILABLE. */
export async function markBedAvailable(bedId: string) {
  const bed = await prisma.bed.findUnique({ where: { id: bedId }, select: { id: true, status: true } });
  if (!bed) throw new NotFoundError("La cama");
  if (bed.status === "OCCUPIED") {
    throw new BusinessRuleError("No se puede liberar una cama ocupada");
  }
  if (bed.status === "AVAILABLE") {
    throw new BusinessRuleError("La cama ya está disponible");
  }

  return prisma.bed.update({ where: { id: bedId }, data: { status: "AVAILABLE" }, select: { id: true } });
}
