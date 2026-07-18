"use server";

import { revalidatePath } from "next/cache";
import * as appointmentService from "@/features/appointments/services/appointment.service";
import {
  cancelAppointmentSchema,
  createAppointmentSchema,
  doctorSlotsSchema,
  patientOptionsSchema,
  updateAppointmentStatusSchema,
} from "@/features/appointments/schemas/appointment.schema";
import { getAvailableSlots } from "@/features/appointments/queries/appointment.queries";
import { searchPatients } from "@/features/patients";
import { createSafeAction } from "@/lib/safe-action";

export const createAppointment = createSafeAction({
  schema: createAppointmentSchema,
  permission: "appointments:create",
  audit: { action: "appointments:create", entity: "Appointment" },
  handler: async (input, { user }) => {
    const appointment = await appointmentService.createAppointment(input, user.id);
    revalidatePath("/appointments");
    return appointment;
  },
});

export const updateAppointmentStatus = createSafeAction({
  schema: updateAppointmentStatusSchema,
  permission: "appointments:update",
  audit: { action: "appointments:update-status", entity: "Appointment" },
  handler: async ({ id, status }) => {
    const appointment = await appointmentService.changeAppointmentStatus(id, status);
    revalidatePath("/appointments");
    return appointment;
  },
});

export const cancelAppointment = createSafeAction({
  schema: cancelAppointmentSchema,
  permission: "appointments:cancel",
  audit: { action: "appointments:cancel", entity: "Appointment" },
  handler: async ({ id, reason }) => {
    const appointment = await appointmentService.cancelAppointment(id, reason);
    revalidatePath("/appointments");
    return appointment;
  },
});

// ─── Read actions (React Query fetchers — auth-gated, no audit) ───

export const getDoctorSlots = createSafeAction({
  schema: doctorSlotsSchema,
  permission: "appointments:read",
  handler: ({ doctorId, date }) => getAvailableSlots(doctorId, date),
});

export const getPatientOptions = createSafeAction({
  schema: patientOptionsSchema,
  permission: "patients:read",
  handler: async ({ q }) => {
    const result = await searchPatients({ q, skip: 0, take: 10 });
    return result.rows.map((p) => ({
      id: p.id,
      label: `${p.firstName} ${p.lastName}`,
      sublabel: `${p.mrn}${p.documentId ? ` · ${p.documentId}` : ""}`,
    }));
  },
});
