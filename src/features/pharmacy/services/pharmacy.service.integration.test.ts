import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { cleanupDoctor, fakeSessionUser, makeDoctor, makePatient } from "@/test/integration-fixtures";
import { dispensePrescription } from "./pharmacy.service";

/**
 * Proves the double-dispense race-condition fix: the ACTIVE → DISPENSED
 * transition is now claimed atomically (conditional updateMany) before any
 * stock is decremented, so a concurrent second call can't reach the
 * decrement step at all — instead of both calls checking status, then both
 * decrementing stock.
 */
describe("pharmacy dispense concurrency guard (integration)", () => {
  let doctorUserId: string;
  let doctorStaffId: string;
  let patientId: string;
  let medicationId: string;
  let inventoryItemId: string;

  beforeAll(async () => {
    const doctor = await makeDoctor();
    doctorUserId = doctor.userId;
    doctorStaffId = doctor.staffId;

    const patient = await makePatient({ lastName: "DoubleDispense" });
    patientId = patient.id;

    const medication = await prisma.medication.create({
      data: { name: `IT-Med-${randomUUID()}`, form: "TABLET", strength: "500 mg" },
    });
    medicationId = medication.id;

    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        medicationId,
        batchNumber: `IT-BATCH-${randomUUID()}`,
        expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000),
        quantity: 100,
        unitCost: 0.1,
      },
    });
    inventoryItemId = inventoryItem.id;
  }, 20000);

  afterAll(async () => {
    await prisma.stockMovement.deleteMany({ where: { inventoryItemId } });
    await prisma.prescriptionItem.deleteMany({ where: { medicationId } });
    await prisma.prescription.deleteMany({ where: { patientId } });
    await prisma.encounter.deleteMany({ where: { patientId } });
    await prisma.inventoryItem.delete({ where: { id: inventoryItemId } });
    await prisma.medication.delete({ where: { id: medicationId } });
    await prisma.patient.delete({ where: { id: patientId } });
    await cleanupDoctor(doctorUserId);
  });

  it("only decrements stock once across two concurrent dispense calls for the same prescription", async () => {
    const encounter = await prisma.encounter.create({
      data: { patientId, doctorId: doctorStaffId, chiefComplaint: "Integration test" },
    });
    const prescription = await prisma.prescription.create({
      data: {
        encounterId: encounter.id,
        patientId,
        doctorId: doctorStaffId,
        status: "ACTIVE",
        items: {
          create: [{ medicationId, dosage: "1 tablet", frequency: "every 8 hours", durationDays: 5 }],
        },
      },
    });

    const user = fakeSessionUser(doctorUserId);

    const results = await Promise.allSettled([
      dispensePrescription(prescription.id, user),
      dispensePrescription(prescription.id, user),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const item = await prisma.inventoryItem.findUniqueOrThrow({ where: { id: inventoryItemId } });
    // 5 days of 1-tablet doses = 5 units decremented exactly once (100 - 5),
    // not 10 (which is what the pre-fix code would have left after both
    // concurrent calls decremented independently).
    expect(item.quantity).toBe(95);

    const finalPrescription = await prisma.prescription.findUniqueOrThrow({
      where: { id: prescription.id },
    });
    expect(finalPrescription.status).toBe("DISPENSED");
  });
});
