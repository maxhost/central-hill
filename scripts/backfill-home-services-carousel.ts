/**
 * One-off, idempotent repair: give the live `home` `page_content` row its
 * `services_carousel` section (ADR 0032).
 *
 * The section was added to the home schema after the row was seeded, so an existing row has
 * no `services_carousel` key at all — the renderer then skips the band, and the Home editor
 * shows empty fields until someone types something. This writes the canonical default copy
 * when the section is **missing or no longer valid**, and leaves an already-valid section
 * untouched, so editorial changes are never overwritten. The whole row is then parsed
 * through `homeSchema` before saving, which also strips keys the schema no longer has.
 *
 * If a section OUTSIDE this one is invalid there is nothing to fall back to, so the final
 * parse fails and the script aborts without writing — that's an escalation, not something
 * to force. Mirrors `scripts/backfill-real-estate-sections.ts`.
 *
 * ISR: the row is written directly, so the public page refreshes on its next revalidation
 * (or immediately after any save in /admin/pages/home).
 *
 *   pnpm tsx --tsconfig scripts/tsconfig.json scripts/backfill-home-services-carousel.ts
 *   DRY=1 pnpm tsx --tsconfig scripts/tsconfig.json scripts/backfill-home-services-carousel.ts
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { page_content } from "@slices/pages/schema";
import { defaultServicesCarousel, homeSchema } from "@slices/pages/schemas/home";

const SECTION = "services_carousel";

async function main() {
  const [row] = await db
    .select()
    .from(page_content)
    .where(eq(page_content.key, "home"))
    .limit(1);

  if (!row) {
    console.error("✗ no `home` row — run scripts/seed-demo.ts first.");
    process.exit(1);
  }

  const data = { ...(row.data as Record<string, unknown>) };
  const current = data[SECTION];
  const valid = homeSchema.shape.services_carousel.safeParse(current).success;

  if (valid) {
    console.log(`✓ ${SECTION} already present and valid — nothing to do.`);
    return;
  }

  data[SECTION] = defaultServicesCarousel;
  console.log(`• ${SECTION} ${current === undefined ? "missing" : "invalid"} → writing the default copy`);

  const parsed = homeSchema.safeParse(data);
  if (!parsed.success) {
    console.error("✗ the home row does not validate even after the repair — aborting without writing.");
    for (const issue of parsed.error.issues) {
      console.error(`   ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  if (process.env.DRY) {
    console.log("DRY: valid after repair, no write made.");
    return;
  }

  await db
    .update(page_content)
    .set({ data: parsed.data, updated_at: new Date() })
    .where(eq(page_content.key, "home"));
  console.log("✓ home row updated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
