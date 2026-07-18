import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { BloodType, Gender } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/shared/utils/table-params";

export type PatientListItem = {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  documentId: string | null;
  birthDate: Date;
  gender: Gender;
  bloodType: BloodType | null;
  phone: string | null;
  createdAt: Date;
};

const listSelect = {
  id: true,
  mrn: true,
  firstName: true,
  lastName: true,
  documentId: true,
  birthDate: true,
  gender: true,
  bloodType: true,
  phone: true,
  createdAt: true,
} as const;

/**
 * Paginated patient search. With a query term it goes through raw SQL so the
 * expression matches the pg_trgm GIN index created in the initial migration.
 */
export async function searchPatients(params: {
  q?: string;
  skip: number;
  take: number;
}): Promise<Paginated<PatientListItem>> {
  const { q, skip, take } = params;

  const terms = (q ?? "").split(/\s+/).filter(Boolean);

  if (terms.length > 0) {
    // Accent-insensitive, order-independent term match. f_unaccent() mirrors
    // the expression of the GIN trigram index (see migration).
    const searchExpr = Prisma.sql`f_unaccent((first_name || ' ' || last_name) || ' ' || coalesce(document_id, '') || ' ' || mrn)`;
    const conditions = Prisma.join(
      terms.map((term) => Prisma.sql`${searchExpr} ILIKE f_unaccent(${`%${term}%`})`),
      " AND ",
    );

    const matches = await prisma.$queryRaw<Array<{ id: string; total: bigint }>>`
      SELECT id, count(*) OVER() AS total
      FROM patients
      WHERE deleted_at IS NULL AND ${conditions}
      ORDER BY created_at DESC
      LIMIT ${take} OFFSET ${skip}
    `;

    const total = Number(matches[0]?.total ?? 0);
    const ids = matches.map((m) => m.id);
    const rows = await prisma.patient.findMany({
      where: { id: { in: ids } },
      select: listSelect,
    });
    // findMany does not preserve the raw query's order
    const byId = new Map(rows.map((r) => [r.id, r]));
    const ordered = ids.map((id) => byId.get(id)).filter((r): r is PatientListItem => !!r);

    return paginated(ordered, total, skip, take);
  }

  const [rows, total] = await prisma.$transaction([
    prisma.patient.findMany({
      where: { deletedAt: null },
      select: listSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.patient.count({ where: { deletedAt: null } }),
  ]);

  return paginated(rows, total, skip, take);
}

function paginated<T>(rows: T[], total: number, skip: number, take: number): Paginated<T> {
  return {
    rows,
    total,
    page: Math.floor(skip / take) + 1,
    perPage: take,
    pageCount: Math.max(Math.ceil(total / take), 1),
  };
}

export type PatientProfile = NonNullable<Awaited<ReturnType<typeof getPatientProfile>>>;

/** Full 360° profile. Returns null when missing or soft-deleted. */
export async function getPatientProfile(id: string) {
  const patient = await prisma.patient.findFirst({
    where: { id, deletedAt: null },
    include: {
      emergencyContacts: { orderBy: { name: "asc" } },
      insurances: {
        where: { isActive: true },
        include: { provider: { select: { id: true, name: true } } },
      },
    },
  });
  if (!patient) return null;

  return {
    ...patient,
    allergies: (patient.allergies as string[] | null) ?? [],
    insurances: patient.insurances.map((ins) => ({
      ...ins,
      coveragePct: ins.coveragePct.toNumber(), // Decimal is not serializable to client components
    })),
  };
}

export async function getInsuranceProviders() {
  return prisma.insuranceProvider.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
