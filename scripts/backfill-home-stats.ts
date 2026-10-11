/**
 * One-off, idempotent pre-fill of the Home figures band (spec `home-admin-editor` → S4 cierre / S5).
 *
 * From S5 on, the Home stops reading the company figures from Settings and renders
 * `page_content(key='home').data.stats.figures` instead (0–8 `statFigure` rows; no rows → no
 * band). This copies today's four company figures (bookings, years, guests, revenue — the order
 * `home-page.tsx` renders them in) into that list so the band doesn't vanish on the S5 deploy:
 *
 * - **Number:** each Settings value ("65+", "€55M+", "400,000+") is parsed into
 *   `{ prefix, to, suffix, group }` with `parseStatValue`, which only accepts a value that
 *   renders back to the exact same string. Empty values are skipped; an unparseable value
 *   aborts (nothing is written) so a figure is never silently dropped.
 * - **Label (EN):** the Settings source label (EN `translation` row, else the inline label —
 *   the same precedence `getGlobals` uses) goes inline into `data.stats.figures[i].label`.
 *   `data.stats.title` is kept.
 * - **Labels (PT/ES/FR):** every target-locale `translation` row of the Settings label
 *   (`company_settings` / `stats.<key>.label`) is copied as a `page_content` row with field
 *   `block:stats.figures.<i>.label` — the key `server/resolve.ts` overlays — keeping its
 *   `state` (only `approved` renders publicly) and `source_hash`. Existing rows are never
 *   overwritten (`ON CONFLICT DO NOTHING`). They become visible once S5 adds
 *   `stats.figures[].label` to the Home schema's translatable paths.
 *
 * Idempotent: if `data.stats.figures` already has rows, nothing is written. The page update is
 * also guarded in SQL (only when figures is still empty) and runs with the translation inserts
 * in one Neon `batch` (a single non-interactive transaction).
 *
 * ⚠️ Until S5 is deployed, the Home schema does not know `stats.figures`: saving the Home from
 * the admin strips it (Zod drops unknown keys). Deploy S5 right after `--apply`, or re-run this
 * script after the deploy.
 *
 * ISR: the row is written directly; the public page picks it up on its next revalidation (or
 * after any save in /admin/pages/home — which, before S5, would strip it, see above).
 *
 *   pnpm tsx --env-file=.env.local --tsconfig scripts/tsconfig.json scripts/backfill-home-stats.ts           # dry run (default, read-only)
 *   pnpm tsx --env-file=.env.local --tsconfig scripts/tsconfig.json scripts/backfill-home-stats.ts --apply   # write
 */
import { neon } from "@neondatabase/serverless";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import type { Locale } from "@core/db/columns";
import { translation } from "@core/i18n/schema";
import { page_content } from "@slices/pages/schema";
import { formatStatFigure, parseStatValue } from "@slices/pages/ui/stat-figure-value";
import { company_settings } from "@slices/settings/schema";

const APPLY = process.argv.includes("--apply");
const SOURCE_LOCALE: Locale = "en";
/** Same order as the Home's `StatsBand` keys today. */
const KEYS = ["bookings", "years", "guests", "revenue"] as const;
const COMPANY_SETTINGS = "company_settings"; // settings contract entity type
const PAGE_CONTENT = "page_content"; // pages contract entity type

const db = drizzle(neon(process.env.DATABASE_URL ?? ""));

interface Figure {
  to: string;
  prefix: string;
  suffix: string;
  group: boolean;
  label: string;
}

