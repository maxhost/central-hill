import { sql } from "drizzle-orm";
import { timestamp, uuid } from "drizzle-orm/pg-core";

/** The 4 supported locales (runtime list lives in `i18n/routing`). */
export const LOCALES = ["en", "pt", "es", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

/** Standard primary key: `uuid` defaulting to `gen_random_uuid()`. */
export const pkUuid = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);

/** `created_at` / `updated_at` present on every table (data-model.md conventions). */
export const timestamps = {
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};
