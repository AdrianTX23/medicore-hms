import "server-only";
import { BusinessRuleError, ForbiddenError, NotFoundError } from "@/core/errors";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth/session";

/**
 * Ownership rule: a doctor edits only their OWN in-progress encounters.
 * Nurses (vitals) are exempt from ownership but not from the CLOSED check.
 */
async function getEditableEncounter(encounterId: string, user: SessionUser, opts?: { ownershipExempt?: boolean }) {
  const encounter = await prisma.encounter.findUnique({
    where: { id: encounterId },
    select: { id: true, status: true, doctorId: true, appointmentId: true },
  });
  if (!encounter) throw new NotFoundError("La consulta");

  if (encounter.status === "CLOSED") {
    throw new BusinessRuleError(
      "La consulta está cerrada — las correcciones se registran como addendum",
    );
  }

  if (!opts?.ownershipExempt && user.role === "DOCTOR" && encounter.doctorId !== user.staffProfile?.id) {
    throw new ForbiddenError("Solo el médico asignado puede modificar esta consulta");
  }

  return encounter;
}

/** Idempotent: if the appointment already has an encounter, returns it. */
export async function startFromAppointment(appointmentId: string, user: SessionUser) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, status: true, doctorId: true, patientId: true, reason: true, encounter: { select: { id: true } } },
  });
  if (!appointment) throw new NotFoundError("La cita");

  if (appointment.encounter) return { id: appointment.encounter.id, existing: true };

  if (appointment.status !== "CONFIRMED") {
    throw new BusinessRuleError("Solo se puede iniciar la atención de una cita con check-in");
  }

  if (user.role === "DOCTOR" && appointment.doctorId !== user.staffProfile?.id) {
    throw new ForbiddenError("Solo el médico asignado puede iniciar esta consulta");
  }

  const encounter = await prisma.$transaction(async (tx) => {
    const created = await tx.encounter.create({
      data: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        type: "OUTPATIENT",
        chiefComplaint: appointment.reason,
      },
      select: { id: true },
    });
    await tx.appointment.update({
      where: { id: appointment.id },
      data: { status: "IN_PROGRESS" },
    });
    return created;
  });

  return { id: encounter.id, existing: false };
}

export async function recordVitals(
  input: {
    encounterId: string;
    temperatureC?: number;
    systolic?: number;
    diastolic?: number;
    heartRate?: number;
    respiratoryRate?: number;
    spo2?: number;
    weightKg?: number;
    heightCm?: number;
  },
  user: SessionUser,
) {
  await getEditableEncounter(input.encounterId, user, { ownershipExempt: true });
  const { encounterId, ...vitals } = input;
  return prisma.vitalSign.create({
    data: { encounterId, ...vitals, recordedById: user.id },
    select: { id: true },
  });
}

export async function updateNotes(
  input: { encounterId: string; chiefComplaint: string; notes?: string; treatmentPlan?: string },
  user: SessionUser,
) {
  await getEditableEncounter(input.encounterId, user);
  return prisma.encounter.update({
    where: { id: input.encounterId },
    data: {
      chiefComplaint: input.chiefComplaint,
      notes: input.notes ?? null,
      treatmentPlan: input.treatmentPlan ?? null,
    },
    select: { id: true },
  });
}

export async function addDiagnosis(
  input: { encounterId: string; icd10Code: string; description?: string; isPrimary: boolean },
  user: SessionUser,
) {
  await getEditableEncounter(input.encounterId, user);

  const code = await prisma.icd10Code.findUnique({ where: { code: input.icd10Code } });
  if (!code) throw new NotFoundError("El código CIE-10");

  const existing = await prisma.diagnosis.findFirst({
    where: { encounterId: input.encounterId, icd10Code: input.icd10Code },
  });
  if (existing) throw new BusinessRuleError("Ese diagnóstico ya está registrado en la consulta");

  try {
    return await prisma.$transaction(async (tx) => {
      if (input.isPrimary) {
        await tx.diagnosis.updateMany({
          where: { encounterId: input.encounterId },
          data: { isPrimary: false },
        });
      }
      return tx.diagnosis.create({
        data: {
          encounterId: input.encounterId,
          icd10Code: input.icd10Code,
          description: input.description ?? null,
          isPrimary: input.isPrimary,
        },
        select: { id: true },
      });
    });
  } catch (error) {
    // Backstop for the check above: a `@@unique([encounterId, icd10Code])`
    // constraint catches a concurrent double-submit that the pre-check missed.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw new BusinessRuleError("Ese diagnóstico ya está registrado en la consulta");
    }
    throw error;
  }
}

export async function removeDiagnosis(diagnosisId: string, encounterId: string, user: SessionUser) {
  await getEditableEncounter(encounterId, user);
  const diagnosis = await prisma.diagnosis.findFirst({
    where: { id: diagnosisId, encounterId },
  });
  if (!diagnosis) throw new NotFoundError("El diagnóstico");
  return prisma.diagnosis.delete({ where: { id: diagnosisId }, select: { id: true } });
}

export async function createPrescription(
  input: {
    encounterId: string;
    notes?: string;
    items: Array<{ medicationId: string; dosage: string; frequency: string; durationDays: number }>;
  },
  user: SessionUser,
) {
  const encounter = await getEditableEncounter(input.encounterId, user);

  const full = await prisma.encounter.findUniqueOrThrow({
    where: { id: encounter.id },
    select: { patientId: true, doctorId: true },
  });

  return prisma.prescription.create({
    data: {
      encounterId: input.encounterId,
      patientId: full.patientId,
      doctorId: full.doctorId,
      notes: input.notes ?? null,
      items: { create: input.items },
    },
    select: { id: true },
  });
}

export async function cancelPrescription(prescriptionId: string, encounterId: string, user: SessionUser) {
  await getEditableEncounter(encounterId, user);
  const prescription = await prisma.prescription.findFirst({
    where: { id: prescriptionId, encounterId },
  });
  if (!prescription) throw new NotFoundError("La receta");
  if (prescription.status !== "ACTIVE") {
    throw new BusinessRuleError("Solo se pueden anular recetas activas");
  }
  return prisma.prescription.update({
    where: { id: prescriptionId },
    data: { status: "CANCELLED" },
    select: { id: true },
  });
}

/** Closing freezes the record and completes the linked appointment. */
export async function closeEncounter(encounterId: string, user: SessionUser) {
  const encounter = await getEditableEncounter(encounterId, user);

  const diagnosisCount = await prisma.diagnosis.count({ where: { encounterId } });
  if (diagnosisCount === 0) {
    throw new BusinessRuleError("No se puede cerrar una consulta sin al menos un diagnóstico");
  }

  return prisma.$transaction(async (tx) => {
    const closed = await tx.encounter.update({
      where: { id: encounterId },
      data: { status: "CLOSED", closedAt: new Date() },
      select: { id: true },
    });
    if (encounter.appointmentId) {
      await tx.appointment.update({
        where: { id: encounter.appointmentId },
        data: { status: "COMPLETED" },
      });
    }
    return closed;
  });
}

export async function addAddendum(encounterId: string, note: string, user: SessionUser) {
  const encounter = await prisma.encounter.findUnique({
    where: { id: encounterId },
    select: { id: true, status: true },
  });
  if (!encounter) throw new NotFoundError("La consulta");
  if (encounter.status !== "CLOSED") {
    throw new BusinessRuleError("Los addendums son para consultas cerradas — edita la consulta directamente");
  }
  return prisma.encounterAddendum.create({
    data: { encounterId, note, authorId: user.id },
    select: { id: true },
  });
}
