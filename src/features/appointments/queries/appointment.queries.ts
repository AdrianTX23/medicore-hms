import "server-only";
import type { AppointmentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/shared/utils/table-params";

/** Local day range [00:00, 24:00) for a yyyy-mm-dd string (clinic timezone = server timezone). */
export function dayRange(dateStr: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 1);
  return { start, end };
}

export type AppointmentListItem = {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  reason: string;
  cancelledReason: string | null;
  patient: { id: string; firstName: string; lastName: string; mrn: string };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialty: { name: string } | null;
  };
  encounter: { id: string } | null;
};

export async function listAppointments(params: {
  date: string;
  doctorId?: string;
  patientId?: string;
  status?: AppointmentStatus;
  skip: number;
  take: number;
}): Promise<Paginated<AppointmentListItem>> {
  const { start, end } = dayRange(params.date);

  const where = {
    scheduledAt: { gte: start, lt: end },
    ...(params.doctorId ? { doctorId: params.doctorId } : {}),
    ...(params.patientId ? { patientId: params.patientId } : {}),
    ...(params.status ? { status: params.status } : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      skip: params.skip,
      take: params.take,
      select: {
        id: true,
        scheduledAt: true,
        durationMinutes: true,
        status: true,
        reason: true,
        cancelledReason: true,
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: { select: { name: true } },
          },
        },
        encounter: { select: { id: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    rows,
    total,
    page: Math.floor(params.skip / params.take) + 1,
    perPage: params.take,
    pageCount: Math.max(Math.ceil(total / params.take), 1),
  };
}

/** Active staff members whose role is DOCTOR, for selectors. */
export async function getDoctors() {
  return prisma.staffProfile.findMany({
    where: { user: { isActive: true, role: { name: "DOCTOR" } } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      specialty: { select: { name: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export type DoctorOption = Awaited<ReturnType<typeof getDoctors>>[number];

export type Slot = {
  /** ISO timestamp of the slot start — becomes scheduledAt on submit. */
  startsAt: string;
  /** "09:30" label in clinic time. */
  label: string;
};

/**
 * Free slots for a doctor on a given day:
 * weekly schedule − exceptions − active appointments − past slots.
 */
export async function getAvailableSlots(doctorId: string, dateStr: string): Promise<Slot[]> {
  const { start, end } = dayRange(dateStr);
  const weekday = start.getDay();
  const now = new Date();

  const [schedules, exceptions, appointments] = await Promise.all([
    prisma.doctorSchedule.findMany({
      where: { doctorId, weekday, isActive: true },
      orderBy: { startMinute: "asc" },
    }),
    prisma.scheduleException.findMany({
      where: { doctorId, date: { gte: start, lt: end } },
    }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: start, lt: end },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      select: { scheduledAt: true, durationMinutes: true },
    }),
  ]);

  const slots: Slot[] = [];

  for (const schedule of schedules) {
    for (
      let minute = schedule.startMinute;
      minute + schedule.slotMinutes <= schedule.endMinute;
      minute += schedule.slotMinutes
    ) {
      const slotStart = new Date(start.getTime() + minute * 60_000);
      const slotEnd = new Date(slotStart.getTime() + schedule.slotMinutes * 60_000);

      if (slotStart <= now) continue;

      const blockedByException = exceptions.some((ex) => {
        if (ex.allDay) return true;
        if (ex.startMinute == null || ex.endMinute == null) return true;
        return minute < ex.endMinute && minute + schedule.slotMinutes > ex.startMinute;
      });
      if (blockedByException) continue;

      const taken = appointments.some((apt) => {
        const aptEnd = new Date(apt.scheduledAt.getTime() + apt.durationMinutes * 60_000);
        return slotStart < aptEnd && slotEnd > apt.scheduledAt;
      });
      if (taken) continue;

      slots.push({
        startsAt: slotStart.toISOString(),
        label: `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`,
      });
    }
  }

  return slots;
}
