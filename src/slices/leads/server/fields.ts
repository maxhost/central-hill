import type { LeadSubmission } from "../validation";

/**
 * Pure mapping of a validated submission's typed `fields` into `lead_field` KV
 * rows (ADR 0014 — one `lead` + a KV child, documented keys per `kind`). No DB,
 * no `server-only` — unit tested in `tests/leads.test.ts`.
 *
 * Empty / undefined optionals are dropped (we never store blank rows). Numbers and
 * booleans are stringified (every `lead_field.value` is `text`). Key order follows
 * the Zod field shape so the inbox renders fields consistently.
 */
export function flattenFields(submission: LeadSubmission): { key: string; value: string }[] {
  const rows: { key: string; value: string }[] = [];
  for (const [key, raw] of Object.entries(submission.fields)) {
    if (raw === undefined || raw === null) continue;
    const value = typeof raw === "string" ? raw.trim() : String(raw);
    if (value === "") continue;
    rows.push({ key, value });
  }
  return rows;
}
