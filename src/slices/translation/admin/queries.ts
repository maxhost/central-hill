import "server-only";
import { hashSource, loadTranslationRows } from "@core/i18n";
import {
  buildEntity,
  buildInbox,
  entityTypesOf,
  sumRollups,
  type EntityTranslations,
  type InboxItem,
  type Rollup,
} from "./derive";

/**
 * Backoffice read queries for the translation review inbox (S14). Server-only;
 * these run inside the `requireStaff`-gated `(panel)` route group, never on the
 * public ISR path. The kernel `loadTranslationRows` is the only table access
 * (golden rule 4); the inbox matrix is derived in memory (`./derive`) — the
 * dataset is the CMS's [T] content, small, and read dynamically in the admin.
 */

export interface TranslationInboxFilters {
  /** Restrict to one entity type (e.g. `building`). */
  entityType?: string;
  /** `attention` = anything not fully approved; `done` = fully approved. */
  view?: "attention" | "done";
}

export interface TranslationInbox {
  items: InboxItem[];
  counts: Rollup;
  entityTypes: string[];
}

/** The review inbox: one row per entity, attention-first, with rollup counts. */
export async function getTranslationInbox(
  filters: TranslationInboxFilters = {},
): Promise<TranslationInbox> {
  const rows = await loadTranslationRows(
    filters.entityType ? { type: filters.entityType } : {},
  );
  const all = buildInbox(rows, hashSource);

  // Counts + the entity-type chips reflect the full set (before the view filter),
  // so switching views never changes the totals shown on the chips.
  const counts = sumRollups(all);
  const entityTypes = entityTypesOf(all);

  let items = all;
  if (filters.view === "attention") items = all.filter((i) => i.needsAttention);
  else if (filters.view === "done") items = all.filter((i) => !i.needsAttention);

  return { items, counts, entityTypes };
}

/** Full source-vs-target matrix for one entity, or `null` if it has no [T] rows. */
export async function getEntityTranslations(
  type: string,
  id: string,
): Promise<EntityTranslations | null> {
  const rows = await loadTranslationRows({ type, id });
  if (rows.length === 0) return null;
  return buildEntity(type, id, rows, hashSource);
}
