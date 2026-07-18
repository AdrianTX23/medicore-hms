/**
 * Pure lab-result domain logic — no Prisma/DB import, so it's testable
 * without a database and safe to import from either services or queries.
 */

export type ReferenceRange = {
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
