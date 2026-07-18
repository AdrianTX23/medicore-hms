import { describe, expect, it } from "vitest";
import { createAppointmentSchema } from "./appointment.schema";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const OTHER_UUID = "22222222-2222-4222-8222-222222222222";

function validInput() {
  return {
    patientId: VALID_UUID,
    doctorId: OTHER_UUID,
    scheduledAt: "2026-08-01T10:00:00.000Z",
    reason: "Control de tensión arterial",
  };
}

describe("createAppointmentSchema", () => {
  it("accepts a well-formed submission", () => {
    const result = createAppointmentSchema.safeParse(validInput());
    expect(result.success).toBe(true);
  });

  it("rejects a non-UUID patientId (e.g. a stray string from a broken combobox)", () => {
    const result = createAppointmentSchema.safeParse({ ...validInput(), patientId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing/empty scheduledAt", () => {
    const result = createAppointmentSchema.safeParse({ ...validInput(), scheduledAt: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a scheduledAt that isn't a parseable date", () => {
    const result = createAppointmentSchema.safeParse({ ...validInput(), scheduledAt: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("rejects a reason shorter than 3 characters after trimming", () => {
    const result = createAppointmentSchema.safeParse({ ...validInput(), reason: "  a  " });
    expect(result.success).toBe(false);
  });

  it("rejects a reason over 300 characters (storage-abuse guard)", () => {
    const result = createAppointmentSchema.safeParse({ ...validInput(), reason: "x".repeat(301) });
    expect(result.success).toBe(false);
  });

  it("trims surrounding whitespace from the reason", () => {
    const result = createAppointmentSchema.safeParse({ ...validInput(), reason: "  Control  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.reason).toBe("Control");
  });
});
