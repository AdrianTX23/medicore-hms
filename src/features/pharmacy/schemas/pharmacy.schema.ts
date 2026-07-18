import { z } from "zod";

export const dispensePrescriptionSchema = z.object({
  prescriptionId: z.string().uuid(),
});

export const addInventoryBatchSchema = z.object({
  medicationId: z.string().uuid("Selecciona un medicamento"),
  batchNumber: z.string().trim().min(1, "Indica el número de lote").max(50),
  expiryDate: z
    .string()
    .min(1, "Indica la fecha de vencimiento")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha inválida")
    .refine((v) => new Date(v) > new Date(), "La fecha de vencimiento debe ser futura"),
  quantity: z.coerce.number().int().min(1, "Mínimo 1 unidad"),
  unitCost: z.coerce.number().min(0, "El costo no puede ser negativo"),
  reorderLevel: z.coerce.number().int().min(0).default(10),
});

export const adjustInventorySchema = z.object({
  inventoryItemId: z.string().uuid(),
  quantity: z.coerce.number().int().refine((v) => v !== 0, "La cantidad no puede ser cero"),
  reason: z.string().trim().min(3, "Indica el motivo del ajuste").max(200),
});
