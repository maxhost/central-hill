import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { lead, lead_field } from "../schema";
import type { LeadKind } from "../validation";
import { deriveLeadTitle, groupFields } from "./derive";

/**
 * Backoffice read queries for the leads inbox (S12 — slice `leads`). Server-only;
 * these run inside the `requireStaff`-gated `(panel)` route group, never on the
 * public ISR path. Leads are not public content, so there are no cache tags — the
 * inbox is dynamic and reads live (ADR 0011/0014; leads README).
 */

export type LeadStatus = "new" | "in_progress" | "closed";

export interface LeadListFilters {
  status?: LeadStatus;
  kind?: LeadKind;
}

/** A row in the inbox list — the lead plus a derived contact label + email. */
export interface LeadListItem {
  id: string;
  kind: LeadKind;
  status: LeadStatus;
  locale: string;
  source_page: string;
  marketing_consent: boolean;
  created_at: Date;
  /** Best display label (contact/company/property/email); em dash if none. */
  title: string;
  /** The submitter's email if the form captured one (3 of 4 kinds do). */
  email: string | null;
}

/** Newest-first cap for the inbox list. Surfaced in the UI when reached. */
export const LEAD_LIST_LIMIT = 200;

/**
 * List leads (optionally filtered by `status` and/or `kind`), newest first,
 * capped at {@link LEAD_LIST_LIMIT}. Fields are fetched in a single follow-up
 * query and grouped in memory (no N+1); each row gets a derived title + email.
 */
export async function listLeads(filters: LeadListFilters = {}): Promise<LeadListItem[]> {
  const conditions = [];
  if (filters.status) conditions.push(eq(lead.status, filters.status));
  if (filters.kind) conditions.push(eq(lead.kind, filters.kind));

  const rows = await db
    .select({
      id: lead.id,
      kind: lead.kind,
      status: lead.status,
      locale: lead.locale,
      source_page: lead.source_page,
      marketing_consent: lead.marketing_consent,
      created_at: lead.created_at,
    })
    .from(lead)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(lead.created_at))
    .limit(LEAD_LIST_LIMIT);

  if (rows.length === 0) return [];

  const fieldRows = await db
    .select({ lead_id: lead_field.lead_id, key: lead_field.key, value: lead_field.value })
    .from(lead_field)
    .where(
      inArray(
        lead_field.lead_id,
        rows.map((r) => r.id),
      ),
    );
  const byLead = groupFields(fieldRows);

  return rows.map((row) => {
    const fields = byLead.get(row.id) ?? {};
    return { ...row, title: deriveLeadTitle(fields), email: fields.email ?? null };
  });
}

/** The full lead record for the detail / audit screen. */
export interface LeadDetail {
  id: string;
  kind: LeadKind;
  status: LeadStatus;
  locale: string;
  source_page: string;
  assigned_to: string | null;
  marketing_consent: boolean;
  consent_text: string | null;
  consent_at: Date | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  updated_at: Date;
  /** Captured fields, in insertion order (matches the form the user filled). */
  fields: { key: string; value: string }[];
}

/** Load one lead with its captured fields, or `null` if it does not exist. */
export async function getLead(id: string): Promise<LeadDetail | null> {
  const [row] = await db.select().from(lead).where(eq(lead.id, id)).limit(1);
  if (!row) return null;

  const fieldRows = await db
    .select({ key: lead_field.key, value: lead_field.value })
    .from(lead_field)
    .where(eq(lead_field.lead_id, id))
    .orderBy(lead_field.created_at, lead_field.id);

  const fields = fieldRows
    .filter((f): f is { key: string; value: string } => f.value != null && f.value !== "")
    .map((f) => ({ key: f.key, value: f.value }));

  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    locale: row.locale,
    source_page: row.source_page,
    assigned_to: row.assigned_to,
    marketing_consent: row.marketing_consent,
    consent_text: row.consent_text,
    consent_at: row.consent_at,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    created_at: row.created_at,
    updated_at: row.updated_at,
    fields,
  };
}

/** Lead counts per status (+ total), respecting an optional `kind` filter. */
export interface LeadStatusCounts {
  all: number;
  new: number;
  in_progress: number;
  closed: number;
}

/** Aggregate counts for the inbox filter chips. */
export async function leadStatusCounts(kind?: LeadKind): Promise<LeadStatusCounts> {
  const rows = await db
    .select({ status: lead.status, count: sql<number>`count(*)::int` })
    .from(lead)
    .where(kind ? eq(lead.kind, kind) : undefined)
    .groupBy(lead.status);

  const counts: LeadStatusCounts = { all: 0, new: 0, in_progress: 0, closed: 0 };
  for (const row of rows) {
    counts[row.status] = row.count;
    counts.all += row.count;
  }
  return counts;
}
