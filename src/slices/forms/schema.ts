import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { pkUuid, timestamps } from "@core/db/columns";
import type { DeliveryState, StoredFormBlueprint, FormTemplate, FormValues } from "./types";

export const form_definition = pgTable("form_definition", {
  id: pkUuid(), name: text().notNull(), template: text().$type<FormTemplate>().notNull(),
  recipient: text().notNull().default(""), status: text().$type<"draft" | "archived">().notNull().default("draft"),
  revision: integer().notNull().default(1), definition: jsonb().$type<StoredFormBlueprint>().notNull(),
  ...timestamps,
});
/** Staff-only test submissions, separate from production Leads. Never inserted by a public page. */
export const form_test_submission = pgTable("form_test_submission", {
  id: pkUuid(), form_id: uuid().notNull().references(() => form_definition.id),
  revision: integer().notNull(), locale: text().notNull(), recipient: text().notNull(),
  definition_snapshot: jsonb().$type<StoredFormBlueprint>().notNull(), values: jsonb().$type<FormValues>().notNull(),
  created_by: text().notNull(), delivery: text().$type<DeliveryState>().notNull().default("skipped"),
  provider_id: text(), delivery_error: text(), ...timestamps,
});

/** Durable short-window counters for anonymous header contact attempts. */
export const form_public_rate_limit = pgTable("form_public_rate_limit", {
  key: text().primaryKey(), attempts: integer().notNull(), window_start: timestamp("window_start", { withTimezone: true }).notNull(),
});
