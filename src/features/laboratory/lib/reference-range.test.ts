import { describe, expect, it } from "vitest";
import { isAbnormal, matchReferenceRange } from "./reference-range";

function patient(overrides: Partial<{ gender: "MALE" | "FEMALE" | "OTHER"; birthDate: Date }> = {}) {
  const thirtyYearsAgo = new Date();
  thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);
  return { gender: "MALE" as const, birthDate: thirtyYearsAgo, ...overrides };
}

describe("matchReferenceRange", () => {
  it("returns null when ranges isn't an array (malformed/missing catalog data)", () => {
    expect(matchReferenceRange(null, patient())).toBeNull();
    expect(matchReferenceRange(undefined, patient())).toBeNull();
    expect(matchReferenceRange({ low: 1 }, patient())).toBeNull();
  });

  it("returns null when no range matches the patient", () => {
    const ranges = [{ sex: "FEMALE", low: 10, high: 20 }];
    expect(matchReferenceRange(ranges, patient({ gender: "MALE" }))).toBeNull();
  });

  it("matches a sex-specific range", () => {
    const ranges = [
      { sex: "MALE", low: 13, high: 17 },
      { sex: "FEMALE", low: 12, high: 15 },
    ];
    expect(matchReferenceRange(ranges, patient({ gender: "FEMALE" }))).toEqual({ sex: "FEMALE", low: 12, high: 15 });
  });

  it("treats an unset sex or ANY as matching everyone", () => {
    const ranges = [{ sex: "ANY", low: 0, high: 100 }];
    expect(matchReferenceRange(ranges, patient({ gender: "OTHER" }))).toEqual(ranges[0]);
  });

  it("matches an age-bounded range and excludes patients outside it", () => {
    const child = [{ ageMin: 0, ageMax: 12, low: 1, high: 2 }];
    const adult = patient({ gender: "MALE" }); // 30 years old
    expect(matchReferenceRange(child, adult)).toBeNull();

    const infant = patient({ birthDate: new Date(Date.now() - 5 * 365.25 * 24 * 3600 * 1000) });
    expect(matchReferenceRange(child, infant)).toEqual(child[0]);
  });
});

describe("isAbnormal", () => {
  const range = { low: 10, high: 20 };

  it("returns null when there's no range to judge against", () => {
    expect(isAbnormal("15", null)).toBeNull();
    expect(isAbnormal("15", { sex: "ANY" })).toBeNull(); // no low/high
  });

  it("returns null for non-numeric results (can't judge free text)", () => {
    expect(isAbnormal("positivo", range)).toBeNull();
    expect(isAbnormal("", range)).toBeNull();
  });

  it("flags values below the low bound as abnormal", () => {
    expect(isAbnormal("9.9", range)).toBe(true);
  });

  it("flags values above the high bound as abnormal", () => {
    expect(isAbnormal("20.1", range)).toBe(true);
  });

  it("treats the bounds themselves as normal (inclusive range)", () => {
    expect(isAbnormal("10", range)).toBe(false);
    expect(isAbnormal("20", range)).toBe(false);
  });

  it("treats a mid-range value as normal", () => {
    expect(isAbnormal("15", range)).toBe(false);
  });
});
