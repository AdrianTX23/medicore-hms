"use server";

import { revalidatePath } from "next/cache";
import * as labService from "@/features/laboratory/services/lab.service";
import {
  cancelLabOrderSchema,
  collectSampleSchema,
  completeLabOrderSchema,
  createLabOrderSchema,
  enterResultSchema,
  labTestOptionsSchema,
  startProcessingSchema,
  validateLabOrderSchema,
} from "@/features/laboratory/schemas/lab.schema";
import { getLabTestOptions } from "@/features/laboratory/queries/lab.queries";
import { createSafeAction } from "@/lib/safe-action";

function revalidateLab(labOrderId?: string) {
  revalidatePath("/laboratory");
  if (labOrderId) revalidatePath(`/laboratory/${labOrderId}`);
}

export const createLabOrder = createSafeAction({
  schema: createLabOrderSchema,
  permission: "laboratory:order",
  audit: { action: "laboratory:create-order", entity: "LabOrder" },
  handler: async (input) => {
    const result = await labService.createLabOrder(input);
    revalidatePath(`/encounters/${input.encounterId}`);
    revalidateLab();
    return result;
  },
});

export const collectSample = createSafeAction({
  schema: collectSampleSchema,
  permission: "laboratory:results",
  audit: { action: "laboratory:collect-sample", entity: "LabOrder" },
  handler: async ({ labOrderId }) => {
    const result = await labService.collectSample(labOrderId);
    revalidateLab(labOrderId);
    return result;
  },
});

export const startProcessing = createSafeAction({
  schema: startProcessingSchema,
  permission: "laboratory:results",
  audit: { action: "laboratory:start-processing", entity: "LabOrder" },
  handler: async ({ labOrderId }) => {
    const result = await labService.startProcessing(labOrderId);
    revalidateLab(labOrderId);
    return result;
  },
});

export const enterResult = createSafeAction({
  schema: enterResultSchema,
  permission: "laboratory:results",
  audit: { action: "laboratory:enter-result", entity: "LabResult" },
  handler: async (input, { user }) => {
    const result = await labService.enterResult(input, user);
    revalidateLab();
    return result;
  },
});

export const completeLabOrder = createSafeAction({
  schema: completeLabOrderSchema,
  permission: "laboratory:results",
  audit: { action: "laboratory:complete-order", entity: "LabOrder" },
  handler: async ({ labOrderId }) => {
    const result = await labService.completeLabOrder(labOrderId);
    revalidateLab(labOrderId);
    return result;
  },
});

export const validateLabOrder = createSafeAction({
  schema: validateLabOrderSchema,
  permission: "laboratory:validate",
  audit: { action: "laboratory:validate-order", entity: "LabOrder" },
  handler: async ({ labOrderId }, { user }) => {
    const result = await labService.validateLabOrder(labOrderId, user);
    revalidateLab(labOrderId);
    return result;
  },
});

export const cancelLabOrder = createSafeAction({
  schema: cancelLabOrderSchema,
  permission: "laboratory:order",
  audit: { action: "laboratory:cancel-order", entity: "LabOrder" },
  handler: async ({ labOrderId }) => {
    const result = await labService.cancelLabOrder(labOrderId);
    revalidateLab(labOrderId);
    return result;
  },
});

// ─── Read actions (React Query fetchers) ───

export const getLabTests = createSafeAction({
  schema: labTestOptionsSchema,
  permission: "laboratory:order",
  handler: ({ q }) => getLabTestOptions(q),
});
