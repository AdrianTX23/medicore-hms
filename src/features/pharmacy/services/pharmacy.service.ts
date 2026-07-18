import "server-only";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/core/errors";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { SessionUser } from "@/lib/auth/session";

/**
 * Dispensing quantity per prescription item: since dosage/frequency are
 * free text (not structured units), we simplify to "1 unit per day of
 * treatment" — reasonable for tablets/capsules, the dominant form in the
 * catalog. A real system would parse frequency into units/day.
 */
function unitsToDispense(durationDays: number): number {
  return durationDays;
}

async function decrementFefo(
  tx: Prisma.TransactionClient,
  medicationId: string,
  unitsNeeded: number,
  prescriptionId: string,
  performedById: string,
) {
  const batches = await tx.inventoryItem.findMany({
    where: { medicationId, quantity: { gt: 0 } },
    orderBy: { expiryDate: "asc" }, // FEFO: first-expiry-first-out
  });

  const available = batches.reduce((sum, b) => sum + b.quantity, 0);
  if (available < unitsNeeded) {
    const medication = await tx.medication.findUnique({ where: { id: medicationId }, select: { name: true } });
    throw new BusinessRuleError(
      `Stock insuficiente de ${medication?.name ?? "medicamento"}: disponible ${available}, requerido ${unitsNeeded}`,
    );
  }

  let remaining = unitsNeeded;
  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantity, remaining);
    await tx.inventoryItem.update({
      where: { id: batch.id },
      data: { quantity: { decrement: take } },
    });
    await tx.stockMovement.create({
      data: {
        inventoryItemId: batch.id,
        type: "DISPENSE",
        quantity: -take,
        referenceId: prescriptionId,
        performedById,
      },
    });
    remaining -= take;
  }
}

export async function dispensePrescription(prescriptionId: string, user: SessionUser) {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: { items: true },
  });
  if (!prescription) throw new NotFoundError("La receta");
  if (prescription.status !== "ACTIVE") {
    throw new BusinessRuleError("Solo se pueden dispensar recetas activas");
  }

  return prisma.$transaction(async (tx) => {
    // Claim the ACTIVE → DISPENSED transition first, atomically. Two
    // concurrent dispense calls both pass the `!== "ACTIVE"` check above, but
    // only one of these conditional updates can succeed — Postgres row-level
    // locking serializes the second one behind the first. Without this, both
    // calls would reach decrementFefo and drain stock twice.
    const claimed = await tx.prescription.updateMany({
      where: { id: prescriptionId, status: "ACTIVE" },
      data: { status: "DISPENSED" },
    });
    if (claimed.count === 0) {
      throw new ConflictError("La receta ya fue dispensada o ya no está activa");
    }

    for (const item of prescription.items) {
      await decrementFefo(
        tx,
        item.medicationId,
        unitsToDispense(item.durationDays),
        prescriptionId,
        user.id,
      );
    }
    return { id: prescriptionId };
  });
}

export async function addInventoryBatch(
  input: {
    medicationId: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    unitCost: number;
    reorderLevel: number;
  },
  user: SessionUser,
) {
  const medication = await prisma.medication.findUnique({ where: { id: input.medicationId } });
  if (!medication) throw new NotFoundError("El medicamento");

  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.upsert({
      where: { medicationId_batchNumber: { medicationId: input.medicationId, batchNumber: input.batchNumber } },
      update: { quantity: { increment: input.quantity } },
      create: {
        medicationId: input.medicationId,
        batchNumber: input.batchNumber,
        expiryDate: new Date(input.expiryDate),
        quantity: input.quantity,
        unitCost: input.unitCost,
        reorderLevel: input.reorderLevel,
      },
      select: { id: true },
    });
    await tx.stockMovement.create({
      data: {
        inventoryItemId: item.id,
        type: "IN",
        quantity: input.quantity,
        performedById: user.id,
      },
    });
    return item;
  });
}

export async function adjustInventory(
  input: { inventoryItemId: string; quantity: number; reason: string },
  user: SessionUser,
) {
  const item = await prisma.inventoryItem.findFirst({
    where: { id: input.inventoryItemId },
    select: { id: true },
  });
  if (!item) throw new NotFoundError("El lote de inventario");

  return prisma.$transaction(async (tx) => {
    // Atomic increment (not read-modify-write) so two concurrent adjustments
    // on the same batch can't silently overwrite each other, and the
    // negative-stock guard is re-checked in the same statement — not against
    // a quantity read before the transaction started.
    const applied = await tx.inventoryItem.updateMany({
      where: {
        id: input.inventoryItemId,
        ...(input.quantity < 0 ? { quantity: { gte: -input.quantity } } : {}),
      },
      data: { quantity: { increment: input.quantity } },
    });
    if (applied.count === 0) {
      throw new BusinessRuleError("El ajuste dejaría el stock en negativo");
    }
    return tx.stockMovement.create({
      data: {
        inventoryItemId: input.inventoryItemId,
        type: "ADJUSTMENT",
        quantity: input.quantity,
        reason: input.reason,
        performedById: user.id,
      },
      select: { id: true },
    });
  });
}
