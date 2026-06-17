/**
 * Empty stand-in for the `server-only` package when running repo scripts under tsx.
 * The real package is a build-time guard that has no Node-resolvable default export,
 * so importing modules that carry `import "server-only"` (e.g. the db client / auth)
 * fails outside the Next bundler. Scripts opt into this shim via `scripts/tsconfig.json`
 * — it is NEVER used by the app build (which keeps the real guard).
 */
export {};
