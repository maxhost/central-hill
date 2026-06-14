import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit reads every slice's `schema.ts` plus the kernel-owned tables
 * (translation/slug in core/i18n, media_asset in core/media, auth tables in
 * core/auth). Migrations are emitted to `drizzle/`, numbered and append-only
 * (CLAUDE.md golden rule 4). `DATABASE_URL` is only needed for migrate/push/studio,
 * not for `generate`.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/core/**/schema.ts", "./src/slices/**/schema.ts"],
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
