"use client";

import { createBrowserClient } from "@supabase/ssr";
import { envPublic } from "@/lib/env";

/** Browser Supabase client — auth/session only. Data access goes through Server Actions. */
export function createClient() {
  return createBrowserClient(
    envPublic.NEXT_PUBLIC_SUPABASE_URL,
    envPublic.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
