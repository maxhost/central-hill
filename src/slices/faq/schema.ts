import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";

/**
 * Slice `faq` — grouped marketing-page FAQs (distinct from per-building `building_faq`).
 * [T] fields (question, answer) live in `translation`.
 */
export const faq_group = pgTable("faq_group", {
  id: pkUuid(),
  /** binds a set to a page: 'owners' | 'real_estate' | 'guest' | ... */
  key: text().notNull(),
  position: integer().notNull().default(0),
  ...timestamps,
});

export const faq_item = pgTable("faq_item", {
  id: pkUuid(),
  group_id: uuid()
    .notNull()
    .references(() => faq_group.id, { onDelete: "cascade" }),
  position: integer().notNull().default(0),
  status: text().$type<"draft" | "published" | "archived">().notNull().default("draft"),
  ...timestamps,
});
