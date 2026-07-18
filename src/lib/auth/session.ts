import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Permission, RoleName } from "@/lib/auth/permissions";

export type SessionUser = {
  id: string;
  email: string;
  role: RoleName;
  permissions: ReadonlySet<Permission>;
  staffProfile: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null;
  patientId: string | null;
};

/**
 * Resolves the authenticated user with role + permissions from the DB.
 * Wrapped in React cache() → at most one lookup per request, no matter
 * how many components/actions call it.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      role: {
        include: { rolePermissions: { include: { permission: true } } },
      },
      staffProfile: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      patient: { select: { id: true } },
    },
  });

  if (!dbUser || !dbUser.isActive) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role.name as RoleName,
    permissions: new Set(
      dbUser.role.rolePermissions.map((rp) => rp.permission.code as Permission),
    ),
    staffProfile: dbUser.staffProfile,
    patientId: dbUser.patient?.id ?? null,
  };
});