async function main() {
  console.log(APPLY ? "MODE: --apply (writes)\n" : "MODE: dry run (read-only — pass --apply to write)\n");

  // ── Home row ───────────────────────────────────────────────────────────────
  const [home] = await db.select().from(page_content).where(eq(page_content.key, "home")).limit(1);
  if (!home) {
    console.error("✗ no `home` page_content row — nothing to fill.");
    process.exit(1);
  }
  const data = home.data as Record<string, unknown>;
  const stats = (data.stats ?? {}) as Record<string, unknown>;
  const existing = stats.figures;
  if (Array.isArray(existing) && existing.length > 0) {
    console.log(`✓ home data.stats.figures already has ${existing.length} row(s) — nothing to do.`);
    return;
  }

  // ── Settings figures + labels ──────────────────────────────────────────────
  const [settings] = await db
    .select({ id: company_settings.id, stats: company_settings.stats })
    .from(company_settings)
    .orderBy(asc(company_settings.created_at))
    .limit(1);
  if (!settings) {
    console.error("✗ no company_settings row — nothing to copy.");
    process.exit(1);
  }

  const labelRows = await db
    .select({
      field: translation.field,
      locale: translation.locale,
      value: translation.value,
      state: translation.state,
      source_hash: translation.source_hash,
    })
    .from(translation)
    .where(
      and(
        eq(translation.entity_type, COMPANY_SETTINGS),
        eq(translation.entity_id, settings.id),
        inArray(
          translation.field,
          KEYS.map((k) => `stats.${k}.label`),
        ),
      ),
    );

  console.log("Current Settings figures (company_settings.stats):");
  const figures: Figure[] = [];
  const targetRows: (typeof translation.$inferInsert)[] = [];
  const problems: string[] = [];

  for (const key of KEYS) {
    const raw = settings.stats[key];
    const field = `stats.${key}.label`;
    const rows = labelRows.filter((r) => r.field === field);
    const enLabel = rows.find((r) => r.locale === SOURCE_LOCALE)?.value ?? raw?.label ?? "";
    const value = (raw?.value ?? "").trim();
    const targets = rows.filter((r) => r.locale !== SOURCE_LOCALE);
    console.log(
      `  ${key.padEnd(9)} value=${JSON.stringify(raw?.value ?? "")} label(en)=${JSON.stringify(enLabel)}` +
        targets.map((t) => ` ${t.locale}=${JSON.stringify(t.value)}[${t.state}]`).join(""),
    );

    if (!value) {
      console.log(`    → skipped (empty value)`);
      continue;
    }
    const parsed = parseStatValue(value);
    if (!parsed) {
      problems.push(`${key}: value ${JSON.stringify(value)} can't be expressed as a figure row`);
      continue;
    }
    if (!enLabel.trim()) {
      problems.push(`${key}: empty EN label (the figure's label is required)`);
      continue;
    }

    const i = figures.length;
    figures.push({ ...parsed, label: enLabel.trim() });
    console.log(
      `    → figures[${i}] = ${JSON.stringify(parsed)} → renders ${JSON.stringify(formatStatFigure(parsed))}`,
    );
    for (const t of targets) {
      targetRows.push({
        entity_type: PAGE_CONTENT,
        entity_id: home.id,
        field: `block:stats.figures.${i}.label`,
        locale: t.locale,
        value: t.value,
        state: t.state,
        source_hash: t.source_hash,
      });
    }
  }

  if (problems.length > 0) {
    console.error("\n✗ aborting without writing:");
    for (const p of problems) console.error(`   ${p}`);
    process.exit(1);
  }
  if (figures.length === 0) {
    console.log("\n✓ every Settings figure is empty — nothing to write.");
    return;
  }

  const nextStats = { ...stats, figures };
  console.log(`\nWould set home (${home.id}) data.stats to:`);
  console.log(JSON.stringify(nextStats, null, 2));
  console.log(`\nWould insert ${targetRows.length} translation row(s) (ON CONFLICT DO NOTHING):`);
  for (const r of targetRows) {
    console.log(`  ${r.entity_type}/${r.entity_id} ${r.field} [${r.locale}] ${JSON.stringify(r.value)} state=${r.state}`);
  }
  if (targetRows.length > 0) {
    console.log(
      "  (inert until S5 adds stats.figures[].label to the Home's translatable paths; only 'approved' rows render)",
    );
  }

  if (!APPLY) {
    console.log("\nDry run — no write made. Re-run with --apply to write.");
    return;
  }

  console.warn(
    "\n⚠️  Until S5 is deployed, saving the Home from the admin STRIPS data.stats.figures " +
      "(the S4 schema doesn't know it). Deploy S5 right after this, or re-run the script after the deploy.",
  );

  // Guarded jsonb merge: only fills figures while still empty (keeps every other key, incl. stats.title).
  const update = db
    .update(page_content)
    .set({
      data: sql`jsonb_set(${page_content.data}, '{stats}', coalesce(${page_content.data}->'stats', '{}'::jsonb) || jsonb_build_object('figures', ${JSON.stringify(figures)}::jsonb), true)`,
      updated_at: new Date(),
    })
    .where(
      and(
        eq(page_content.id, home.id),
        sql`coalesce(jsonb_array_length(${page_content.data}->'stats'->'figures'), 0) = 0`,
      ),
    )
    .returning({ id: page_content.id });

  if (targetRows.length > 0) {
    const insert = db.insert(translation).values(targetRows).onConflictDoNothing({
      target: [translation.entity_type, translation.entity_id, translation.field, translation.locale],
    });
    const [updated] = await db.batch([update, insert]);
    console.log(`✓ home row ${updated.length ? "updated" : "NOT updated (figures appeared meanwhile)"}; translations inserted (existing kept).`);
  } else {
    const updated = await update;
    console.log(`✓ home row ${updated.length ? "updated" : "NOT updated (figures appeared meanwhile)"}.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
