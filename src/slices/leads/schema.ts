import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";

/**
 * Slice `leads` — form captures (ADR 0014). One `lead` row + `lead_field` KV child;
 * GDPR consent is first-class. Field values are not [T] (user-entered data).
 */
export const lead = pgTable("lead", {
  id: pkUuid(),
  kind: text()
    .$type<"earnings_estimate" | "deal_enquiry" | "contact" | "newsletter">()
    .notNull(),
  status: text().$type<"new" | "in_progress" | "closed">().notNull().default("new"),
  locale: text().notNull(),
  source_page: text().notNull(),
  assigned_to: text(), // → user.id (core/auth)
  // GDPR / consent (PT/EU)
  marketing_consent: boolean().notNull().default(false),
  consent_text: text(),
  consent_at: timestamp("consent_at", { withTimezone: true }),
  ip_address: text(),
  user_agent: text(),
  ...timestamps,
});

export const lead_field = pgTable("lead_field", {
  id: pkUuid(),
  lead_id: uuid()
    .notNull()
    .references(() => lead.id, { onDelete: "cascade" }),
  key: text().notNull(),
  value: text(),
  ...timestamps,
});
