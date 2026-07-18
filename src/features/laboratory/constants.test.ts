import { describe, expect, it } from "vitest";
import type { LabOrderStatus } from "@/generated/prisma/enums";
import { LAB_ORDER_TRANSITIONS } from "./constants";

const ALL_STATUSES: LabOrderStatus[] = [
  "ORDERED",
  "SAMPLE_COLLECTED",
  "IN_PROGRESS",
  "COMPLETED",
  "VALIDATED",
  "CANCELLED",
];

describe("lab order state machine", () => {
  it("has a transition list for every status", () => {
    expect(Object.keys(LAB_ORDER_TRANSITIONS).sort()).toEqual([...ALL_STATUSES].sort());
  });

  it("only points to valid statuses", () => {
    const known = new Set(ALL_STATUSES);
    for (const [from, targets] of Object.entries(LAB_ORDER_TRANSITIONS)) {
      for (const to of targets) {
        expect(known.has(to), `${from} -> ${to} is not a real status`).toBe(true);
      }
    }
  });

  it("moves strictly forward — a result can't be validated before it's completed", () => {
    expect(LAB_ORDER_TRANSITIONS.ORDERED).not.toContain("VALIDATED");
    expect(LAB_ORDER_TRANSITIONS.SAMPLE_COLLECTED).not.toContain("VALIDATED");
  });

  it("has no exit from a validated or cancelled order", () => {
    expect(LAB_ORDER_TRANSITIONS.VALIDATED).toEqual([]);
    expect(LAB_ORDER_TRANSITIONS.CANCELLED).toEqual([]);
  });
});
