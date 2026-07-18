import "server-only";
import { BusinessRuleError, NotFoundError } from "@/core/errors";
import { LAB_ORDER_TRANSITIONS } from "@/features/laboratory/constants";
import {
  isAbnormal,
  matchReferenceRange,
} from "@/features/laboratory/queries/lab.queries";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth/session";

export async function createLabOrder(input: {
  encounterId: string;
  labTestIds: string[];
  priority: "ROUTINE" | "URGENT" | "STAT";
  notes?: string;
}) {
  const encounter = await prisma.encounter.findUnique({
    where: { id: input.encounterId },
    select: { id: true, patientId: true, doctorId: true, status: true },
  });
  if (!encounter) throw new NotFoundError("La consulta");
  if (encounter.status === "CLOSED") {
    throw new BusinessRuleError("No se pueden ordenar exámenes en una consulta cerrada");
  }

  return prisma.labOrder.create({
    data: {
      encounterId: encounter.id,
      patientId: encounter.patientId,
      orderedById: encounter.doctorId,
      priority: input.priority,
      notes: input.notes ?? null,
      items: { create: input.labTestIds.map((labTestId) => ({ labTestId })) },
    },
    select: { id: true },
  });
}

async function requireTransition(labOrderId: string, next: string) {
  const order = await prisma.labOrder.findUnique({
    where: { id: labOrderId },
    select: { id: true, status: true },
  });
  if (!order) throw new NotFoundError("La orden de laboratorio");
  if (!LAB_ORDER_TRANSITIONS[order.status].includes(next as never)) {
    throw new BusinessRuleError(
      `Una orden ${order.status.toLowerCase()} no puede pasar a ${next.toLowerCase()}`,
    );
  }
  return order;
}

export async function collectSample(labOrderId: string) {
  await requireTransition(labOrderId, "SAMPLE_COLLECTED");
  return prisma.labOrder.update({
    where: { id: labOrderId },
    data: { status: "SAMPLE_COLLECTED" },
    select: { id: true },
  });
}

export async function startProcessing(labOrderId: string) {
  await requireTransition(labOrderId, "IN_PROGRESS");
  return prisma.labOrder.update({
    where: { id: labOrderId },
    data: { status: "IN_PROGRESS" },
    select: { id: true },
  });
}

export async function enterResult(
  input: { labOrderItemId: string; value: string; notes?: string },
  user: SessionUser,
) {
  const item = await prisma.labOrderItem.findUnique({
    where: { id: input.labOrderItemId },
    include: {
      labTest: true,
      labOrder: { include: { patient: true } },
      result: true,
    },
  });
  if (!item) throw new NotFoundError("El ítem de la orden");
  if (item.labOrder.status !== "IN_PROGRESS" && item.labOrder.status !== "SAMPLE_COLLECTED") {
    throw new BusinessRuleError("La orden debe estar en proceso para capturar resultados");
  }
  if (item.result) {
    throw new BusinessRuleError("Este examen ya tiene un resultado registrado");
  }

  const range = matchReferenceRange(item.labTest.referenceRanges, item.labOrder.patient);
  const abnormal = isAbnormal(input.value, range);

  return prisma.$transaction(async (tx) => {
    const result = await tx.labResult.create({
      data: {
        labOrderItemId: input.labOrderItemId,
        value: input.value,
        unit: item.labTest.unit,
        isAbnormal: abnormal ?? false,
        notes: input.notes ?? null,
        performedById: user.id,
      },
      select: { id: true },
    });
    // Auto-advance ORDERED/SAMPLE_COLLECTED orders once results start coming in.
    if (item.labOrder.status === "SAMPLE_COLLECTED") {
      await tx.labOrder.update({ where: { id: item.labOrder.id }, data: { status: "IN_PROGRESS" } });
    }
    return result;
  });
}

export async function completeLabOrder(labOrderId: string) {
  const order = await prisma.labOrder.findUnique({
    where: { id: labOrderId },
    include: { items: { include: { result: true } } },
  });
  if (!order) throw new NotFoundError("La orden de laboratorio");
  if (!LAB_ORDER_TRANSITIONS[order.status].includes("COMPLETED")) {
    throw new BusinessRuleError(`Una orden ${order.status.toLowerCase()} no puede completarse`);
  }
  const missing = order.items.filter((i) => !i.result);
  if (missing.length > 0) {
    throw new BusinessRuleError(
      `Faltan resultados: ${missing.map((i) => i.labTestId).length} examen(es) sin capturar`,
    );
  }

  return prisma.labOrder.update({
    where: { id: labOrderId },
    data: { status: "COMPLETED" },
    select: { id: true },
  });
}

/** Validation is a second-check by a (typically different) lab role. */
export async function validateLabOrder(labOrderId: string, user: SessionUser) {
  const order = await requireTransition(labOrderId, "VALIDATED");

  return prisma.$transaction(async (tx) => {
    await tx.labResult.updateMany({
      where: { labOrderItem: { labOrderId }, validatedAt: null },
      data: { validatedById: user.id, validatedAt: new Date() },
    });
    return tx.labOrder.update({
      where: { id: order.id },
      data: { status: "VALIDATED" },
      select: { id: true },
    });
  });
}

export async function cancelLabOrder(labOrderId: string) {
  const order = await prisma.labOrder.findUnique({
    where: { id: labOrderId },
    select: { id: true, status: true },
  });
  if (!order) throw new NotFoundError("La orden de laboratorio");
  if (order.status === "VALIDATED" || order.status === "CANCELLED") {
    throw new BusinessRuleError("No se puede cancelar una orden validada o ya cancelada");
  }
  return prisma.labOrder.update({
    where: { id: labOrderId },
    data: { status: "CANCELLED" },
    select: { id: true },
  });
}
