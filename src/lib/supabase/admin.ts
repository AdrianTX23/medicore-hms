import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env, envPublic } from "@/lib/env";

/**
 * Service-role client — bypasses RLS. Server-only, and only for
 * administrative flows (user provisioning, storage management).
 */
export function createAdminClient() {
  const serviceKey = env().SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createClient(envPublic.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
