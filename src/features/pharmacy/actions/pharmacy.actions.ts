"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as pharmacyService from "@/features/pharmacy/services/pharmacy.service";
import { getMedicationOptions } from "@/features/pharmacy/queries/pharmacy.queries";
import {
  addInventoryBatchSchema,
  adjustInventorySchema,
  dispensePrescriptionSchema,
} from "@/features/pharmacy/schemas/pharmacy.schema";
import { createSafeAction } from "@/lib/safe-action";

export const dispensePrescription = createSafeAction({
  schema: dispensePrescriptionSchema,
  permission: "pharmacy:dispense",
  audit: { action: "pharmacy:dispense", entity: "Prescription" },
  handler: async ({ prescriptionId }, { user }) => {
    const result = await pharmacyService.dispensePrescription(prescriptionId, user);
    revalidatePath("/pharmacy");
    return result;
  },
});

export const addInventoryBatch = createSafeAction({
  schema: addInventoryBatchSchema,
  permission: "pharmacy:inventory",
  audit: { action: "pharmacy:add-batch", entity: "InventoryItem" },
  handler: async (input, { user }) => {
    const result = await pharmacyService.addInventoryBatch(input, user);
    revalidatePath("/pharmacy");
    return result;
  },
});

export const adjustInventory = createSafeAction({
  schema: adjustInventorySchema,
  permission: "pharmacy:inventory",
  audit: { action: "pharmacy:adjust-inventory", entity: "InventoryItem" },
  handler: async (input, { user }) => {
    const result = await pharmacyService.adjustInventory(input, user);
    revalidatePath("/pharmacy");
    return result;
  },
});

// ─── Read actions (React Query fetchers) ───

export const getMedications = createSafeAction({
  schema: z.object({}),
  permission: "pharmacy:inventory",
  handler: () => getMedicationOptions(),
});
