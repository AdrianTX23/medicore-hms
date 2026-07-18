import "server-only";
import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/shared/utils/table-params";

export type PendingPrescriptionItem = {
  id: string;
  createdAt: Date;
  patient: { id: string; firstName: string; lastName: string; mrn: string; allergies: string[] };
  doctor: { firstName: string; lastName: string };
  items: Array<{
    id: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    medication: { id: string; name: string; strength: string | null };
  }>;
};

export async function listPendingPrescriptions(params: {
  skip: number;
  take: number;
}): Promise<Paginated<PendingPrescriptionItem>> {
  const where = { status: "ACTIVE" as const };

  const [rows, total] = await prisma.$transaction([
    prisma.prescription.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: params.skip,
      take: params.take,
      select: {
        id: true,
        createdAt: true,
        patient: {
          select: { id: true, firstName: true, lastName: true, mrn: true, allergies: true },
        },
        doctor: { select: { firstName: true, lastName: true } },
        items: {
          select: {
            id: true,
            dosage: true,
            frequency: true,
            durationDays: true,
            medication: { select: { id: true, name: true, strength: true } },
          },
        },
      },
    }),
    prisma.prescription.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({ ...r, patient: { ...r.patient, allergies: (r.patient.allergies as string[] | null) ?? [] } })),
    total,
    page: Math.floor(params.skip / params.take) + 1,
    perPage: params.take,
    pageCount: Math.max(Math.ceil(total / params.take), 1),
  };
}

export type InventoryRow = {
  medicationId: string;
  name: string;
  form: string;
  strength: string | null;
  totalStock: number;
  reorderLevel: number;
  nearestExpiry: Date | null;
  batches: Array<{ id: string; batchNumber: string; quantity: number; expiryDate: Date; unitCost: number }>;
};

/** One row per medication, aggregating its active batches. */
export async function listInventory(): Promise<InventoryRow[]> {
  const medications = await prisma.medication.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      form: true,
      strength: true,
      inventoryItems: {
        where: { quantity: { gt: 0 } },
        orderBy: { expiryDate: "asc" },
        select: { id: true, batchNumber: true, quantity: true, expiryDate: true, unitCost: true, reorderLevel: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return medications.map((m) => ({
    medicationId: m.id,
    name: m.name,
    form: m.form,
    strength: m.strength,
    totalStock: m.inventoryItems.reduce((sum, i) => sum + i.quantity, 0),
    reorderLevel: m.inventoryItems[0]?.reorderLevel ?? 10,
    nearestExpiry: m.inventoryItems[0]?.expiryDate ?? null,
    batches: m.inventoryItems.map((i) => ({
      id: i.id,
      batchNumber: i.batchNumber,
      quantity: i.quantity,
      expiryDate: i.expiryDate,
      unitCost: i.unitCost.toNumber(),
    })),
  }));
}

export async function getMedicationOptions() {
  return prisma.medication.findMany({
    where: { isActive: true },
    select: { id: true, name: true, form: true, strength: true },
    orderBy: { name: "asc" },
  });
}
