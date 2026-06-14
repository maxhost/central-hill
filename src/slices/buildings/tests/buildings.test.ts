import assert from "node:assert/strict";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import {
  amenityInput,
  buildingFaqInput,
  buildingInput,
} from "../validation";

/**
 * Slice `buildings` unit tests — input validation for the catalog's core entity and
 * its building-level amenities & FAQ, plus the translatable-field contract the
 * translation pipeline relies on (ADR 0006). Pure, no DB.
 * Run: `npx tsx --test src/slices/buildings/tests/buildings.test.ts`.
 */

const CITY_ID = "11111111-1111-4111-8111-111111111111";
const NB_ID = "22222222-2222-4222-9222-222222222222";

// ── building ─────────────────────────────────────────────────────────────────
test("accepts a valid building", () => {
  const result = buildingInput.safeParse({
    slug: "large-bairro-alto-view",
    status: "published",
    position: 0,
    city_id: CITY_ID,
    neighbourhood_id: NB_ID,
    street_address: "Rua da Alegria 61, Lisbon",
    cover_media_id: "33333333-3333-4333-8333-333333333333",
    name: "Large Bairro Alto View",
    headline: "A view over the heart of Lisbon",
    teaser: "Spacious, high-quality apartments in an exclusive location.",
    description_intro: "Welcome to Large Bairro Alto View by Central Hill.",
  });
  assert.equal(result.success, true);
});

test("building defaults is_new / is_featured to false and neighbourhood is optional", () => {
  const result = buildingInput.safeParse({
    slug: "downtown-alfama-river-view",
    status: "draft",
    position: 1,
    city_id: CITY_ID,
    street_address: "Rua do Barão 16, Lisbon",
    cover_media_id: "44444444-4444-4444-8444-444444444444",
    name: "Downtown Alfama River View",
    headline: "Stunning views over the Tagus",
    teaser: "In the heart of historic Alfama, next to the Cathedral.",
    description_intro: "Stunning views over the Tagus River.",
  });
  assert.equal(result.success, true);
  assert.equal(result.success && result.data.is_new, false);
  assert.equal(result.success && result.data.is_featured, false);
});

test("rejects a non-kebab-case building slug", () => {
  const result = buildingInput.safeParse({
    slug: "Bairro Alto",
    status: "published",
    position: 0,
    city_id: CITY_ID,
    street_address: "x",
    cover_media_id: CITY_ID,
    name: "x",
    headline: "x",
    teaser: "x",
    description_intro: "x",
  });
  assert.equal(result.success, false);
});

test("building requires a uuid city_id (never a slug)", () => {
  const result = buildingInput.safeParse({
    slug: "x",
    status: "published",
    position: 0,
    city_id: "lisbon",
    street_address: "x",
    cover_media_id: CITY_ID,
    name: "x",
    headline: "x",
    teaser: "x",
    description_intro: "x",
  });
  assert.equal(result.success, false);
});

// ── amenity + faq ────────────────────────────────────────────────────────────
test("accepts a valid amenity", () => {
  const result = amenityInput.safeParse({ slug: "wifi", icon: "wifi", label: "Wi-Fi" });
  assert.equal(result.success, true);
});

test("accepts a valid building FAQ entry", () => {
  const result = buildingFaqInput.safeParse({
    building_id: CITY_ID,
    position: 0,
    question: "Is there parking nearby?",
    answer: "Yes — a public garage is a two-minute walk away.",
  });
  assert.equal(result.success, true);
});

// ── translatable-field contract ──────────────────────────────────────────────
test("building exposes exactly its [T] fields", () => {
  assert.deepEqual(translatablePaths(buildingInput).sort(), [
    "description_intro",
    "description_neighbourhood",
    "headline",
    "meta_description",
    "meta_title",
    "name",
    "teaser",
  ]);
});

test("amenity exposes label, FAQ exposes question + answer", () => {
  assert.deepEqual(translatablePaths(amenityInput), ["label"]);
  assert.deepEqual(translatablePaths(buildingFaqInput).sort(), ["answer", "question"]);
});
