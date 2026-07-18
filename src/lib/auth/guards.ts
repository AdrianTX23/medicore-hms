import "server-only";
import { redirect } from "next/navigation";
import { ForbiddenError, UnauthorizedError } from "@/core/errors";
import type { Permission } from "@/lib/auth/permissions";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";

/** For Server Actions / services: throws typed errors (safe-action serializes them). */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireAuth();
  if (!user.permissions.has(permission)) throw new ForbiddenError();
  return user;
}

/** For pages/layouts: redirects instead of throwing. */
export async function requireAuthPage(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermissionPage(permission: Permission): Promise<SessionUser> {
  const user = await requireAuthPage();
  if (!user.permissions.has(permission)) redirect("/dashboard");
  return user;
}
