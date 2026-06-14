import assert from "node:assert/strict";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { serviceCategoryInput, serviceInput, serviceMediaInput } from "../validation";

/**
 * Slice `services` unit tests — input validation (service, category, media) + the
 * translatable-field contract the translation pipeline relies on (ADR 0006). Pure,
 * no DB. Run: `npx tsx --test src/slices/services/tests/services.test.ts`.
 */

const CAT_ID = "11111111-1111-4111-8111-111111111111";
const MEDIA_ID = "22222222-2222-4222-8222-222222222222";

const validService = {
  slug: "airport-private-transfer",
  status: "published",
  position: 0,
  category_id: CAT_ID,
  cover_media_id: MEDIA_ID,
  booking_type: "external",
  cta_label: "Book this transfer",
  cta_url: "https://centralhill.pt/transfers",
  price_from: 4500,
  duration_label: "Door to door",
  name: "Airport Private Transfer",
  excerpt: "Door-to-door transfers between the airport and your apartment.",
  body: "A professional driver tracks your flight and meets you in the arrival hall.",
} as const;

// ── service ──────────────────────────────────────────────────────────────────
test("accepts a valid service", () => {
  assert.equal(serviceInput.safeParse(validService).success, true);
});

test("rejects an unknown booking_type", () => {
  assert.equal(serviceInput.safeParse({ ...validService, booking_type: "instant" }).success, false);
});

test("rejects a non-kebab-case slug", () => {
  assert.equal(serviceInput.safeParse({ ...validService, slug: "Airport Transfer" }).success, false);
});

test("rejects a fractional price (must be integer cents)", () => {
  assert.equal(serviceInput.safeParse({ ...validService, price_from: 45.5 }).success, false);
});

test("rejects a negative price", () => {
  assert.equal(serviceInput.safeParse({ ...validService, price_from: -100 }).success, false);
});

test("price_from is optional (unpriced services)", () => {
  const unpriced = {
    slug: validService.slug,
    status: validService.status,
    position: validService.position,
    category_id: validService.category_id,
    cover_media_id: validService.cover_media_id,
    booking_type: "none",
    name: validService.name,
    excerpt: validService.excerpt,
    body: validService.body,
  }; // `price_from`, CTA, duration intentionally omitted
  assert.equal(serviceInput.safeParse(unpriced).success, true);
});

test("rejects an invalid cta_url", () => {
  assert.equal(serviceInput.safeParse({ ...validService, cta_url: "not a url" }).success, false);
});

// ── service_category ─────────────────────────────────────────────────────────
test("accepts a valid service category", () => {
  const result = serviceCategoryInput.safeParse({
    slug: "arrival",
    icon: "car",
    position: 0,
    name: "Arrival",
  });
  assert.equal(result.success, true);
});

// ── service_media ────────────────────────────────────────────────────────────
test("accepts a valid gallery media row", () => {
  const result = serviceMediaInput.safeParse({
    service_id: CAT_ID,
    media_id: MEDIA_ID,
    position: 2,
  });
  assert.equal(result.success, true);
});

// ── translatable-field contract ──────────────────────────────────────────────
test("service exposes exactly its [T] leaf paths", () => {
  assert.deepEqual(translatablePaths(serviceInput).sort(), [
    "body",
    "cta_label",
    "duration_label",
    "excerpt",
    "meta_description",
    "meta_title",
    "name",
  ]);
});

test("service category exposes only its name", () => {
  assert.deepEqual(translatablePaths(serviceCategoryInput), ["name"]);
});

test("service media has no translatable fields", () => {
  assert.deepEqual(translatablePaths(serviceMediaInput), []);
});
