import "server-only";
import { BusinessRuleError, NotFoundError } from "@/core/errors";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { SessionUser } from "@/lib/auth/session";

/** Rounds to 2 decimal places, avoiding binary floating-point drift. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

async function nextInvoiceNumber(tx: Prisma.TransactionClient, seq: number): Promise<string> {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(seq).padStart(6, "0")}`;
}

/** The patient's active insurance coverage, if any (first one found). */
async function getCoveragePct(tx: Prisma.TransactionClient, patientId: string): Promise<number> {
  const insurance = await tx.patientInsurance.findFirst({
    where: { patientId, isActive: true },
    orderBy: { coveragePct: "desc" },
  });
  return insurance ? insurance.coveragePct.toNumber() : 0;
}

/**
 * Consultation service matched to how the encounter was actually staffed.
 * "Medicina General" is itself modeled as a Specialty row, so presence of a
 * specialty isn't enough — only a specialty OTHER than general medicine bills
 * at the specialist rate.
 */
function consultationServiceCode(encounterType: string, specialtyName: string | null): string {
  if (encounterType === "EMERGENCY") return "CONS-URG";
  if (specialtyName && specialtyName !== "Medicina General") return "CONS-ESP";
  return "CONS-GEN";
}

type DraftItem = {
  itemType: "CONSULTATION" | "PROCEDURE" | "LAB_TEST" | "MEDICATION" | "BED_DAY" | "OTHER";
  description: string;
  referenceId: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

/**
 * Builds a draft invoice from a closed encounter: one consultation line plus
 * one line per lab test ordered (non-cancelled orders). Dispensed medications
 * aren't priced per-unit in this catalog, so they're out of scope here.
 */
export async function generateInvoiceFromEncounter(encounterId: string) {
  const encounter = await prisma.encounter.findUnique({
    where: { id: encounterId },
    include: {
      patient: { select: { id: true } },
      doctor: { select: { specialty: { select: { name: true } } } },
      invoice: { select: { id: true } },
      labOrders: {
        where: { status: { not: "CANCELLED" } },
        include: { items: { include: { labTest: true } } },
      },
    },
  });
  if (!encounter) throw new NotFoundError("La consulta");
  if (encounter.invoice) return { id: encounter.invoice.id, existing: true };
  if (encounter.status !== "CLOSED") {
    throw new BusinessRuleError("Solo se puede facturar una consulta cerrada");
  }

  return prisma.$transaction(async (tx) => {
    const consultationCode = consultationServiceCode(
      encounter.type,
      encounter.doctor.specialty?.name ?? null,
    );
    const consultationService = await tx.service.findUnique({ where: { code: consultationCode } });
    if (!consultationService) {
      throw new BusinessRuleError(`No existe el servicio de catálogo "${consultationCode}"`);
    }

    const items: DraftItem[] = [
      {
        itemType: "CONSULTATION",
        description: consultationService.name,
        referenceId: encounter.id,
        quantity: 1,
        unitPrice: consultationService.price.toNumber(),
        total: consultationService.price.toNumber(),
      },
    ];

    for (const order of encounter.labOrders) {
      for (const item of order.items) {
        const price = item.labTest.price.toNumber();
        items.push({
          itemType: "LAB_TEST",
          description: item.labTest.name,
          referenceId: order.id,
          quantity: 1,
          unitPrice: price,
          total: price,
        });
      }
    }

    const subtotal = round2(items.reduce((sum, i) => sum + i.total, 0));
    const coveragePct = await getCoveragePct(tx, encounter.patient.id);
    const insuranceCovered = round2(subtotal * (coveragePct / 100));
    const total = round2(subtotal - insuranceCovered);

    const created = await tx.invoice.create({
      data: {
        invoiceNumber: `PENDING-${encounter.id}`,
        patientId: encounter.patient.id,
        encounterId: encounter.id,
        subtotal,
        insuranceCovered,
        total,
        items: { create: items },
      },
      select: { id: true, invoiceSeq: true },
    });

    const invoiceNumber = await nextInvoiceNumber(tx, created.invoiceSeq);
    await tx.invoice.update({ where: { id: created.id }, data: { invoiceNumber } });

    return { id: created.id, existing: false };
  });
}

export async function createManualInvoice(input: {
  patientId: string;
  items: Array<{ serviceId: string; quantity: number }>;
}) {
  const patient = await prisma.patient.findFirst({
    where: { id: input.patientId, deletedAt: null },
    select: { id: true },
  });
  if (!patient) throw new NotFoundError("El paciente");

  const services = await prisma.service.findMany({
    where: { id: { in: input.items.map((i) => i.serviceId) }, isActive: true },
  });
  if (services.length !== new Set(input.items.map((i) => i.serviceId)).size) {
    throw new NotFoundError("Uno o más servicios seleccionados");
  }
  const byId = new Map(services.map((s) => [s.id, s]));

  return prisma.$transaction(async (tx) => {
    const items: DraftItem[] = input.items.map(({ serviceId, quantity }) => {
      const service = byId.get(serviceId)!;
      const unitPrice = service.price.toNumber();
      return {
        itemType: service.type,
        description: service.name,
        referenceId: null,
        quantity,
        unitPrice,
        total: round2(unitPrice * quantity),
      };
    });

    const subtotal = round2(items.reduce((sum, i) => sum + i.total, 0));
    const coveragePct = await getCoveragePct(tx, input.patientId);
    const insuranceCovered = round2(subtotal * (coveragePct / 100));
    const total = round2(subtotal - insuranceCovered);

    const created = await tx.invoice.create({
      data: {
        invoiceNumber: `PENDING-${input.patientId}-${Date.now()}`,
        patientId: input.patientId,
        subtotal,
        insuranceCovered,
        total,
        items: { create: items },
      },
      select: { id: true, invoiceSeq: true },
    });

    const invoiceNumber = await nextInvoiceNumber(tx, created.invoiceSeq);
    await tx.invoice.update({ where: { id: created.id }, data: { invoiceNumber } });

    return { id: created.id };
  });
}

export async function issueInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, status: true },
  });
  if (!invoice) throw new NotFoundError("La factura");
  if (invoice.status !== "DRAFT") {
    throw new BusinessRuleError("Solo se puede emitir una factura en borrador");
  }

  const issuedAt = new Date();
  const dueDate = new Date(issuedAt);
  dueDate.setDate(dueDate.getDate() + 15);

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "ISSUED", issuedAt, dueDate },
    select: { id: true, status: true },
  });
}

