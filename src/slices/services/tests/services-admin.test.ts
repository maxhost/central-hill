import assert from "node:assert/strict";
import { test } from "node:test";
import { serviceCategorySaveInput, serviceSaveInput } from "../admin/validation";

/**
 * Slice `services` backoffice (S12) — the admin **save** schemas. Pure (Zod, no DB).
 * Run: `npx tsx --test src/slices/services/tests/services-admin.test.ts`.
 */

const CAT = "11111111-1111-4111-8111-111111111111";
const COVER = "33333333-3333-4333-8333-333333333333";

function validCategory(overrides: Record<string, unknown> = {}) {
  return { slug: "transfers", icon: "car", position: 0, name: "Transfers", ...overrides };
}

function validService(overrides: Record<string, unknown> = {}) {
  return {
    slug: "airport-transfer",
    status: "draft",
    position: 0,
    category_id: CAT,
    cover_media_id: COVER,
    og_image_media_id: null,
    price_from: 4500,
    booking_type: "external",
    cta_url: "https://book.example.com/transfer",
    name: "Airport Transfer",
    excerpt: "Door-to-door from Lisbon airport.",
    body: "A private, fixed-price transfer.",
    duration_label: null,
    cta_label: "Book now",
    meta_title: null,
    meta_description: null,
    gallery: [],
    ...overrides,
  };
}

test("accepts a complete, valid category", () => {
  assert.equal(serviceCategorySaveInput.safeParse(validCategory()).success, true);
});

test("category requires an icon and a name", () => {
  assert.equal(serviceCategorySaveInput.safeParse(validCategory({ icon: "" })).success, false);
  assert.equal(serviceCategorySaveInput.safeParse(validCategory({ name: "" })).success, false);
});

test("accepts a complete, valid service", () => {
  assert.equal(serviceSaveInput.safeParse(validService()).success, true);
});

test("service requires a cover image", () => {
  const r = serviceSaveInput.safeParse(validService({ cover_media_id: null }));
  assert.equal(r.success, false);
  if (!r.success) assert.ok(r.error.issues.some((i) => i.path.join(".") === "cover_media_id"));
});

test("price_from must be a non-negative integer (cents) or null", () => {
  assert.equal(serviceSaveInput.safeParse(validService({ price_from: -1 })).success, false);
  assert.equal(serviceSaveInput.safeParse(validService({ price_from: 1.5 })).success, false);
  assert.equal(serviceSaveInput.safeParse(validService({ price_from: null })).success, true);
});

test("booking_type must be one of enquiry|external|none", () => {
  assert.equal(serviceSaveInput.safeParse(validService({ booking_type: "phone" })).success, false);
  assert.equal(serviceSaveInput.safeParse(validService({ booking_type: "none" })).success, true);
});

test("nullable CTA / SEO / duration accepted as null", () => {
  assert.equal(
    serviceSaveInput.safeParse(
      validService({ cta_url: null, cta_label: null, meta_title: null, duration_label: null }),
    ).success,
    true,
  );
});

test("rejects blank required [T] text (name/excerpt/body)", () => {
  assert.equal(serviceSaveInput.safeParse(validService({ name: "" })).success, false);
  assert.equal(serviceSaveInput.safeParse(validService({ excerpt: "" })).success, false);
  assert.equal(serviceSaveInput.safeParse(validService({ body: "" })).success, false);
});
