import type { InvoiceStatus, PaymentMethod } from "@/generated/prisma/enums";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Borrador",
  ISSUED: "Emitida",
  PARTIALLY_PAID: "Pago parcial",
  PAID: "Pagada",
  VOID: "Anulada",
};

export const INVOICE_STATUS_VARIANTS: Record<
  InvoiceStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "secondary",
  ISSUED: "default",
  PARTIALLY_PAID: "default",
  PAID: "outline",
  VOID: "destructive",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  INSURANCE: "Seguro",
};
