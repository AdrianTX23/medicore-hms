"use server";

import { revalidatePath } from "next/cache";
import * as billingService from "@/features/billing/services/billing.service";
import {
  createManualInvoiceSchema,
  encounterOptionsSchema,
  generateInvoiceFromEncounterSchema,
  issueInvoiceSchema,
  recordPaymentSchema,
  voidInvoiceSchema,
} from "@/features/billing/schemas/billing.schema";
import {
  getServiceOptions,
  listBillableEncounters,
} from "@/features/billing/queries/billing.queries";
import { createSafeAction } from "@/lib/safe-action";

function revalidateBilling(invoiceId?: string) {
  revalidatePath("/billing");
  if (invoiceId) revalidatePath(`/billing/${invoiceId}`);
}

export const generateInvoiceFromEncounter = createSafeAction({
  schema: generateInvoiceFromEncounterSchema,
  permission: "billing:create",
  audit: { action: "billing:generate-from-encounter", entity: "Invoice" },
  handler: async ({ encounterId }) => {
    const result = await billingService.generateInvoiceFromEncounter(encounterId);
    revalidateBilling();
    return result;
  },
});

export const createManualInvoice = createSafeAction({
  schema: createManualInvoiceSchema,
  permission: "billing:create",
  audit: { action: "billing:create-manual", entity: "Invoice" },
  handler: async (input) => {
    const result = await billingService.createManualInvoice(input);
    revalidateBilling();
    return result;
  },
});

export const issueInvoice = createSafeAction({
  schema: issueInvoiceSchema,
  permission: "billing:update",
  audit: { action: "billing:issue", entity: "Invoice" },
  handler: async ({ invoiceId }) => {
    const result = await billingService.issueInvoice(invoiceId);
    revalidateBilling(invoiceId);
    return result;
  },
});

export const recordPayment = createSafeAction({
  schema: recordPaymentSchema,
  permission: "billing:pay",
  audit: { action: "billing:record-payment", entity: "Payment" },
  handler: async (input, { user }) => {
    const result = await billingService.recordPayment(input, user);
    revalidateBilling(input.invoiceId);
    return result;
  },
});

export const voidInvoice = createSafeAction({
  schema: voidInvoiceSchema,
  permission: "billing:void",
  audit: { action: "billing:void", entity: "Invoice" },
  handler: async ({ invoiceId }) => {
    const result = await billingService.voidInvoice(invoiceId);
    revalidateBilling(invoiceId);
    return result;
  },
});

// ─── Read actions (React Query fetchers) ───

export const getServices = createSafeAction({
  schema: encounterOptionsSchema.pick({}),
  permission: "billing:create",
  handler: () => getServiceOptions(),
});

export const getBillableEncounters = createSafeAction({
  schema: encounterOptionsSchema,
  permission: "billing:create",
  handler: ({ q }) => listBillableEncounters(q),
});
