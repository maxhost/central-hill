/**
 * One-off, idempotent repair: bring the live `real_estate` `page_content` row up to the
 * current page schema.
 *
 * Some Real Estate sections became DB-driven (or changed shape) after the row was first
 * seeded, so an existing row may have a section that is **missing** OR **present but in an
 * older shape** the current schema no longer accepts. A stale section makes the public page
 * fail to render (the renderer reads raw `data`), and the backoffice editor can't show it
 * either. For each managed section this script writes the canonical default when the section
 * is missing or no longer validates; sections that already match the schema are left
 * untouched, so manual edits are preserved. It then parses the whole row through the page
 * schema — which also **strips any legacy keys** no longer in the schema — before saving.
 *
 * Manages: `capabilities`, `deal_structures`, `track_record`, `process` (the sections with a
 * canonical default). If a section OUTSIDE this set is invalid there is no default to fall
 * back to, so the final parse fails and the script aborts without writing — that's an
 * escalation, not something to force.
 *
 * Safe to run repeatedly: a row already matching the schema makes no write.
 * Run:  pnpm tsx scripts/backfill-real-estate-sections.ts
 *       DRY=1 pnpm tsx scripts/backfill-real-estate-sections.ts   # report only
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { page_content } from "@slices/pages/schema";
import {
  defaultCapabilities,
  defaultDealStructures,
  defaultProcess,
  defaultTrackRecord,
  realEstateSchema,
} from "@slices/pages/schemas/real-estate";

const db = drizzle(neon(process.env.DATABASE_URL ?? ""));

/** Sections this repair can restore, by their `data` key → canonical default content. */
const SECTIONS: Record<string, unknown> = {
  capabilities: defaultCapabilities,
  deal_structures: defaultDealStructures,
  track_record: defaultTrackRecord,
  process: defaultProcess,
};

async function main() {
  const [row] = await db
    .select()
    .from(page_content)
    .where(eq(page_content.key, "real_estate"))
    .limit(1);

  if (!row) {
    console.error("No `real_estate` page_content row found — run scripts/seed-demo.ts first.");
    process.exit(1);
  }

  const data = row.data as Record<string, unknown>;
  const shape = realEstateSchema.shape as Record<string, { safeParse: (v: unknown) => { success: boolean } }>;

  // A managed section needs restoring when it is absent OR present but no longer matches its
  // current sub-schema (an older row shape). Valid sections stay untouched (edits preserved).
  const next: Record<string, unknown> = { ...data };
  const restored: string[] = [];
  for (const [k, def] of Object.entries(SECTIONS)) {
    const present = k in data;
    const valid = present && shape[k].safeParse(data[k]).success;
    if (!valid) {
      next[k] = def;
      restored.push(present ? `${k} (stale → reset)` : `${k} (added)`);
    }
  }

  const legacyKeys = Object.keys(data).filter((k) => !(k in shape));

  // Parse the whole row through the page schema: guarantees a shape the page can render AND
  // strips any legacy keys no longer in the schema. If a section outside SECTIONS is invalid,
  // there's no default for it — this fails and we abort rather than write a broken row.
  const parsed = realEstateSchema.safeParse(next);
  if (!parsed.success) {
    console.error(
      "Row still invalid after restoring managed sections — a section without a canonical " +
        "default is broken; aborting (escalate):",
      parsed.error.issues,
    );
    process.exit(1);
  }

  if (restored.length === 0 && legacyKeys.length === 0) {
    console.log("Row already matches the current schema — nothing to do.");
    return;
  }

  const summary = [
    restored.length ? `restore ${restored.join(", ")}` : "",
    legacyKeys.length ? `drop legacy keys ${legacyKeys.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("; ");

  if (process.env.DRY) {
    console.log(`DRY run — would ${summary}.`);
    return;
  }

  // Write the parsed (schema-clean) data so legacy keys are removed, not just re-stored.
  await db
    .update(page_content)
    .set({ data: parsed.data, updated_at: new Date() })
    .where(eq(page_content.id, row.id));

  console.log(`Repaired the real_estate row: ${summary}.`);
  console.log("Remember to revalidate the page (re-save in /admin/pages/real_estate, or redeploy).");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  });
