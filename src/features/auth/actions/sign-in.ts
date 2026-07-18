"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@/features/auth/schemas/login.schema";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/safe-action";
import { createClient } from "@/lib/supabase/server";

const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;

/**
 * Sign-in cannot use createSafeAction (there is no session yet),
 * but follows the same contract: validate → execute → typed result.
 */
export async function signIn(rawInput: unknown): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Introduce un correo y una contraseña válidos" };
  }
  const email = parsed.data.email.toLowerCase();

  // DB-backed (not in-memory) since serverless instances don't share memory.
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60_000);
  const recentFailures = await prisma.loginAttempt.count({
    where: { email, success: false, createdAt: { gte: windowStart } },
  });
  if (recentFailures >= MAX_FAILED_ATTEMPTS) {
    return {
      success: false,
      error: `Demasiados intentos fallidos. Intenta de nuevo en ${RATE_LIMIT_WINDOW_MINUTES} minutos.`,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    await prisma.loginAttempt.create({ data: { email, success: false } });
    return { success: false, error: "Credenciales incorrectas" };
  }

  const appUser = await prisma.user.findUnique({
    where: { id: data.user.id },
    select: { isActive: true },
  });

  if (!appUser || !appUser.isActive) {
    await supabase.auth.signOut();
    return { success: false, error: "Tu cuenta está desactivada. Contacta al administrador." };
  }

  await prisma.user.update({
    where: { id: data.user.id },
    data: { lastLoginAt: new Date() },
  });
  await prisma.loginAttempt.create({ data: { email, success: true } });

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
