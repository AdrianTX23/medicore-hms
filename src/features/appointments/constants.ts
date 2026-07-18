import type { AppointmentStatus } from "@/generated/prisma/enums";

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No se presentó",
};

export const APPOINTMENT_STATUS_VARIANTS: Record<
  AppointmentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  SCHEDULED: "secondary",
  CONFIRMED: "default",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
};

/**
 * Valid state machine transitions. Cancellation goes through its own
 * action (it requires a reason), so it is not listed here.
 */
export const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  SCHEDULED: ["CONFIRMED", "NO_SHOW"],
  CONFIRMED: ["IN_PROGRESS", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

/** Statuses a new appointment can still be cancelled from. */
export const CANCELLABLE_STATUSES: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED"];
