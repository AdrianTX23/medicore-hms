"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as encounterService from "@/features/encounters/services/encounter.service";
import {
  addAddendumSchema,
  addDiagnosisSchema,
  cancelPrescriptionSchema,
  closeEncounterSchema,
  createPrescriptionSchema,
  icd10SearchSchema,
  recordVitalsSchema,
  removeDiagnosisSchema,
  startEncounterSchema,
  updateEncounterNotesSchema,
} from "@/features/encounters/schemas/encounter.schema";
import {
  getMedicationOptions,
  searchIcd10,
} from "@/features/encounters/queries/encounter.queries";
import { createSafeAction } from "@/lib/safe-action";

function revalidateEncounter(encounterId: string) {
  revalidatePath("/encounters");
  revalidatePath(`/encounters/${encounterId}`);
}

export const startEncounter = createSafeAction({
  schema: startEncounterSchema,
  permission: "encounters:create",
  audit: { action: "encounters:start", entity: "Encounter" },
  handler: async ({ appointmentId }, { user }) => {
    const result = await encounterService.startFromAppointment(appointmentId, user);
    revalidatePath("/appointments");
    revalidatePath("/encounters");
    return result;
  },
});

export const recordVitals = createSafeAction({
  schema: recordVitalsSchema,
  permission: "encounters:vitals",
  audit: { action: "encounters:vitals", entity: "VitalSign" },
  handler: async (input, { user }) => {
    const result = await encounterService.recordVitals(input, user);
    revalidateEncounter(input.encounterId);
    return result;
  },
});

export const updateEncounterNotes = createSafeAction({
  schema: updateEncounterNotesSchema,
  permission: "encounters:update",
  audit: { action: "encounters:update-notes", entity: "Encounter" },
  handler: async (input, { user }) => {
    const result = await encounterService.updateNotes(input, user);
    revalidateEncounter(input.encounterId);
    return result;
  },
});

export const addDiagnosis = createSafeAction({
  schema: addDiagnosisSchema,
  permission: "encounters:update",
  audit: { action: "encounters:add-diagnosis", entity: "Diagnosis" },
  handler: async (input, { user }) => {
    const result = await encounterService.addDiagnosis(input, user);
    revalidateEncounter(input.encounterId);
    return result;
  },
});

export const removeDiagnosis = createSafeAction({
  schema: removeDiagnosisSchema,
  permission: "encounters:update",
  audit: { action: "encounters:remove-diagnosis", entity: "Diagnosis" },
  handler: async ({ diagnosisId, encounterId }, { user }) => {
    const result = await encounterService.removeDiagnosis(diagnosisId, encounterId, user);
    revalidateEncounter(encounterId);
    return result;
  },
});

export const createPrescription = createSafeAction({
  schema: createPrescriptionSchema,
  permission: "prescriptions:create",
  audit: { action: "prescriptions:create", entity: "Prescription" },
  handler: async (input, { user }) => {
    const result = await encounterService.createPrescription(input, user);
    revalidateEncounter(input.encounterId);
    return result;
  },
});

export const cancelPrescription = createSafeAction({
  schema: cancelPrescriptionSchema,
  permission: "prescriptions:cancel",
  audit: { action: "prescriptions:cancel", entity: "Prescription" },
  handler: async ({ prescriptionId, encounterId }, { user }) => {
    const result = await encounterService.cancelPrescription(prescriptionId, encounterId, user);
    revalidateEncounter(encounterId);
    return result;
  },
});

export const closeEncounter = createSafeAction({
  schema: closeEncounterSchema,
  permission: "encounters:close",
  audit: { action: "encounters:close", entity: "Encounter" },
  handler: async ({ encounterId }, { user }) => {
    const result = await encounterService.closeEncounter(encounterId, user);
    revalidateEncounter(encounterId);
    revalidatePath("/appointments");
    return result;
  },
});

export const addAddendum = createSafeAction({
  schema: addAddendumSchema,
  permission: "encounters:addendum",
  audit: { action: "encounters:addendum", entity: "EncounterAddendum" },
  handler: async ({ encounterId, note }, { user }) => {
    const result = await encounterService.addAddendum(encounterId, note, user);
    revalidateEncounter(encounterId);
    return result;
  },
});

// ─── Read actions (React Query fetchers) ───

export const searchIcd10Codes = createSafeAction({
  schema: icd10SearchSchema,
  permission: "encounters:read",
  handler: ({ q }) => searchIcd10(q),
});

export const getMedications = createSafeAction({
  schema: z.object({}),
  permission: "prescriptions:read",
  handler: () => getMedicationOptions(),
});
