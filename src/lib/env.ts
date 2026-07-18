import { z } from "zod";

/**
 * Fail-fast environment validation.
 * Server-only vars must never be imported from client components —
 * use `envPublic` there instead.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Optional: Sentry no-ops with an undefined DSN, so local dev works
  // without it — only production deploys need it actually set.
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

function formatIssues(error: z.ZodError): string {
  return error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
}

const publicParsed = publicSchema.safeParse({
  // NEXT_PUBLIC_* must be referenced statically so Next.js inlines them in the client bundle
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

if (!publicParsed.success) {
  throw new Error(`❌ Invalid public environment variables:\n${formatIssues(publicParsed.error)}`);
}

export const envPublic = publicParsed.data;

let serverEnv: z.infer<typeof serverSchema> | null = null;

/** Server-side env. Lazily validated so importing this file never breaks the client bundle. */
export function env(): z.infer<typeof serverSchema> {
  if (typeof window !== "undefined") {
    throw new Error("env() is server-only. Use envPublic on the client.");
  }
  if (!serverEnv) {
    const parsed = serverSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`❌ Invalid server environment variables:\n${formatIssues(parsed.error)}`);
    }
    serverEnv = parsed.data;
  }
  return serverEnv;
}
