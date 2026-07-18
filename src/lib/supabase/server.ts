import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { envPublic } from "@/lib/env";

/** Server Supabase client bound to the request cookies (Server Components & Actions). */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    envPublic.NEXT_PUBLIC_SUPABASE_URL,
    envPublic.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore, the middleware
            // refreshes sessions.
          }
        },
      },
    },
  );
}
