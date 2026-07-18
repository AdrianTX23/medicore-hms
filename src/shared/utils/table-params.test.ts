import { describe, expect, it } from "vitest";
import { parseTableParams } from "./table-params";

describe("parseTableParams", () => {
  it("defaults page and perPage when nothing is provided", () => {
    const result = parseTableParams({});
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(10);
    expect(result.skip).toBe(0);
    expect(result.take).toBe(10);
  });

  it("computes skip/take from page and perPage", () => {
    const result = parseTableParams({ page: "3", perPage: "20" });
    expect(result.skip).toBe(40);
    expect(result.take).toBe(20);
  });

  // Regression / security test: a malicious client passing an enormous
  // perPage must never be able to force an unbounded DB read. `.max(100)`
  // doesn't clamp — it fails validation, and `.catch(10)` takes over — so
  // an out-of-range value falls all the way back to the safe default, not
  // just to the ceiling. Confirm the ceiling still holds as documentation
  // of the contract, and that nothing above it can ever get through.
  it("never lets perPage through above 100 — falls back to the safe default instead", () => {
    const result = parseTableParams({ perPage: "1000000" });
    expect(result.perPage).toBeLessThanOrEqual(100);
    expect(result.perPage).toBe(10);
    expect(result.take).toBe(10);
  });

  it("accepts perPage values within the allowed 5-100 range as-is", () => {
    expect(parseTableParams({ perPage: "100" }).perPage).toBe(100);
    expect(parseTableParams({ perPage: "5" }).perPage).toBe(5);
  });

  it("falls back to the default instead of throwing on garbage input", () => {
    expect(() => parseTableParams({ page: "not-a-number", perPage: "also-not" })).not.toThrow();
    const result = parseTableParams({ page: "not-a-number", perPage: "also-not" });
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(10);
  });

  it("rejects a page below 1 by falling back to the default", () => {
    const result = parseTableParams({ page: "-5" });
    expect(result.page).toBe(1);
  });

  it("rejects a perPage below the minimum by falling back to the default", () => {
    const result = parseTableParams({ perPage: "0" });
    expect(result.perPage).toBe(10);
  });

  it("trims and caps the free-text search query length", () => {
    const result = parseTableParams({ q: "  Rosa Fernández  " });
    expect(result.q).toBe("Rosa Fernández");
  });

  it("defaults sort direction to desc and accepts asc explicitly", () => {
    expect(parseTableParams({}).dir).toBe("desc");
    expect(parseTableParams({ dir: "asc" }).dir).toBe("asc");
    expect(parseTableParams({ dir: "sideways" }).dir).toBe("desc");
  });
});
