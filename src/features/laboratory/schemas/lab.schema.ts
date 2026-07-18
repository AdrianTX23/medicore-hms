import { z } from "zod";

export const createLabOrderSchema = z.object({
  encounterId: z.string().uuid(),
  labTestIds: z.array(z.string().uuid()).min(1, "Selecciona al menos un examen"),
  priority: z.enum(["ROUTINE", "URGENT", "STAT"]).default("ROUTINE"),
  notes: z.string().trim().max(500).optional(),
});

export const collectSampleSchema = z.object({
  labOrderId: z.string().uuid(),
});

export const startProcessingSchema = z.object({
  labOrderId: z.string().uuid(),
});

export const enterResultSchema = z.object({
  labOrderItemId: z.string().uuid(),
  value: z.string().trim().min(1, "Indica el valor del resultado").max(100),
  notes: z.string().trim().max(300).optional(),
});

export const completeLabOrderSchema = z.object({
  labOrderId: z.string().uuid(),
});

export const validateLabOrderSchema = z.object({
  labOrderId: z.string().uuid(),
});

export const cancelLabOrderSchema = z.object({
  labOrderId: z.string().uuid(),
});

export const labTestOptionsSchema = z.object({
  q: z.string().trim().max(100).optional(),
});
