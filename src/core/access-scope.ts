import type { RoleName } from "@/lib/auth/permissions";

/**
 * Ownership scope passed into detail/list queries so the PATIENT role only
 * ever sees its own records. `patientId` is the caller's linked Patient row,
 * `null` for staff roles (ownership doesn't apply to them).
 */
export type RecordAccessScope = { role: RoleName; patientId: string | null };
