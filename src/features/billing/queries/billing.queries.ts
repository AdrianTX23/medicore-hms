import "server-only";
import type { InvoiceStatus } from "@/generated/prisma/enums";
import type { RecordAccessScope } from "@/core/access-scope";
import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/shared/utils/table-params";

export type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  total: number;
  paid: number;
  createdAt: Date;
  issuedAt: Date | null;
  patient: { id: string; firstName: string; lastName: string; mrn: string };
};

export async function listInvoices(params: {
  status?: InvoiceStatus;
  patientId?: string;
  skip: number;
  take: number;
}): Promise<Paginated<InvoiceListItem>> {
  const where = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.patientId ? { patientId: params.patientId } : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        total: true,
        createdAt: true,
        issuedAt: true,
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        payments: { select: { amount: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      invoiceNumber: r.invoiceNumber,
      status: r.status,
      total: r.total.toNumber(),
      paid: r.payments.reduce((sum, p) => sum + p.amount.toNumber(), 0),
      createdAt: r.createdAt,
      issuedAt: r.issuedAt,
      patient: r.patient,
    })),
    total,
    page: Math.floor(params.skip / params.take) + 1,
    perPage: params.take,
    pageCount: Math.max(Math.ceil(total / params.take), 1),
  };
}

export type InvoiceDetail = NonNullable<Awaited<ReturnType<typeof getInvoiceDetail>>>;

export async function getInvoiceDetail(id: string, scope: RecordAccessScope) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      encounter: {
        select: {
          id: true,
          chiefComplaint: true,
          doctor: { select: { firstName: true, lastName: true } },
        },
      },
      items: { orderBy: { id: "asc" } },
      payments: {
        orderBy: { paidAt: "desc" },
        include: {
          receivedBy: {
            select: { email: true, staffProfile: { select: { firstName: true, lastName: true } } },
          },
        },
      },
    },
  });
  if (!invoice) return null;
  if (scope.role === "PATIENT" && invoice.patientId !== scope.patientId) return null;

  const paid = invoice.payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);

  return {
    ...invoice,
    subtotal: invoice.subtotal.toNumber(),
    tax: invoice.tax.toNumber(),
    insuranceCovered: invoice.insuranceCovered.toNumber(),
    total: invoice.total.toNumber(),
    paid,
    balance: Math.max(invoice.total.toNumber() - paid, 0),
    items: invoice.items.map((i) => ({
      ...i,
      unitPrice: i.unitPrice.toNumber(),
      total: i.total.toNumber(),
    })),
    payments: invoice.payments.map((p) => ({ ...p, amount: p.amount.toNumber() })),
  };
}

export async function getServiceOptions() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, price: true, type: true },
    orderBy: { name: "asc" },
  });
  // Decimal isn't a plain object — it can't cross the server action boundary.
  return services.map((s) => ({ ...s, price: s.price.toNumber() }));
}

export type BillableEncounter = {
  id: string;
  createdAt: Date;
  chiefComplaint: string;
  patient: { id: string; firstName: string; lastName: string; mrn: string };
  doctor: { firstName: string; lastName: string };
};

/** Closed encounters that don't have an invoice yet — the billing queue. */
export async function listBillableEncounters(q?: string): Promise<BillableEncounter[]> {
  return prisma.encounter.findMany({
    where: {
      status: "CLOSED",
      invoice: null,
      ...(q
        ? {
            patient: {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { mrn: { contains: q, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    orderBy: { closedAt: "desc" },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      chiefComplaint: true,
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      doctor: { select: { firstName: true, lastName: true } },
    },
  });
}
