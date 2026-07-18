"use server";

import { revalidatePath } from "next/cache";
import * as patientService from "@/features/patients/services/patient.service";
import {
  createPatientSchema,
  deleteEmergencyContactSchema,
  deletePatientInsuranceSchema,
  emergencyContactSchema,
  patientIdSchema,
  patientInsuranceSchema,
  updatePatientSchema,
} from "@/features/patients/schemas/patient.schema";
import { createSafeAction } from "@/lib/safe-action";

export const createPatient = createSafeAction({
  schema: createPatientSchema,
  permission: "patients:create",
  audit: { action: "patients:create", entity: "Patient" },
  handler: async (input) => {
    const patient = await patientService.createPatient(input);
    revalidatePath("/patients");
    return patient;
  },
});

export const updatePatient = createSafeAction({
  schema: updatePatientSchema,
  permission: "patients:update",
  audit: { action: "patients:update", entity: "Patient" },
  handler: async ({ id, ...values }) => {
    const patient = await patientService.updatePatient(id, values);
    revalidatePath("/patients");
    revalidatePath(`/patients/${id}`);
    return patient;
  },
});

export const deletePatient = createSafeAction({
  schema: patientIdSchema,
  permission: "patients:delete",
  audit: { action: "patients:delete", entity: "Patient" },
  handler: async ({ id }) => {
    const patient = await patientService.softDeletePatient(id);
    revalidatePath("/patients");
    return patient;
  },
});

export const addEmergencyContact = createSafeAction({
  schema: emergencyContactSchema,
  permission: "patients:update",
  audit: { action: "patients:add-contact", entity: "EmergencyContact" },
  handler: async (input) => {
    const contact = await patientService.addEmergencyContact(input);
    revalidatePath(`/patients/${input.patientId}`);
    return contact;
  },
});

export const deleteEmergencyContact = createSafeAction({
  schema: deleteEmergencyContactSchema,
  permission: "patients:update",
  audit: { action: "patients:delete-contact", entity: "EmergencyContact" },
  handler: async ({ contactId, patientId }) => {
    const contact = await patientService.deleteEmergencyContact(contactId);
    revalidatePath(`/patients/${patientId}`);
    return contact;
  },
});

export const addPatientInsurance = createSafeAction({
  schema: patientInsuranceSchema,
  permission: "patients:update",
  audit: { action: "patients:add-insurance", entity: "PatientInsurance" },
  handler: async (input) => {
    const insurance = await patientService.addPatientInsurance(input);
    revalidatePath(`/patients/${input.patientId}`);
    return insurance;
  },
});

export const removePatientInsurance = createSafeAction({
  schema: deletePatientInsuranceSchema,
  permission: "patients:update",
  audit: { action: "patients:remove-insurance", entity: "PatientInsurance" },
  handler: async ({ insuranceId, patientId }) => {
    const insurance = await patientService.removePatientInsurance(insuranceId);
    revalidatePath(`/patients/${patientId}`);
    return insurance;
  },
});
