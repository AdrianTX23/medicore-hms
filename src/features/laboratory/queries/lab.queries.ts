import "server-only";
import type { LabOrderStatus, LabPriority } from "@/generated/prisma/enums";
import type { RecordAccessScope } from "@/core/access-scope";
import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/shared/utils/table-params";

export type LabOrderListItem = {
  id: string;
  status: LabOrderStatus;
  priority: LabPriority;
  createdAt: Date;
  patient: { id: string; firstName: string; lastName: string; mrn: string };
  orderedBy: { firstName: string; lastName: string };
  items: Array<{ labTest: { code: string; name: string } }>;
};

export async function listLabOrders(params: {
  status?: LabOrderStatus;
  patientId?: string;
  skip: number;
  take: number;
}): Promise<Paginated<LabOrderListItem>> {
  const where = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.patientId ? { patientId: params.patientId } : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.labOrder.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      skip: params.skip,
      take: params.take,
      select: {
        id: true,
        status: true,
        priority: true,
        createdAt: true,
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        orderedBy: { select: { firstName: true, lastName: true } },
        items: { select: { labTest: { select: { code: true, name: true } } } },
      },
    }),
    prisma.labOrder.count({ where }),
  ]);

  return {
    rows,
    total,
    page: Math.floor(params.skip / params.take) + 1,
    perPage: params.take,
    pageCount: Math.max(Math.ceil(total / params.take), 1),
  };
}

export type LabOrderDetail = NonNullable<Awaited<ReturnType<typeof getLabOrderDetail>>>;

export async function getLabOrderDetail(id: string, scope: RecordAccessScope) {
  const order = await prisma.labOrder.findUnique({
    where: { id },
    include: {
      patient: true,
      orderedBy: { select: { firstName: true, lastName: true } },
      encounter: { select: { id: true } },
      items: {
        include: {
          labTest: true,
          result: {
            include: {
              performedBy: {
                select: { email: true, staffProfile: { select: { firstName: true, lastName: true } } },
              },
              validatedBy: {
                select: { email: true, staffProfile: { select: { firstName: true, lastName: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!order) return null;
  if (scope.role === "PATIENT" && order.patientId !== scope.patientId) return null;

  return {
    ...order,
    patient: { ...order.patient, allergies: (order.patient.allergies as string[] | null) ?? [] },
  };
}

export async function listEncounterLabOrders(encounterId: string) {
  return prisma.labOrder.findMany({
    where: { encounterId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      priority: true,
      items: { select: { labTest: { select: { code: true, name: true } } } },
    },
  });
}

export async function getLabTestOptions(q?: string) {
  return prisma.labTest.findMany({
    where: {
      isActive: true,
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: "insensitive" as const } },
              { name: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    select: { id: true, code: true, name: true, category: true, price: true },
    orderBy: { name: "asc" },
    take: 20,
  });
}

type ReferenceRange = {
  sex?: "MALE" | "FEMALE" | "ANY";
  ageMin?: number;
  ageMax?: number;
  low?: number;
  high?: number;
};

/** Picks the first reference range matching the patient's sex/age, if any. */
export function matchReferenceRange(
  ranges: unknown,
  patient: { gender: "MALE" | "FEMALE" | "OTHER"; birthDate: Date },
): ReferenceRange | null {
  if (!Array.isArray(ranges)) return null;
  const ageYears = Math.floor(
    (Date.now() - patient.birthDate.getTime()) / (365.25 * 24 * 3600 * 1000),
  );
  return (
    (ranges as ReferenceRange[]).find((r) => {
      const sexOk = !r.sex || r.sex === "ANY" || r.sex === patient.gender;
      const ageOk = (r.ageMin == null || ageYears >= r.ageMin) && (r.ageMax == null || ageYears <= r.ageMax);
      return sexOk && ageOk;
    }) ?? null
  );
}

/** Returns null when the value isn't numeric or there's no matching range (can't judge). */
export function isAbnormal(value: string, range: ReferenceRange | null): boolean | null {
  if (!range || range.low == null || range.high == null) return null;
  const numeric = Number.parseFloat(value);
  if (Number.isNaN(numeric)) return null;
  return numeric < range.low || numeric > range.high;
}
