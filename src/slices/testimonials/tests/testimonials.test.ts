import assert from "node:assert/strict";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { testimonialInput } from "../validation";

/**
 * Slice `testimonials` unit tests — input validation + the translatable-field
 * contract the translation pipeline relies on (ADR 0006). Pure, no DB.
 * Run: `npx tsx --test src/slices/testimonials/tests/testimonials.test.ts`.
 */

const valid = {
  audience: "owner",
  rating: 5,
  author_name: "Maria Silva",
  author_country: "Portugal",
  property_location: "Príncipe Real, Lisbon",
  position: 0,
  status: "published",
  quote: "Central Hill turned my apartment into a worry-free, high-yield asset.",
} as const;

test("accepts a valid testimonial", () => {
  assert.equal(testimonialInput.safeParse(valid).success, true);
});

test("property_location is optional", () => {
  const withoutLocation = {
    audience: valid.audience,
    rating: valid.rating,
    author_name: valid.author_name,
    author_country: valid.author_country,
    position: valid.position,
    status: valid.status,
    quote: valid.quote,
  }; // `property_location` intentionally omitted
  assert.equal(testimonialInput.safeParse(withoutLocation).success, true);
});

test("rejects an unknown audience", () => {
  assert.equal(testimonialInput.safeParse({ ...valid, audience: "investor" }).success, false);
});

test("rejects a rating outside 1–5", () => {
  assert.equal(testimonialInput.safeParse({ ...valid, rating: 0 }).success, false);
  assert.equal(testimonialInput.safeParse({ ...valid, rating: 6 }).success, false);
});

test("rejects a non-integer rating", () => {
  assert.equal(testimonialInput.safeParse({ ...valid, rating: 4.5 }).success, false);
});

test("requires a non-empty author name", () => {
  assert.equal(testimonialInput.safeParse({ ...valid, author_name: "" }).success, false);
});

test("testimonial exposes only its quote as translatable", () => {
  assert.deepEqual(translatablePaths(testimonialInput), ["quote"]);
});
