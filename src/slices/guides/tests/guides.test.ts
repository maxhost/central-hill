import assert from "node:assert/strict";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { guidePageInput, guidePlaceInput, guideSectionInput } from "../validation";

/**
 * Slice `guides` unit tests — input validation (page / section / place) + the
 * translatable-field contract the translation pipeline relies on (ADR 0006). Pure,
 * no DB. Run: `npx tsx --test src/slices/guides/tests/guides.test.ts`.
 */

const CITY_ID = "11111111-1111-4111-8111-111111111111";
const PAGE_ID = "22222222-2222-4222-8222-222222222222";
const SECTION_ID = "33333333-3333-4333-8333-333333333333";
const MEDIA_ID = "44444444-4444-4444-8444-444444444444";

const validPage = {
  city_id: CITY_ID,
  template: "eat",
  slug: "where-to-eat-in-lisbon",
  status: "published",
  position: 0,
  hero_media_id: MEDIA_ID,
  title: "Where to Eat in Lisbon",
  intro: "Our neighbourhood-tested table for every craving.",
} as const;

const validSection = {
  guide_page_id: PAGE_ID,
  position: 0,
  layout: "featured_places",
  title: "Tascas worth the queue",
  body: "Lisbon's tascas are where the city actually eats.",
} as const;

const validPlace = {
  guide_section_id: SECTION_ID,
  position: 0,
  category: "Seafood",
  address: "R. dos Bacalhoeiros 125, Lisboa",
  price_tier: "mid",
  latitude: 38.7101,
  longitude: -9.1357,
  website_url: "https://example.pt",
  media_id: MEDIA_ID,
  name: "Cervejaria Ramiro",
  description: "Garlic prawns and a prego to finish — a Lisbon rite of passage.",
} as const;

// ── guide_page ───────────────────────────────────────────────────────────────
test("accepts a valid guide page", () => {
  assert.equal(guidePageInput.safeParse(validPage).success, true);
});

test("rejects an unknown template", () => {
  assert.equal(guidePageInput.safeParse({ ...validPage, template: "nightlife" }).success, false);
});

test("rejects a non-kebab-case slug", () => {
  assert.equal(guidePageInput.safeParse({ ...validPage, slug: "Where To Eat" }).success, false);
});

test("guide page hero is optional", () => {
  const noHero = {
    city_id: CITY_ID,
    template: "landing",
    slug: "lisbon-city-guide",
    status: "published",
    position: 0,
    title: "Lisbon City Guide",
  };
  assert.equal(guidePageInput.safeParse(noHero).success, true);
});

// ── guide_section ────────────────────────────────────────────────────────────
test("accepts a valid guide section", () => {
  assert.equal(guideSectionInput.safeParse(validSection).success, true);
});

test("rejects an unknown layout", () => {
  assert.equal(guideSectionInput.safeParse({ ...validSection, layout: "carousel" }).success, false);
});

test("rejects an invalid cta_url", () => {
  assert.equal(guideSectionInput.safeParse({ ...validSection, cta_url: "not a url" }).success, false);
});

// ── guide_place ──────────────────────────────────────────────────────────────
test("accepts a valid guide place", () => {
  assert.equal(guidePlaceInput.safeParse(validPlace).success, true);
});

test("rejects an unknown price_tier", () => {
  assert.equal(guidePlaceInput.safeParse({ ...validPlace, price_tier: "cheap" }).success, false);
});

test("rejects an out-of-range latitude", () => {
  assert.equal(guidePlaceInput.safeParse({ ...validPlace, latitude: 120 }).success, false);
});

test("place coordinates and links are optional (fields vary by template)", () => {
  const minimal = {
    guide_section_id: SECTION_ID,
    position: 1,
    name: "Miradouro da Senhora do Monte",
  };
  assert.equal(guidePlaceInput.safeParse(minimal).success, true);
});

// ── translatable-field contract ──────────────────────────────────────────────
test("guide page exposes exactly its [T] leaf paths", () => {
  assert.deepEqual(translatablePaths(guidePageInput).sort(), [
    "intro",
    "meta_description",
    "meta_title",
    "title",
  ]);
});

test("guide section exposes exactly its [T] leaf paths", () => {
  assert.deepEqual(translatablePaths(guideSectionInput).sort(), [
    "body",
    "cta_label",
    "local_tip",
    "title",
  ]);
});

test("guide place exposes exactly its [T] leaf paths", () => {
  assert.deepEqual(translatablePaths(guidePlaceInput).sort(), ["description", "name"]);
});
