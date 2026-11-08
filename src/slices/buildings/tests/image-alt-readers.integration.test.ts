import assert from "node:assert/strict";
import test from "node:test";
import { sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { resolveBuildingDocument } from "../server/queries";
import { emptyBuildingEnvelope } from "../server/editorial-validation";
const photo = "d3000000-0000-4000-8000-000000000001";

test("actual Building reader uses the supplied locale snapshot ALT for cover/gallery/OG, never another document", async () => {
  assert.equal(new URL(process.env.DATABASE_URL!).hostname, "propertylocalesqa.local");
  const who = await db.execute(sql`select current_database() as database,current_user as role`);
  assert.deepEqual(who.rows[0], { database: "propertylocalesqa", role: "propertylocalesqa" });
  for (const locale of ["en", "es", "pt", "fr"] as const) {
    const document = emptyBuildingEnvelope("d1000000-0000-4000-8000-000000000001");
    Object.assign(document.content, { name: "Fallback name", cover_media_id: photo, gallery: [photo], og_image_media_id: photo,
      media_alts: { [photo]: `${locale} explicit description` } });
    const detail = await resolveBuildingDocument("e8620000-0000-4000-8000-000000000005", document, locale, "image-alt-reader");
    assert.equal(detail.cover?.alt, `${locale} explicit description`);
    assert.equal(detail.gallery[0]?.alt, `${locale} explicit description`);
    assert.equal(detail.ogImage?.alt, `${locale} explicit description`);
    assert.equal(document.content.media_alts?.[photo], `${locale} explicit description`);
  }
});
