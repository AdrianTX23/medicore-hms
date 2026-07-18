import { describe, expect, it } from "vitest";
import {
  admitPatientSchema,
  dischargePatientSchema,
  transferBedSchema,
} from "./admission.schema";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const BED_UUID = "22222222-2222-4222-8222-222222222222";
const DOCTOR_UUID = "33333333-3333-4333-8333-333333333333";

function validAdmitInput() {
  return {
    patientId: VALID_UUID,
    bedId: BED_UUID,
    attendingDoctorId: DOCTOR_UUID,
    admissionDiagnosis: "Neumonía adquirida en la comunidad",
  };
}

describe("admitPatientSchema", () => {
  it("accepts a well-formed admission", () => {
    expect(admitPatientSchema.safeParse(validAdmitInput()).success).toBe(true);
  });

  it("rejects a diagnosis shorter than 3 characters", () => {
    const result = admitPatientSchema.safeParse({ ...validAdmitInput(), admissionDiagnosis: "ok" });
    expect(result.success).toBe(false);
  });

  it("rejects a diagnosis over 300 characters", () => {
    const result = admitPatientSchema.safeParse({
      ...validAdmitInput(),
      admissionDiagnosis: "x".repeat(301),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-UUID bedId", () => {
    const result = admitPatientSchema.safeParse({ ...validAdmitInput(), bedId: "301-A" });
    expect(result.success).toBe(false);
  });
});

describe("transferBedSchema", () => {
  it("accepts a transfer without a reason (optional field)", () => {
    const result = transferBedSchema.safeParse({
      admissionId: VALID_UUID,
      toBedId: BED_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a reason over 300 characters", () => {
    const result = transferBedSchema.safeParse({
      admissionId: VALID_UUID,
      toBedId: BED_UUID,
      reason: "x".repeat(301),
    });
    expect(result.success).toBe(false);
  });
});

describe("dischargePatientSchema", () => {
  it("requires a discharge summary of at least 3 characters", () => {
    expect(
      dischargePatientSchema.safeParse({ admissionId: VALID_UUID, dischargeSummary: "" }).success,
    ).toBe(false);
    expect(
      dischargePatientSchema.safeParse({ admissionId: VALID_UUID, dischargeSummary: "Alta en buen estado general" })
        .success,
    ).toBe(true);
  });

  it("rejects a summary over 2000 characters", () => {
    const result = dischargePatientSchema.safeParse({
      admissionId: VALID_UUID,
      dischargeSummary: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});
