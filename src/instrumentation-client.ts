import * as Sentry from "@sentry/nextjs";
import { envPublic } from "@/lib/env";

Sentry.init({
  dsn: envPublic.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  // Session replay only on error, and heavily sampled — this is a clinical
  // app, replays can capture PHI on screen even with default masking.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,
  integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
