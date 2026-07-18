import { z } from "zod";

export const generateInvoiceFromEncounterSchema = z.object({
  encounterId: z.string().uuid(),
});

export const invoiceLineInputSchema = z.object({
  serviceId: z.string().uuid("Selecciona un servicio"),
  quantity: z.coerce.number().int().min(1, "Mínimo 1").max(99, "Máximo 99"),
});

export const createManualInvoiceSchema = z.object({
  patientId: z.string().uuid("Selecciona un paciente"),
  items: z.array(invoiceLineInputSchema).min(1, "Añade al menos un servicio"),
});

export const issueInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const voidInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  method: z.enum(["CASH", "CARD", "TRANSFER", "INSURANCE"]),
  reference: z.string().trim().max(100).optional(),
});

export const encounterOptionsSchema = z.object({
  q: z.string().trim().max(100).optional(),
});
