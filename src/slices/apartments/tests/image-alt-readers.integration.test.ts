import assert from "node:assert/strict";
import test from "node:test";
import { sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { resolveApartmentDocument } from "../server/queries";
import { emptyApartmentEnvelope } from "../server/editorial-validation";
const photo = "d3000000-0000-4000-8000-000000000001";

test("actual Apartment public/private mapper keeps cover/gallery/OG ALT local to each supplied snapshot", async () => {
  assert.equal(new URL(process.env.DATABASE_URL!).hostname, "propertylocalesqa.local");
  const who = await db.execute(sql`select current_database() as database,current_user as role`);
  assert.deepEqual(who.rows[0], { database: "propertylocalesqa", role: "propertylocalesqa" });
  const available = await db.execute(sql`select id from media_asset where mime like 'image/%' and id <> ${photo}::uuid order by id limit 1`);
  const galleryPhoto = available.rows[0]?.id as string;
  assert.ok(galleryPhoto, "The synthetic reader fixture needs a distinct gallery photo");
  for (const locale of ["en", "es", "pt", "fr"] as const) {
    const document = emptyApartmentEnvelope();
    Object.assign(document.content, { name: "Fallback name", cover_media_id: photo, gallery: [galleryPhoto], og_image_media_id: photo,
      media_alts: { [photo]: `${locale} apartment description`, [galleryPhoto]: `${locale} gallery description` } });
    const detail = await resolveApartmentDocument("e8620000-0000-4000-8000-000000000006", "e8620000-0000-4000-8000-000000000005", document, locale, "image-alt-reader");
    assert.equal(detail.cover?.alt, `${locale} apartment description`);
    assert.equal(detail.gallery[0]?.alt, `${locale} gallery description`);
    assert.equal(detail.ogImage?.alt, `${locale} apartment description`);
  }
});
