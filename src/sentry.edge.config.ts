import * as Sentry from "@sentry/nextjs";
import { envPublic } from "@/lib/env";

Sentry.init({
  dsn: envPublic.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  enableLogs: true,
});
