import assert from "node:assert/strict";
import { test } from "node:test";
import { buildingSaveInput } from "../admin/validation";

/**
 * Slice `buildings` backoffice (S12) — the admin **save** schema. Pure (Zod, no DB),
 * so it runs under `tsx --test`. The queries/actions/UI are integration-covered by
 * typecheck + build. Run:
 * `npx tsx --test src/slices/buildings/tests/buildings-admin.test.ts`.
 */

const CITY = "11111111-1111-4111-8111-111111111111";
const COVER = "33333333-3333-4333-8333-333333333333";

function valid(overrides: Record<string, unknown> = {}) {
  return {
    slug: "lapa-riverside",
    status: "draft",
    position: 0,
    is_new: false,
    is_featured: true,
    city_id: CITY,
    neighbourhood_id: null,
    street_address: "Rua da Lapa 1",
    latitude: null,
    longitude: null,
    cover_media_id: COVER,
    og_image_media_id: null,
    avantio_id: null,
    avantio_url: null,
    name: "Lapa Riverside",
    headline: "Riverside living",
    teaser: "A calm address by the water.",
    description_intro: "The building sits above the river.",
    description_neighbourhood: null,
    meta_title: null,
    meta_description: null,
    gallery: [],
    amenity_ids: [],
    faq: [],
    ...overrides,
  };
}

test("accepts a complete, valid building", () => {
  assert.equal(buildingSaveInput.safeParse(valid()).success, true);
});

test("nullable optionals are accepted as null", () => {
  const r = buildingSaveInput.safeParse(
    valid({ neighbourhood_id: null, latitude: null, og_image_media_id: null }),
  );
  assert.equal(r.success, true);
});

test("rejects a blank required [T] field (name)", () => {
  const r = buildingSaveInput.safeParse(valid({ name: "" }));
  assert.equal(r.success, false);
  if (!r.success) assert.ok(r.error.issues.some((i) => i.path.join(".") === "name"));
});

test("rejects a non-kebab slug", () => {
  assert.equal(buildingSaveInput.safeParse(valid({ slug: "Lapa Riverside" })).success, false);
});

test("requires a cover image (uuid, not null)", () => {
  const r = buildingSaveInput.safeParse(valid({ cover_media_id: null }));
  assert.equal(r.success, false);
  if (!r.success) assert.ok(r.error.issues.some((i) => i.path.join(".") === "cover_media_id"));
});

test("rejects a FAQ row with an empty question", () => {
  const r = buildingSaveInput.safeParse(valid({ faq: [{ question: "", answer: "Yes." }] }));
  assert.equal(r.success, false);
  if (!r.success) assert.ok(r.error.issues.some((i) => i.path.join(".") === "faq.0.question"));
});

test("accepts a FAQ row carrying an existing id (update path)", () => {
  const r = buildingSaveInput.safeParse(
    valid({ faq: [{ id: COVER, question: "Pets?", answer: "Yes, on request." }] }),
  );
  assert.equal(r.success, true);
});
