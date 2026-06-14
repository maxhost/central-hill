import assert from "node:assert/strict";
import { test } from "node:test";
import { testimonialSaveInput } from "../admin/validation";

/**
 * Slice `testimonials` backoffice (S12) — the admin **save** schema. Pure (Zod, no
 * DB). Run: `npx tsx --test src/slices/testimonials/tests/testimonials-admin.test.ts`.
 */

function valid(overrides: Record<string, unknown> = {}) {
  return {
    audience: "guest",
    rating: 5,
    author_name: "Marta Silva",
    author_country: "Portugal",
    property_location: null,
    position: 0,
    status: "draft",
    quote: "An unforgettable stay in the heart of Lisbon.",
    ...overrides,
  };
}

test("accepts a complete, valid testimonial", () => {
  assert.equal(testimonialSaveInput.safeParse(valid()).success, true);
});

test("property_location accepted as null", () => {
  assert.equal(testimonialSaveInput.safeParse(valid({ property_location: null })).success, true);
});

test("rating must be 1–5", () => {
  assert.equal(testimonialSaveInput.safeParse(valid({ rating: 0 })).success, false);
  assert.equal(testimonialSaveInput.safeParse(valid({ rating: 6 })).success, false);
  assert.equal(testimonialSaveInput.safeParse(valid({ rating: 3 })).success, true);
});

test("audience must be owner|guest", () => {
  assert.equal(testimonialSaveInput.safeParse(valid({ audience: "investor" })).success, false);
  assert.equal(testimonialSaveInput.safeParse(valid({ audience: "owner" })).success, true);
});

test("rejects a blank quote", () => {
  const r = testimonialSaveInput.safeParse(valid({ quote: "" }));
  assert.equal(r.success, false);
  if (!r.success) assert.ok(r.error.issues.some((i) => i.path.join(".") === "quote"));
});

test("rejects a blank author name / country", () => {
  assert.equal(testimonialSaveInput.safeParse(valid({ author_name: "" })).success, false);
  assert.equal(testimonialSaveInput.safeParse(valid({ author_country: "" })).success, false);
});

test("id is optional (absent ⇒ create, present ⇒ update)", () => {
  assert.equal(testimonialSaveInput.safeParse(valid()).success, true);
  assert.equal(
    testimonialSaveInput.safeParse(valid({ id: "11111111-1111-4111-8111-111111111111" })).success,
    true,
  );
});
