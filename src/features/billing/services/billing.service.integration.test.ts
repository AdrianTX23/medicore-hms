import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { cleanupDoctor, fakeSessionUser, makeDoctor, makePatient } from "@/test/integration-fixtures";
import { recordPayment } from "./billing.service";

/**
 * Proves the overpayment race-condition fix: recordPayment() now locks the
 * invoice row (SELECT ... FOR UPDATE) and recomputes the balance inside the
 * transaction, instead of trusting a balance read before the transaction
 * started — which let two concurrent payments both pass the same stale
 * "amount <= balance" check.
 */
describe("billing payment concurrency guard (integration)", () => {
  let doctorUserId: string;
  let patientId: string;

  beforeAll(async () => {
    const doctor = await makeDoctor();
    doctorUserId = doctor.userId;
    const patient = await makePatient({ lastName: "Overpay" });
    patientId = patient.id;
  }, 20000);

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { invoice: { patientId } } });
    await prisma.invoiceItem.deleteMany({ where: { invoice: { patientId } } });
    await prisma.invoice.deleteMany({ where: { patientId } });
    await prisma.patient.delete({ where: { id: patientId } });
    await cleanupDoctor(doctorUserId);
  });

  it("never lets two concurrent payments push the total paid past the invoice total", async () => {
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `IT-INV-${randomUUID()}`,
        patientId,
        subtotal: 100,
        total: 100,
        status: "ISSUED",
      },
    });

    const user = fakeSessionUser(doctorUserId);

    // Two 60-unit payments against a 100-unit balance: only the first to
    // acquire the row lock can succeed (60 <= 100); the second must see the
    // recomputed balance (40) and be rejected (60 > 40), not the stale
    // pre-transaction balance both would have read without the fix.
    const results = await Promise.allSettled([
      recordPayment({ invoiceId: invoice.id, amount: 60, method: "CASH" }, user),
      recordPayment({ invoiceId: invoice.id, amount: 60, method: "CASH" }, user),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled).toHaveLength(1);

    const paid = await prisma.payment.aggregate({
      where: { invoiceId: invoice.id },
      _sum: { amount: true },
    });
    const totalPaid = paid._sum.amount?.toNumber() ?? 0;
    expect(totalPaid).toBe(60);
    expect(totalPaid).toBeLessThanOrEqual(100);

    const updated = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(updated.status).toBe("PARTIALLY_PAID");
  });
});
