/**
 * Canonical RBAC definition — single source of truth.
 * Consumed by: prisma/seed.ts (persists to DB), auth guards, and the sidebar.
 *
 * Permissions follow the "module:action" convention. Ownership rules
 * (e.g. a doctor can only close their OWN encounters, a patient only sees
 * their OWN invoices) are enforced in the service layer, not here.
 */

export const PERMISSIONS = [
  // patients
  "patients:read",
  "patients:create",
  "patients:update",
  "patients:delete",
  // appointments
  "appointments:read",
  "appointments:create",
  "appointments:update",
  "appointments:cancel",
  // encounters (EMR)
  "encounters:read",
  "encounters:create",
  "encounters:update",
  "encounters:close",
  "encounters:addendum",
  "encounters:vitals",
  // prescriptions
  "prescriptions:read",
  "prescriptions:create",
  "prescriptions:cancel",
  // laboratory
  "laboratory:read",
  "laboratory:order",
  "laboratory:results",
  "laboratory:validate",
  // pharmacy
  "pharmacy:read",
  "pharmacy:dispense",
  "pharmacy:inventory",
  // admissions
  "admissions:read",
  "admissions:create",
  "admissions:update",
  // billing
  "billing:read",
  "billing:create",
  "billing:update",
  "billing:pay",
  "billing:void",
  // staff
  "staff:read",
  "staff:create",
  "staff:update",
  // reports & system
  "reports:read",
  "users:read",
  "users:create",
  "users:update",
  "settings:read",
  "settings:update",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "DOCTOR",
  "NURSE",
  "RECEPTIONIST",
  "LAB_TECHNICIAN",
  "PHARMACIST",
  "ACCOUNTANT",
  "PATIENT",
] as const;

export type RoleName = (typeof ROLES)[number];

export const ROLE_PERMISSIONS: Record<RoleName, readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,

  ADMIN: [
    "patients:read",
    "patients:create",
    "patients:update",
    "patients:delete",
    "appointments:read",
    "appointments:create",
    "appointments:update",
    "appointments:cancel",
    "laboratory:read",
    "pharmacy:read",
    "admissions:read",
    "billing:read",
    "billing:create",
    "billing:update",
    "billing:pay",
    "billing:void",
    "staff:read",
    "staff:create",
    "staff:update",
    "reports:read",
    "users:read",
    "users:create",
    "users:update",
    "settings:read",
    "settings:update",
  ],

  DOCTOR: [
    "patients:read",
    "appointments:read",
    "appointments:update",
    "encounters:read",
    "encounters:create",
    "encounters:update",
    "encounters:close",
    "encounters:addendum",
    "encounters:vitals",
    "prescriptions:read",
    "prescriptions:create",
    "prescriptions:cancel",
    "laboratory:read",
    "laboratory:order",
    "admissions:read",
    "admissions:create",
  ],

  NURSE: [
    "patients:read",
    "appointments:read",
    "encounters:read",
    "encounters:vitals",
    "laboratory:read",
    "admissions:read",
    "admissions:create",
    "admissions:update",
  ],

  RECEPTIONIST: [
    "patients:read",
    "patients:create",
    "patients:update",
    "appointments:read",
    "appointments:create",
    "appointments:update",
    "appointments:cancel",
    "billing:read",
  ],

  LAB_TECHNICIAN: [
    "patients:read",
    "laboratory:read",
    "laboratory:results",
    "laboratory:validate",
  ],

  PHARMACIST: [
    "patients:read",
    "prescriptions:read",
    "pharmacy:read",
    "pharmacy:dispense",
    "pharmacy:inventory",
  ],

  ACCOUNTANT: [
    "patients:read",
    "billing:read",
    "billing:create",
    "billing:update",
    "billing:pay",
    "billing:void",
    "reports:read",
  ],

  // Ownership (own appointments/results/invoices only) is enforced in services.
  PATIENT: [
    "appointments:read",
    "appointments:create",
    "encounters:read",
    "prescriptions:read",
    "laboratory:read",
    "billing:read",
  ],
};

export function roleHasPermission(role: RoleName, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
