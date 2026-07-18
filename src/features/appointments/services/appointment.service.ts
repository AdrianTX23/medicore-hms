import "server-only";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/core/errors";
import {
  APPOINTMENT_TRANSITIONS,
  CANCELLABLE_STATUSES,
} from "@/features/appointments/constants";
import type { CreateAppointmentInput } from "@/features/appointments/schemas/appointment.schema";
import { Prisma } from "@/generated/prisma/client";
import type { AppointmentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function createAppointment(input: CreateAppointmentInput, createdById: string) {
  const scheduledAt = new Date(input.scheduledAt);

  if (scheduledAt <= new Date()) {
    throw new BusinessRuleError("La cita debe ser en el futuro");
  }

  const [patient, doctor] = await Promise.all([
    prisma.patient.findFirst({
      where: { id: input.patientId, deletedAt: null },
      select: { id: true },
    }),
    prisma.staffProfile.findUnique({
      where: { id: input.doctorId },
      select: { id: true },
    }),
  ]);
  if (!patient) throw new NotFoundError("El paciente");
  if (!doctor) throw new NotFoundError("El médico");

  // The slot must align with the doctor's weekly schedule.
  const weekday = scheduledAt.getDay();
  const minute = scheduledAt.getHours() * 60 + scheduledAt.getMinutes();
  const schedule = await prisma.doctorSchedule.findFirst({
    where: {
      doctorId: input.doctorId,
      weekday,
      isActive: true,
      startMinute: { lte: minute },
    },
    orderBy: { startMinute: "desc" },
  });

  const fitsSchedule =
    schedule &&
    minute + schedule.slotMinutes <= schedule.endMinute &&
    (minute - schedule.startMinute) % schedule.slotMinutes === 0;
  if (!fitsSchedule) {
    throw new BusinessRuleError("Ese horario no está dentro de la agenda del médico");
  }

  const blocked = await prisma.scheduleException.findFirst({
    where: {
      doctorId: input.doctorId,
      date: {
        gte: new Date(scheduledAt.getFullYear(), scheduledAt.getMonth(), scheduledAt.getDate()),
        lt: new Date(scheduledAt.getFullYear(), scheduledAt.getMonth(), scheduledAt.getDate() + 1),
      },
      OR: [
        { allDay: true },
        {
          startMinute: { lt: minute + schedule.slotMinutes },
          endMinute: { gt: minute },
        },
      ],
    },
  });
  if (blocked) {
    throw new BusinessRuleError("El médico no está disponible ese día (agenda bloqueada)");
  }

  try {
    return await prisma.appointment.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        scheduledAt,
        durationMinutes: schedule.slotMinutes,
        reason: input.reason,
        createdById,
      },
      select: { id: true, scheduledAt: true },
    });
  } catch (e) {
    // The partial unique index (doctor_id, scheduled_at) is the last line
    // of defense against concurrent double-booking.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ConflictError("El médico ya tiene una cita en ese horario");
    }
    throw e;
  }
}

export async function changeAppointmentStatus(id: string, nextStatus: AppointmentStatus) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!appointment) throw new NotFoundError("La cita");

  if (!APPOINTMENT_TRANSITIONS[appointment.status].includes(nextStatus)) {
    throw new BusinessRuleError(
      `Una cita ${appointment.status.toLowerCase()} no puede pasar a ${nextStatus.toLowerCase()}`,
    );
  }

  return prisma.appointment.update({
    where: { id },
    data: { status: nextStatus },
    select: { id: true, status: true },
  });
}

export async function cancelAppointment(id: string, reason: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!appointment) throw new NotFoundError("La cita");

  if (!CANCELLABLE_STATUSES.includes(appointment.status)) {
    throw new BusinessRuleError("Solo se pueden cancelar citas programadas o confirmadas");
  }

  return prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED", cancelledReason: reason },
    select: { id: true, status: true },
  });
}
