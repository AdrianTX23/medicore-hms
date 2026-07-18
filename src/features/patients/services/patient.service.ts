import "server-only";
import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError } from "@/core/errors";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  PatientFormValues,
} from "@/features/patients/schemas/patient.schema";

function isUniqueViolation(e: unknown): e is Prisma.PrismaClientKnownRequestError {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

function toData(values: PatientFormValues) {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    documentId: values.documentId ?? null,
    birthDate: new Date(values.birthDate),
    gender: values.gender,
    bloodType: values.bloodType ?? null,
    phone: values.phone ?? null,
    email: values.email ?? null,
    address: values.address ?? null,
    allergies: (values.allergies ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    notes: values.notes ?? null,
  };
}

export async function createPatient(values: PatientFormValues) {
  try {
    return await prisma.$transaction(async (tx) => {
      // The MRN derives from a DB sequence, so it is assigned after insert.
      const created = await tx.patient.create({
        data: { ...toData(values), mrn: `PENDING-${randomUUID()}` },
      });
      return tx.patient.update({
        where: { id: created.id },
        data: { mrn: `MRN-${String(created.mrnSeq).padStart(6, "0")}` },
        select: { id: true, mrn: true },
      });
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      throw new ConflictError("Ya existe un paciente con ese documento de identidad");
    }
    throw e;
  }
}

export async function updatePatient(id: string, values: PatientFormValues) {
  const existing = await prisma.patient.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new NotFoundError("El paciente");

  try {
    return await prisma.patient.update({
      where: { id },
      data: toData(values),
      select: { id: true, mrn: true },
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      throw new ConflictError("Ya existe un paciente con ese documento de identidad");
    }
    throw e;
  }
}

/** Soft delete — the clinical history must survive the patient's removal. */
export async function softDeletePatient(id: string) {
  const existing = await prisma.patient.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new NotFoundError("El paciente");

  return prisma.patient.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true },
  });
}

export async function addEmergencyContact(input: {
  patientId: string;
  name: string;
  relationship: string;
  phone: string;
}) {
  const patient = await prisma.patient.findFirst({
    where: { id: input.patientId, deletedAt: null },
    select: { id: true },
  });
  if (!patient) throw new NotFoundError("El paciente");

  return prisma.emergencyContact.create({ data: input, select: { id: true } });
}

export async function deleteEmergencyContact(contactId: string) {
  const contact = await prisma.emergencyContact.findUnique({
    where: { id: contactId },
    select: { id: true },
  });
  if (!contact) throw new NotFoundError("El contacto");

  return prisma.emergencyContact.delete({ where: { id: contactId }, select: { id: true } });
}

export async function addPatientInsurance(input: {
  patientId: string;
  providerId: string;
  policyNumber: string;
  coveragePct: number;
  validUntil?: string;
}) {
  const patient = await prisma.patient.findFirst({
    where: { id: input.patientId, deletedAt: null },
    select: { id: true },
  });
  if (!patient) throw new NotFoundError("El paciente");

  try {
    return await prisma.patientInsurance.create({
      data: {
        patientId: input.patientId,
        providerId: input.providerId,
        policyNumber: input.policyNumber,
        coveragePct: input.coveragePct,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
      },
      select: { id: true },
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      throw new ConflictError("Ese paciente ya tiene registrada esa póliza");
    }
    throw e;
  }
}

export async function removePatientInsurance(insuranceId: string) {
  const insurance = await prisma.patientInsurance.findUnique({
    where: { id: insuranceId },
    select: { id: true },
  });
  if (!insurance) throw new NotFoundError("El seguro");

  // Deactivate instead of delete — invoices may reference the coverage.
  return prisma.patientInsurance.update({
    where: { id: insuranceId },
    data: { isActive: false },
    select: { id: true },
  });
}
