import { describe, expect, it } from "vitest";
import type { AppointmentStatus } from "@/generated/prisma/enums";
import { APPOINTMENT_TRANSITIONS, CANCELLABLE_STATUSES } from "./constants";

const ALL_STATUSES: AppointmentStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

describe("appointment state machine", () => {
  it("has a transition list for every status", () => {
    expect(Object.keys(APPOINTMENT_TRANSITIONS).sort()).toEqual([...ALL_STATUSES].sort());
  });

  it("only points to valid statuses", () => {
    const known = new Set(ALL_STATUSES);
    for (const [from, targets] of Object.entries(APPOINTMENT_TRANSITIONS)) {
      for (const to of targets) {
        expect(known.has(to), `${from} -> ${to} is not a real status`).toBe(true);
      }
    }
  });

  it("has no terminal status pointing forward (COMPLETED, CANCELLED, NO_SHOW are dead ends)", () => {
    expect(APPOINTMENT_TRANSITIONS.COMPLETED).toEqual([]);
    expect(APPOINTMENT_TRANSITIONS.CANCELLED).toEqual([]);
    expect(APPOINTMENT_TRANSITIONS.NO_SHOW).toEqual([]);
  });

  it("never allows skipping straight from SCHEDULED to COMPLETED", () => {
    expect(APPOINTMENT_TRANSITIONS.SCHEDULED).not.toContain("COMPLETED");
  });

  it("only lets an appointment be cancelled while it's still scheduled or confirmed", () => {
    expect(CANCELLABLE_STATUSES).toEqual(["SCHEDULED", "CONFIRMED"]);
  });
});
