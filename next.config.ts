import path from "node:path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Pin the tracing root to this project (a stray lockfile exists in $HOME)
  outputFileTracingRoot: path.join(__dirname),
};

export default withSentryConfig(nextConfig, {
  org: "teamadrian",
  project: "javascript-nextjs",
  // Only noisy in CI, where it's actually useful to see; quiet locally.
  silent: !process.env.CI,
  // No SENTRY_AUTH_TOKEN configured yet — source map upload is skipped
  // gracefully (a warning, not a build failure) until one is added.
  widenClientFileUpload: true,
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true,
  },
});
