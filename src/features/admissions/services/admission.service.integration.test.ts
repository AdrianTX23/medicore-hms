import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { cleanupDoctor, makeDoctor, makePatient } from "@/test/integration-fixtures";
import { admitPatient } from "./admission.service";

/**
 * Proves the two admission race-condition fixes from the production
 * readiness audit actually hold against the real database — a partial
 * unique index + a conditional `updateMany` inside the transaction, not
 * just an application-level pre-check (which two concurrent requests can
 * both pass before either commits).
 */
describe("admission concurrency guards (integration)", () => {
  let doctorUserId: string;
  let doctorStaffId: string;
  let departmentId: string;
  let roomId: string;
  let bedAId: string;
  let bedBId: string;
  let patient1Id: string;
  let patient2Id: string;

  beforeAll(async () => {
    const doctor = await makeDoctor();
    doctorUserId = doctor.userId;
    doctorStaffId = doctor.staffId;

    const department = await prisma.department.create({ data: { name: `IT-Dept-${randomUUID()}` } });
    departmentId = department.id;
    const room = await prisma.room.create({ data: { departmentId, number: "IT1" } });
    roomId = room.id;
    const bedA = await prisma.bed.create({ data: { roomId, code: "IT1-A", status: "AVAILABLE" } });
    const bedB = await prisma.bed.create({ data: { roomId, code: "IT1-B", status: "AVAILABLE" } });
    bedAId = bedA.id;
    bedBId = bedB.id;

    const p1 = await makePatient({ lastName: "RaceBed" });
    const p2 = await makePatient({ lastName: "RaceBed" });
    patient1Id = p1.id;
    patient2Id = p2.id;
  }, 20000);

  afterAll(async () => {
    await prisma.admission.deleteMany({ where: { OR: [{ patientId: patient1Id }, { patientId: patient2Id }] } });
    await prisma.patient.deleteMany({ where: { id: { in: [patient1Id, patient2Id] } } });
    await prisma.bed.deleteMany({ where: { id: { in: [bedAId, bedBId] } } });
    await prisma.room.delete({ where: { id: roomId } });
    await prisma.department.delete({ where: { id: departmentId } });
    await cleanupDoctor(doctorUserId);
  });

  beforeEach(async () => {
    // reset between tests so each one starts from a clean slate
    await prisma.admission.deleteMany({ where: { OR: [{ patientId: patient1Id }, { patientId: patient2Id }] } });
    await prisma.bed.updateMany({ where: { id: { in: [bedAId, bedBId] } }, data: { status: "AVAILABLE" } });
  });

  it("only lets one of two concurrent admissions claim the same bed", async () => {
    const results = await Promise.allSettled([
      admitPatient({
        patientId: patient1Id,
        bedId: bedAId,
        attendingDoctorId: doctorStaffId,
        admissionDiagnosis: "Concurrency test — patient 1",
      }),
      admitPatient({
        patientId: patient2Id,
        bedId: bedAId,
        attendingDoctorId: doctorStaffId,
        admissionDiagnosis: "Concurrency test — patient 2",
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const activeOnBed = await prisma.admission.count({ where: { bedId: bedAId, status: "ADMITTED" } });
    expect(activeOnBed).toBe(1);
  });

  it("never lets the same patient hold two simultaneous active admissions", async () => {
    const results = await Promise.allSettled([
      admitPatient({
        patientId: patient1Id,
        bedId: bedAId,
        attendingDoctorId: doctorStaffId,
        admissionDiagnosis: "Concurrency test — bed A",
      }),
      admitPatient({
        patientId: patient1Id,
        bedId: bedBId,
        attendingDoctorId: doctorStaffId,
        admissionDiagnosis: "Concurrency test — bed B",
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled).toHaveLength(1);

    const activeAdmissions = await prisma.admission.count({
      where: { patientId: patient1Id, status: "ADMITTED" },
    });
    expect(activeAdmissions).toBe(1);
  });
});
