import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Integration tests hit the real database (concurrency guards can only be
 * proven against real transactions/locks, not mocks) — kept in a separate
 * config so `npm test` stays fast and DB-free for CI without secrets.
 * Requires DATABASE_URL / DIRECT_URL (see .env.example).
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // "server-only" throws unconditionally outside Next's RSC bundler
      // (it only no-ops via the "react-server" export condition, which
      // Vitest doesn't set) — point it at a local no-op stub instead.
      "server-only": path.resolve(__dirname, "src/test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    setupFiles: ["src/test/integration-setup.ts"],
    testTimeout: 20000,
    fileParallelism: false,
  },
});