export async function recordPayment(
  input: { invoiceId: string; amount: number; method: "CASH" | "CARD" | "TRANSFER" | "INSURANCE"; reference?: string },
  user: SessionUser,
) {
  const amount = round2(input.amount);
  if (amount <= 0) {
    throw new BusinessRuleError("El monto del pago debe ser mayor a cero");
  }

  return prisma.$transaction(async (tx) => {
    // Lock the invoice row for the rest of this transaction so two concurrent
    // payments on the same invoice can't both read the same "balance so far"
    // and both pass the overpayment check (classic read-then-write race).
    await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${input.invoiceId} FOR UPDATE`;

    const invoice = await tx.invoice.findUnique({
      where: { id: input.invoiceId },
      include: { payments: { select: { amount: true } } },
    });
    if (!invoice) throw new NotFoundError("La factura");
    if (invoice.status !== "ISSUED" && invoice.status !== "PARTIALLY_PAID") {
      throw new BusinessRuleError("Solo se pueden registrar pagos sobre facturas emitidas");
    }

    const paidSoFar = invoice.payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const balance = round2(invoice.total.toNumber() - paidSoFar);
    if (amount > balance + 0.01) {
      throw new BusinessRuleError(`El pago (${amount}) excede el saldo pendiente (${balance})`);
    }

    const payment = await tx.payment.create({
      data: {
        invoiceId: input.invoiceId,
        amount,
        method: input.method,
        reference: input.reference ?? null,
        receivedById: user.id,
      },
      select: { id: true },
    });

    const newPaid = round2(paidSoFar + amount);
    const nextStatus = newPaid + 0.01 >= invoice.total.toNumber() ? "PAID" : "PARTIALLY_PAID";
    await tx.invoice.update({ where: { id: input.invoiceId }, data: { status: nextStatus } });

    return payment;
  });
}

export async function voidInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: { select: { id: true } } },
  });
  if (!invoice) throw new NotFoundError("La factura");
  if (invoice.status === "VOID" || invoice.status === "PAID") {
    throw new BusinessRuleError("Esta factura no se puede anular");
  }
  if (invoice.payments.length > 0) {
    throw new BusinessRuleError(
      "No se puede anular una factura con pagos registrados — gestiona un reembolso en su lugar",
    );
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "VOID" },
    select: { id: true },
  });
}
