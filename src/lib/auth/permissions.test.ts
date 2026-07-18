import { describe, expect, it } from "vitest";
import { PERMISSIONS, ROLES, ROLE_PERMISSIONS, roleHasPermission } from "./permissions";

describe("RBAC permission matrix", () => {
  it("defines a permission list for every role, and only for declared roles", () => {
    const roleKeys = Object.keys(ROLE_PERMISSIONS).sort();
    expect(roleKeys).toEqual([...ROLES].sort());
  });

  it("only references permissions that exist in the canonical PERMISSIONS list", () => {
    const known = new Set(PERMISSIONS);
    for (const role of ROLES) {
      for (const permission of ROLE_PERMISSIONS[role]) {
        expect(known.has(permission), `${role} has unknown permission "${permission}"`).toBe(true);
      }
    }
  });

  it("grants SUPER_ADMIN every permission", () => {
    expect([...ROLE_PERMISSIONS.SUPER_ADMIN].sort()).toEqual([...PERMISSIONS].sort());
  });

  it("keeps PATIENT scoped to self-service permissions only — never patients:read (staff directory)", () => {
    // A regression guard for the IDOR class of bug: PATIENT must never get a
    // permission that implies browsing OTHER people's records by default.
    expect(ROLE_PERMISSIONS.PATIENT).not.toContain("patients:read");
    expect(ROLE_PERMISSIONS.PATIENT).not.toContain("billing:pay");
    expect(ROLE_PERMISSIONS.PATIENT).not.toContain("users:read");
  });

  it("never grants ACCOUNTANT clinical write access", () => {
    expect(ROLE_PERMISSIONS.ACCOUNTANT).not.toContain("encounters:update");
    expect(ROLE_PERMISSIONS.ACCOUNTANT).not.toContain("prescriptions:create");
  });

  it("roleHasPermission agrees with the ROLE_PERMISSIONS table", () => {
    expect(roleHasPermission("DOCTOR", "encounters:close")).toBe(true);
    expect(roleHasPermission("DOCTOR", "billing:void")).toBe(false);
    expect(roleHasPermission("PATIENT", "appointments:read")).toBe(true);
    expect(roleHasPermission("PATIENT", "patients:read")).toBe(false);
  });

  it("has no duplicate permissions within a single role", () => {
    for (const role of ROLES) {
      const perms = ROLE_PERMISSIONS[role];
      expect(new Set(perms).size, `${role} has duplicate entries`).toBe(perms.length);
    }
  });
});
