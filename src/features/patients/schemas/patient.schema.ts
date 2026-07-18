import { z } from "zod";

/** Empty-string inputs from optional form fields become undefined. */
const optionalTrimmed = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

export const patientFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(60, "Máximo 60 caracteres"),
  lastName: z
    .string()
    .trim()
    .min(2, "Los apellidos deben tener al menos 2 caracteres")
    .max(80, "Máximo 80 caracteres"),
  documentId: optionalTrimmed,
  birthDate: z
    .string()
    .min(1, "La fecha de nacimiento es obligatoria")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha inválida")
    .refine((v) => new Date(v) <= new Date(), "La fecha no puede ser futura")
    .refine(
      (v) => new Date(v) > new Date(Date.now() - 120 * 365.25 * 24 * 3600 * 1000),
      "Fecha demasiado antigua",
    ),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Selecciona el sexo" }),
  bloodType: z
    .enum(["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"])
    .optional(),
  phone: optionalTrimmed,
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .optional()
    .refine((v) => v === undefined || z.string().email().safeParse(v).success, {
      message: "Correo inválido",
    }),
  address: optionalTrimmed,
  /** One allergy per line in the textarea — the service splits it into a JSON array. */
  allergies: optionalTrimmed,
  notes: optionalTrimmed,
});

export type PatientFormInput = z.input<typeof patientFormSchema>;
export type PatientFormValues = z.output<typeof patientFormSchema>;

export const createPatientSchema = patientFormSchema;

export const updatePatientSchema = patientFormSchema.extend({
  id: z.string().uuid(),
});

export const patientIdSchema = z.object({
  id: z.string().uuid(),
});

export const emergencyContactSchema = z.object({
  patientId: z.string().uuid(),
  name: z.string().trim().min(2, "El nombre es obligatorio").max(100),
  relationship: z.string().trim().min(2, "El parentesco es obligatorio").max(50),
  phone: z.string().trim().min(5, "El teléfono es obligatorio").max(30),
});

export const deleteEmergencyContactSchema = z.object({
  contactId: z.string().uuid(),
  patientId: z.string().uuid(),
});

export const patientInsuranceSchema = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid("Selecciona una aseguradora"),
  policyNumber: z.string().trim().min(2, "El número de póliza es obligatorio").max(50),
  coveragePct: z.coerce
    .number()
    .min(0, "Mínimo 0%")
    .max(100, "Máximo 100%"),
  validUntil: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || !Number.isNaN(Date.parse(v)), "Fecha inválida"),
});

export const deletePatientInsuranceSchema = z.object({
  insuranceId: z.string().uuid(),
  patientId: z.string().uuid(),
});
