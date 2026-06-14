/**
 * Shared leads types — kept out of `contract.ts` so internal modules (the server
 * action, the client form hook) can import them without importing the barrel,
 * which would create an import cycle (contract → ui/form → contract). The contract
 * re-exports these for external consumers.
 */

/**
 * Result of a public submission. `fieldErrors` maps a field name (e.g. `email`,
 * `consent_text`) to a message so a form can show inline errors. `error` is a
 * machine code; the UI maps it to localized copy.
 */
export type LeadActionResult =
  | { ok: true }
  | { ok: false; error: "validation" | "server"; fieldErrors?: Record<string, string> };
