import { sql } from "drizzle-orm";
import { pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { pkUuid, timestamps, type Locale } from "@core/db/columns";

/**
 * Cross-cutting translation store (owned by `core/i18n`). Every **[T]** field of
 * every entity is a row here, keyed by (entity_type, entity_id, field, locale).
 * Adding a locale is a data change, not a schema change (data-model.md).
 */
export const translation = pgTable(
  "translation",
  {
    id: pkUuid(),
    entity_type: text().notNull(),
    entity_id: uuid().notNull(),
    /** 'name' | 'description' | 'block:<dot.path>' | ... */
    field: text().notNull(),
    locale: text().$type<Locale>().notNull(),
    value: text().notNull(),
    /** 'draft' | 'needs_review' | 'approved' */
    state: text().$type<"draft" | "needs_review" | "approved">().notNull().default("draft"),
    /** hash of the source field when translated — staleness detection. */
    source_hash: text(),
    updated_by: uuid(),
    ...timestamps,
  },
  (t) => [unique("translation_key").on(t.entity_type, t.entity_id, t.field, t.locale)],
);

/** Per-locale public slugs (collision-checked, localizable URLs). */
export const slug = pgTable(
  "slug",
  {
    id: pkUuid(),
    entity_type: text().notNull(),
    entity_id: uuid().notNull(),
    locale: text().$type<Locale>().notNull(),
    slug: text().notNull(),
    ...timestamps,
  },
  (t) => [unique("slug_key").on(t.entity_type, t.locale, t.slug)],
);
