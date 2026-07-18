import { describe, expect, it } from "vitest";
import { dayRange } from "./day-range";

describe("dayRange", () => {
  it("returns a 24-hour window starting at local midnight", () => {
    const { start, end } = dayRange("2026-07-18");
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(6); // 0-indexed: July
    expect(start.getDate()).toBe(18);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("rolls over correctly at a month boundary", () => {
    const { start, end } = dayRange("2026-07-31");
    expect(start.getDate()).toBe(31);
    expect(end.getMonth()).toBe(7); // August
    expect(end.getDate()).toBe(1);
  });

  it("rolls over correctly at a year boundary", () => {
    const { end } = dayRange("2026-12-31");
    expect(end.getFullYear()).toBe(2027);
    expect(end.getMonth()).toBe(0);
    expect(end.getDate()).toBe(1);
  });

  it("builds the date from local Date parts, not by parsing as a UTC ISO string", () => {
    // This is the exact bug class that made the dashboard trend chart bucket
    // appointments into the wrong weekday at night: `new Date("2026-07-18")`
    // parses as UTC midnight, which is a different local day in most
    // timezones. `dayRange` must use `new Date(y, m-1, d)` instead.
    const { start } = dayRange("2026-07-18");
    expect(start.getTime()).toBe(new Date(2026, 6, 18).getTime());
  });
});
