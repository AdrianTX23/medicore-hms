import { z } from "zod";

const isoDateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha inválida");

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid("Selecciona un paciente"),
  doctorId: z.string().uuid("Selecciona un médico"),
  /** Full ISO timestamp of the chosen slot. */
  scheduledAt: z
    .string()
    .min(1, "Selecciona un horario")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Horario inválido"),
  reason: z
    .string()
    .trim()
    .min(3, "Indica el motivo de la cita")
    .max(300, "Máximo 300 caracteres"),
});

export const updateAppointmentStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["CONFIRMED", "IN_PROGRESS", "COMPLETED", "NO_SHOW"]),
});

export const cancelAppointmentSchema = z.object({
  id: z.string().uuid(),
  reason: z
    .string()
    .trim()
    .min(3, "Indica el motivo de la cancelación")
    .max(300, "Máximo 300 caracteres"),
});

export const doctorSlotsSchema = z.object({
  doctorId: z.string().uuid(),
  date: isoDateOnly,
});

export const patientOptionsSchema = z.object({
  q: z.string().trim().max(100).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
