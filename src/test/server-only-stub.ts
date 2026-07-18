// Stand-in for the "server-only" package in tests. That package throws
// unconditionally unless resolved through Next.js's "react-server" export
// condition, which Vitest doesn't set — so integration tests alias
// "server-only" to this no-op instead.
export {};
