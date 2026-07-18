import type { RoleName } from "@/lib/auth/permissions";

export const ROLE_LABELS: Record<RoleName, string> = {
  SUPER_ADMIN: "Superadministrador",
  ADMIN: "Administración",
  DOCTOR: "Médico",
  NURSE: "Enfermería",
  RECEPTIONIST: "Recepción",
  LAB_TECHNICIAN: "Laboratorio",
  PHARMACIST: "Farmacia",
  ACCOUNTANT: "Contabilidad",
  PATIENT: "Paciente",
};
