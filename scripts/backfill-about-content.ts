/**
 * One-off, idempotent repair: bring the live `about` `page_content` row up to the current page
 * schema (session 3d of docs/plan-iconos-y-detalles.md).
 *
 * Until now the About page ignored its row (every string was hard-coded) and the row held the
 * old seed's placeholder copy, in a shape the current `aboutSchema` no longer accepts. The page
 * now renders the row, so this writes `defaultAbout` — exactly what the page showed — keeping
 * only the row's `faq_group_key`. A row that already validates is left untouched (manual edits
 * are preserved), so it is safe to run repeatedly.
 *
 * Run:  DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/backfill-about-content.ts
 *       DRY=1 DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/backfill-about-content.ts   # report only
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { page_content } from "@slices/pages/schema";
import { aboutSchema, defaultAbout } from "@slices/pages/schemas/about";

const db = drizzle(neon(process.env.DATABASE_URL ?? ""));

async function main() {
  const [row] = await db.select().from(page_content).where(eq(page_content.key, "about")).limit(1);

  if (row && aboutSchema.safeParse(row.data).success) {
    console.log("The about row already matches the current schema — nothing to do.");
    return;
  }

  const old = (row?.data ?? {}) as { faq_group_key?: unknown };
  const faqGroupKey = typeof old.faq_group_key === "string" ? old.faq_group_key : "";
  const data = aboutSchema.parse({ ...defaultAbout, faq_group_key: faqGroupKey });

  if (process.env.DRY) {
    console.log(`DRY run — would ${row ? "replace" : "insert"} the about row with the default copy.`);
    return;
  }

  if (row) {
    await db
      .update(page_content)
      .set({ data, updated_at: new Date() })
      .where(eq(page_content.id, row.id));
  } else {
    await db.insert(page_content).values({ key: "about", data });
  }
  console.log(`${row ? "Replaced" : "Inserted"} the about row with the default copy.`);
  console.log("Remember to revalidate the page (re-save in /admin/pages/about, or restart dev with a clean fetch cache).");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  });
