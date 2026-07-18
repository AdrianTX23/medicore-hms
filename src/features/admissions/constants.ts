import type { AdmissionStatus, BedStatus } from "@/generated/prisma/enums";

export const BED_STATUS_LABELS: Record<BedStatus, string> = {
  AVAILABLE: "Disponible",
  OCCUPIED: "Ocupada",
  CLEANING: "En limpieza",
  MAINTENANCE: "Mantenimiento",
};

/** CSS color values (theme tokens) driving the bed map tiles. */
export const BED_STATUS_COLORS: Record<BedStatus, string> = {
  AVAILABLE: "var(--status-good)",
  OCCUPIED: "var(--chart-1)",
  CLEANING: "var(--status-warning)",
  MAINTENANCE: "var(--muted-foreground)",
};

export const ADMISSION_STATUS_LABELS: Record<AdmissionStatus, string> = {
  ADMITTED: "Ingresado",
  DISCHARGED: "Dado de alta",
};
