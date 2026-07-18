import type { EncounterStatus, EncounterType } from "@/generated/prisma/enums";

export const ENCOUNTER_STATUS_LABELS: Record<EncounterStatus, string> = {
  IN_PROGRESS: "En curso",
  CLOSED: "Cerrada",
};

export const ENCOUNTER_STATUS_VARIANTS: Record<
  EncounterStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  IN_PROGRESS: "default",
  CLOSED: "outline",
};

export const ENCOUNTER_TYPE_LABELS: Record<EncounterType, string> = {
  OUTPATIENT: "Ambulatoria",
  EMERGENCY: "Urgencia",
  INPATIENT: "Hospitalaria",
};
