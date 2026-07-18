import "server-only";
import type { EncounterStatus } from "@/generated/prisma/enums";
import type { RecordAccessScope } from "@/core/access-scope";
import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/shared/utils/table-params";

export type EncounterListItem = {
  id: string;
  createdAt: Date;
  status: EncounterStatus;
  chiefComplaint: string;
  patient: { id: string; firstName: string; lastName: string; mrn: string };
  doctor: { id: string; firstName: string; lastName: string };
  diagnoses: Array<{ icd10Code: string }>;
};

export async function listEncounters(params: {
  doctorId?: string;
  patientId?: string;
  status?: EncounterStatus;
  skip: number;
  take: number;
}): Promise<Paginated<EncounterListItem>> {
  const where = {
    ...(params.doctorId ? { doctorId: params.doctorId } : {}),
    ...(params.patientId ? { patientId: params.patientId } : {}),
    ...(params.status ? { status: params.status } : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.encounter.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
      select: {
        id: true,
        createdAt: true,
        status: true,
        chiefComplaint: true,
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
        diagnoses: { select: { icd10Code: true } },
      },
    }),
    prisma.encounter.count({ where }),
  ]);

  return {
    rows,
    total,
    page: Math.floor(params.skip / params.take) + 1,
    perPage: params.take,
    pageCount: Math.max(Math.ceil(total / params.take), 1),
  };
}

export type EncounterDetail = NonNullable<Awaited<ReturnType<typeof getEncounterDetail>>>;

/** Returns null both when the encounter doesn't exist AND when the caller (a PATIENT) doesn't own it — callers already treat null as notFound(), so this never leaks existence. */
export async function getEncounterDetail(id: string, scope: RecordAccessScope) {
  const encounter = await prisma.encounter.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: { select: { id: true, firstName: true, lastName: true, specialty: { select: { name: true } } } },
      appointment: { select: { id: true, scheduledAt: true } },
      vitalSigns: {
        orderBy: { recordedAt: "desc" },
        include: {
          recordedBy: {
            select: { email: true, staffProfile: { select: { firstName: true, lastName: true } } },
          },
        },
      },
      diagnoses: { include: { icd10: true }, orderBy: { isPrimary: "desc" } },
      prescriptions: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { medication: true } } },
      },
      addenda: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: { email: true, staffProfile: { select: { firstName: true, lastName: true } } },
          },
        },
      },
    },
  });
  if (!encounter) return null;
  if (scope.role === "PATIENT" && encounter.patientId !== scope.patientId) return null;

  return {
    ...encounter,
    patient: {
      ...encounter.patient,
      allergies: (encounter.patient.allergies as string[] | null) ?? [],
    },
    vitalSigns: encounter.vitalSigns.map((v) => ({
      ...v,
      temperatureC: v.temperatureC?.toNumber() ?? null,
      weightKg: v.weightKg?.toNumber() ?? null,
      heightCm: v.heightCm?.toNumber() ?? null,
    })),
  };
}

export async function searchIcd10(q?: string) {
  return prisma.icd10Code.findMany({
    where: q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    take: 10,
    orderBy: { code: "asc" },
  });
}

export async function getMedicationOptions() {
  return prisma.medication.findMany({
    where: { isActive: true },
    select: { id: true, name: true, form: true, strength: true },
    orderBy: { name: "asc" },
  });
}
