import assert from "node:assert/strict";
import { test } from "node:test";
import { apartmentSaveInput } from "../admin/validation";

/**
 * Slice `apartments` backoffice (S12) — the admin **save** schema. Pure (Zod, no DB).
 * Run: `npx tsx --test src/slices/apartments/tests/apartments-admin.test.ts`.
 */

const BUILDING = "11111111-1111-4111-8111-111111111111";
const COVER = "33333333-3333-4333-8333-333333333333";

function valid(overrides: Record<string, unknown> = {}) {
  return {
    slug: "studio-2a",
    status: "draft",
    position: 0,
    building_id: BUILDING,
    badge: null,
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    beds_count: 1,
    size_m2: null,
    floor: null,
    cover_media_id: COVER,
    og_image_media_id: null,
    avantio_id: "AV-2A",
    avantio_url: "https://book.example.com/2a",
    name: "Studio 2A",
    description: "A bright studio.",
    meta_title: null,
    meta_description: null,
    gallery: [],
    ...overrides,
  };
}

test("accepts a complete, valid apartment", () => {
  assert.equal(apartmentSaveInput.safeParse(valid()).success, true);
});

test("nullable optionals accepted as null", () => {
  assert.equal(
    apartmentSaveInput.safeParse(valid({ badge: null, size_m2: null, floor: null })).success,
    true,
  );
});

test("requires max_guests >= 1", () => {
  assert.equal(apartmentSaveInput.safeParse(valid({ max_guests: 0 })).success, false);
});

test("requires Avantio handles", () => {
  assert.equal(apartmentSaveInput.safeParse(valid({ avantio_id: "" })).success, false);
  assert.equal(apartmentSaveInput.safeParse(valid({ avantio_url: "not-a-url" })).success, false);
});

test("requires a cover image", () => {
  const r = apartmentSaveInput.safeParse(valid({ cover_media_id: null }));
  assert.equal(r.success, false);
  if (!r.success) assert.ok(r.error.issues.some((i) => i.path.join(".") === "cover_media_id"));
});

test("rejects a blank name", () => {
  assert.equal(apartmentSaveInput.safeParse(valid({ name: "" })).success, false);
});

test("floor may be negative (basement)", () => {
  assert.equal(apartmentSaveInput.safeParse(valid({ floor: -1 })).success, true);
});
