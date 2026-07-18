import { z } from "zod";

export const admitPatientSchema = z.object({
  patientId: z.string().uuid("Selecciona un paciente"),
  bedId: z.string().uuid("Selecciona una cama"),
  attendingDoctorId: z.string().uuid("Selecciona un médico responsable"),
  admissionDiagnosis: z
    .string()
    .trim()
    .min(3, "Indica el diagnóstico de ingreso")
    .max(300, "Máximo 300 caracteres"),
});

export type AdmitPatientInput = z.infer<typeof admitPatientSchema>;

export const transferBedSchema = z.object({
  admissionId: z.string().uuid(),
  toBedId: z.string().uuid("Selecciona la cama de destino"),
  reason: z.string().trim().max(300).optional(),
});

export const dischargePatientSchema = z.object({
  admissionId: z.string().uuid(),
  dischargeSummary: z
    .string()
    .trim()
    .min(3, "Indica el resumen de alta")
    .max(2000, "Máximo 2000 caracteres"),
});

export const markBedAvailableSchema = z.object({
  bedId: z.string().uuid(),
});
