import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth/session";

/**
 * Shared fixture helpers for integration tests (src/**\/*.integration.test.ts).
 * These hit the real database — every `make*` here creates throwaway rows
 * prefixed "IT-" and every suite must clean up in `afterAll` (see each
 * integration test file). Never point these at anything but a disposable
 * dev/test database.
 */

export async function makeDoctor() {
  const role = await prisma.role.findFirstOrThrow({ where: { name: "DOCTOR" } });
  const userId = randomUUID();
  await prisma.user.create({
    data: { id: userId, email: `it-doctor-${userId}@test.medicore.dev`, roleId: role.id },
  });
  const staff = await prisma.staffProfile.create({
    data: { userId, firstName: "IT", lastName: "Doctor" },
  });
  return { userId, staffId: staff.id };
}

/** Deletes the doctor's User row — cascades the StaffProfile automatically. */
export async function cleanupDoctor(userId: string) {
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
}

export async function makePatient(overrides: { firstName?: string; lastName?: string } = {}) {
  return prisma.patient.create({
    data: {
      mrn: `IT-${randomUUID()}`,
      firstName: overrides.firstName ?? "Integration",
      lastName: overrides.lastName ?? "Test",
      birthDate: new Date("1990-01-01"),
      gender: "MALE",
    },
  });
}

/** A fully-typed stand-in SessionUser for service calls that only read `.id`. */
export function fakeSessionUser(userId: string): SessionUser {
  return {
    id: userId,
    email: `it-${userId}@test.medicore.dev`,
    role: "DOCTOR",
    permissions: new Set(),
    staffProfile: null,
    patientId: null,
  };
}
