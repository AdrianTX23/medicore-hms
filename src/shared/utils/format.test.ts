import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatAge, formatCurrency, formatDateOnly } from "./format";

describe("formatCurrency", () => {
  it("formats a number as EUR", () => {
    expect(formatCurrency(30)).toContain("30");
    expect(formatCurrency(30)).toContain("€");
  });

  it("accepts a numeric string (as returned by some Decimal-adjacent inputs)", () => {
    expect(formatCurrency("1250.5")).toBe(formatCurrency(1250.5));
  });

  it("formats zero without throwing", () => {
    expect(() => formatCurrency(0)).not.toThrow();
  });
});

describe("formatDateOnly — UTC-safe DATE-column formatting", () => {
  // Regression test: DATE columns (birth dates) are stored at UTC midnight.
  // Formatting them with the LOCAL timezone shifted the displayed day back
  // by one in any timezone behind UTC — this is why formatDateOnly pins
  // the formatter to timeZone: "UTC" instead of using the machine's local zone.
  it("shows the same calendar day that was stored, regardless of local timezone", () => {
    const storedBirthDate = new Date("2000-01-15T00:00:00.000Z");
    const formatted = formatDateOnly(storedBirthDate);
    expect(formatted).toContain("15");
    expect(formatted).not.toContain("14");
  });

  it("does not roll a UTC-midnight date back a day", () => {
    const newYearUtcMidnight = new Date("2026-01-01T00:00:00.000Z");
    const formatted = formatDateOnly(newYearUtcMidnight);
    expect(formatted).toContain("2026");
    expect(formatted).not.toContain("2025");
  });
});

describe("formatAge — UTC-aware birth date math", () => {
  beforeEach(() => {
    // Fix "now" so the birthday-already-happened-this-year branch is
    // deterministic no matter what day/timezone the test suite runs in.
    // Noon UTC on a mid-year day gives comfortable margin either side.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-18T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts a full year once this year's birthday (UTC) has already passed", () => {
    // Born January — birthday is long past relative to the fixed July "now".
    expect(formatAge(new Date("1996-01-15T00:00:00.000Z"))).toBe("30 años");
  });

  it("does not count this year yet if the birthday (UTC) hasn't happened", () => {
    // Born December — birthday hasn't happened yet relative to July "now".
    expect(formatAge(new Date("1996-12-25T00:00:00.000Z"))).toBe("29 años");
  });
});
