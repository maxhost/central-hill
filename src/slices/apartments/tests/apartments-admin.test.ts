import assert from "node:assert/strict";
import { test } from "node:test";
import { apartmentSaveInput } from "../admin/validation";

/**
 * Slice `apartments` backoffice (S12) — the admin **save** schema. Pure (Zod, no DB).
 * Simplified to the building-card fields: no slug (auto-generated in the action),
 * no bathrooms/size/floor/gallery/description/SEO; cover and Avantio handles are
 * optional. Run: `npx tsx --test src/slices/apartments/tests/apartments-admin.test.ts`.
 */

const BUILDING = "11111111-1111-4111-8111-111111111111";
const COVER = "33333333-3333-4333-8333-333333333333";

function valid(overrides: Record<string, unknown> = {}) {
  return {
    status: "draft",
    position: 0,
    building_id: BUILDING,
    badge: null,
    bedrooms: 1,
    max_guests: 2,
    beds_count: 1,
    cover_media_id: COVER,
    avantio_id: "AV-2A",
    avantio_url: "https://book.example.com/2a",
    name: "Studio 2A",
    ...overrides,
  };
}

test("accepts a complete, valid apartment", () => {
  assert.equal(apartmentSaveInput.safeParse(valid()).success, true);
});

test("card-only optionals accepted as null", () => {
  assert.equal(
    apartmentSaveInput.safeParse(
      valid({ badge: null, cover_media_id: null, avantio_id: null, avantio_url: null }),
    ).success,
    true,
  );
});

test("requires max_guests >= 1", () => {
  assert.equal(apartmentSaveInput.safeParse(valid({ max_guests: 0 })).success, false);
});

test("rejects a malformed Avantio URL when provided", () => {
  assert.equal(apartmentSaveInput.safeParse(valid({ avantio_url: "not-a-url" })).success, false);
});

test("cover is optional (placeholder is shown when absent)", () => {
  assert.equal(apartmentSaveInput.safeParse(valid({ cover_media_id: null })).success, true);
});

test("rejects a blank name", () => {
  assert.equal(apartmentSaveInput.safeParse(valid({ name: "" })).success, false);
});

test("no longer accepts a stray slug field is harmless (stripped)", () => {
  // The editor no longer sends a slug; an extra key is ignored by the object schema.
  assert.equal(apartmentSaveInput.safeParse(valid({ slug: "whatever" })).success, true);
});
