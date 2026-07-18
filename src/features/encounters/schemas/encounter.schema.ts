import { z } from "zod";

export const startEncounterSchema = z.object({
  appointmentId: z.string().uuid(),
});

const vitalRange = (min: number, max: number) =>
  z.coerce.number().min(min, `Mínimo ${min}`).max(max, `Máximo ${max}`).optional();

/** Empty inputs arrive as "" — treat them as absent before coercion. */
const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const recordVitalsSchema = z
  .object({
    encounterId: z.string().uuid(),
    temperatureC: z.preprocess(emptyToUndefined, vitalRange(30, 45)),
    systolic: z.preprocess(emptyToUndefined, vitalRange(50, 260)),
    diastolic: z.preprocess(emptyToUndefined, vitalRange(30, 200)),
    heartRate: z.preprocess(emptyToUndefined, vitalRange(20, 250)),
    respiratoryRate: z.preprocess(emptyToUndefined, vitalRange(5, 80)),
    spo2: z.preprocess(emptyToUndefined, vitalRange(50, 100)),
    weightKg: z.preprocess(emptyToUndefined, vitalRange(0.5, 400)),
    heightCm: z.preprocess(emptyToUndefined, vitalRange(20, 250)),
  })
  .refine(
    (v) =>
      [v.temperatureC, v.systolic, v.diastolic, v.heartRate, v.respiratoryRate, v.spo2, v.weightKg, v.heightCm].some(
        (x) => x !== undefined,
      ),
    { message: "Registra al menos un signo vital", path: ["temperatureC"] },
  );

export const updateEncounterNotesSchema = z.object({
  encounterId: z.string().uuid(),
  chiefComplaint: z.string().trim().min(3, "Indica el motivo de consulta").max(300),
  notes: z.string().trim().max(5000).optional(),
  treatmentPlan: z.string().trim().max(5000).optional(),
});

export const addDiagnosisSchema = z.object({
  encounterId: z.string().uuid(),
  icd10Code: z.string().min(1, "Selecciona un diagnóstico CIE-10"),
  description: z.string().trim().max(300).optional(),
  isPrimary: z.boolean().default(false),
});

export const removeDiagnosisSchema = z.object({
  diagnosisId: z.string().uuid(),
  encounterId: z.string().uuid(),
});

export const createPrescriptionSchema = z.object({
  encounterId: z.string().uuid(),
  notes: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        medicationId: z.string().uuid("Selecciona un medicamento"),
        dosage: z.string().trim().min(1, "Indica la dosis").max(100),
        frequency: z.string().trim().min(1, "Indica la frecuencia").max(100),
        durationDays: z.coerce.number().int().min(1, "Mínimo 1 día").max(365),
      }),
    )
    .min(1, "Añade al menos un medicamento"),
});

export const cancelPrescriptionSchema = z.object({
  prescriptionId: z.string().uuid(),
  encounterId: z.string().uuid(),
});

export const closeEncounterSchema = z.object({
  encounterId: z.string().uuid(),
});

export const addAddendumSchema = z.object({
  encounterId: z.string().uuid(),
  note: z.string().trim().min(3, "El addendum no puede estar vacío").max(2000),
});

export const icd10SearchSchema = z.object({
  q: z.string().trim().max(100).optional(),
});
