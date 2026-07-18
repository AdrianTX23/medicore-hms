"use server";

import { revalidatePath } from "next/cache";
import * as admissionService from "@/features/admissions/services/admission.service";
import {
  admitPatientSchema,
  dischargePatientSchema,
  markBedAvailableSchema,
  transferBedSchema,
} from "@/features/admissions/schemas/admission.schema";
import { createSafeAction } from "@/lib/safe-action";

function revalidateAdmissions(admissionId?: string) {
  revalidatePath("/admissions");
  if (admissionId) revalidatePath(`/admissions/${admissionId}`);
}

export const admitPatient = createSafeAction({
  schema: admitPatientSchema,
  permission: "admissions:create",
  audit: { action: "admissions:admit", entity: "Admission" },
  handler: async (input) => {
    const result = await admissionService.admitPatient(input);
    revalidateAdmissions();
    return result;
  },
});

export const transferBed = createSafeAction({
  schema: transferBedSchema,
  permission: "admissions:update",
  audit: { action: "admissions:transfer", entity: "BedTransfer" },
  handler: async (input) => {
    const result = await admissionService.transferBed(input);
    revalidateAdmissions(input.admissionId);
    return result;
  },
});

export const dischargePatient = createSafeAction({
  schema: dischargePatientSchema,
  permission: "admissions:update",
  audit: { action: "admissions:discharge", entity: "Admission" },
  handler: async (input) => {
    const result = await admissionService.dischargePatient(input);
    revalidateAdmissions(input.admissionId);
    return result;
  },
});

export const markBedAvailable = createSafeAction({
  schema: markBedAvailableSchema,
  permission: "admissions:update",
  audit: { action: "admissions:mark-bed-available", entity: "Bed" },
  handler: async ({ bedId }) => {
    const result = await admissionService.markBedAvailable(bedId);
    revalidateAdmissions();
    return result;
  },
});
