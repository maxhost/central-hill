import type { LeadKind } from "../validation";

/**
 * Pure presentation helpers for the backoffice leads inbox (S12 — slice `leads`).
 * No DB, no `server-only`, so they run under `tsx --test` and stay deterministic.
 * The queries (`admin/queries.ts`) and screens import these to derive a display
 * label, group KV rows per lead, and format timestamps consistently.
 */

/**
 * Field keys (in priority order) used to derive a human label for a lead in the
 * list. Earnings estimates carry no contact name, so they fall back to the
 * property address; newsletter signups fall back to the email. Mirrors the
 * documented per-`kind` `lead_field` keys (data-model.md / `validation.ts`).
 */
export const LEAD_TITLE_KEYS = [
  "contact_name",
  "name",
  "company_name",
  "property_address",
  "email",
] as const;

/** Placeholder shown when a lead has no field we can use as a label. */
export const NO_TITLE = "—";

/** Best available display label for a lead, from its flattened `lead_field` map. */
export function deriveLeadTitle(fields: Record<string, string>): string {
  for (const key of LEAD_TITLE_KEYS) {
    const value = fields[key];
    if (value) return value;
  }
  return NO_TITLE;
}

/**
 * Group raw `lead_field` rows into a `{ leadId → { key → value } }` lookup,
 * dropping null/empty values (`lead_field.value` is nullable in the schema even
 * though the public pipeline never writes blanks). Later rows win on key clash.
 */
export function groupFields(
  rows: { lead_id: string; key: string; value: string | null }[],
): Map<string, Record<string, string>> {
  const byLead = new Map<string, Record<string, string>>();
  for (const row of rows) {
    if (row.value == null || row.value === "") continue;
    let bucket = byLead.get(row.lead_id);
    if (!bucket) {
      bucket = {};
      byLead.set(row.lead_id, bucket);
    }
    bucket[row.key] = row.value;
  }
  return byLead;
}

/**
 * Map a lead `status` to a {@link StateBadge} tone. Kept here (not in the UI) so
 * the mapping is unit-testable and shared by the list + detail screens.
 */
export function statusTone(status: string): "accent" | "review" | "neutral" {
  if (status === "new") return "accent";
  if (status === "in_progress") return "review";
  return "neutral"; // closed
}

/** Stable, locale-independent timestamp format for the admin (Lisbon time). */
const ADMIN_DATE = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Lisbon",
});

/** Format a `Date` (or null) for display in the admin; null → em dash. */
export function formatAdminDate(value: Date | null | undefined): string {
  if (!value) return NO_TITLE;
  return ADMIN_DATE.format(value);
}

/** All four lead kinds, in the order they appear as inbox filter chips. */
export const LEAD_KINDS: readonly LeadKind[] = [
  "deal_enquiry",
  "contact",
  "earnings_estimate",
  "newsletter",
] as const;
