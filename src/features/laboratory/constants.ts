import type { LabOrderStatus, LabPriority } from "@/generated/prisma/enums";

export const LAB_ORDER_STATUS_LABELS: Record<LabOrderStatus, string> = {
  ORDERED: "Ordenada",
  SAMPLE_COLLECTED: "Muestra tomada",
  IN_PROGRESS: "En proceso",
  COMPLETED: "Completada",
  VALIDATED: "Validada",
  CANCELLED: "Cancelada",
};

export const LAB_ORDER_STATUS_VARIANTS: Record<
  LabOrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ORDERED: "secondary",
  SAMPLE_COLLECTED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "default",
  VALIDATED: "outline",
  CANCELLED: "destructive",
};

export const LAB_PRIORITY_LABELS: Record<LabPriority, string> = {
  ROUTINE: "Rutina",
  URGENT: "Urgente",
  STAT: "Inmediata (STAT)",
};

export const LAB_PRIORITY_VARIANTS: Record<
  LabPriority,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ROUTINE: "outline",
  URGENT: "default",
  STAT: "destructive",
};

/** Valid forward transitions for the lab workflow. */
export const LAB_ORDER_TRANSITIONS: Record<LabOrderStatus, LabOrderStatus[]> = {
  ORDERED: ["SAMPLE_COLLECTED"],
  SAMPLE_COLLECTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: ["VALIDATED"],
  VALIDATED: [],
  CANCELLED: [],
};
