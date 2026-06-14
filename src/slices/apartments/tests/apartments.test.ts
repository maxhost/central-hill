import assert from "node:assert/strict";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { apartmentInput, apartmentMediaInput } from "../validation";

/**
 * Slice `apartments` unit tests — input validation (apartment + media) + the
 * translatable-field contract the translation pipeline relies on (ADR 0006). Pure,
 * no DB. Run: `npx tsx --test src/slices/apartments/tests/apartments.test.ts`.
 */

const BUILDING_ID = "11111111-1111-4111-8111-111111111111";
const MEDIA_ID = "22222222-2222-4222-8222-222222222222";

const validApartment = {
  slug: "alegria-penthouse",
  status: "published",
  position: 0,
  building_id: BUILDING_ID,
  badge: "Penthouse",
  bedrooms: 3,
  bathrooms: 2,
  max_guests: 6,
  beds_count: 4,
  size_m2: 120,
  floor: 5,
  cover_media_id: MEDIA_ID,
  avantio_id: "AV-1234",
  avantio_url: "https://book.avantio.com/property/1234",
  name: "Alegria Penthouse",
  description: "A spacious top-floor home with a private terrace over the rooftops.",
  meta_title: "Alegria Penthouse — Central Hill",
  meta_description: "Book the Alegria Penthouse, a three-bedroom unit for up to six guests.",
} as const;

// ── apartment ────────────────────────────────────────────────────────────────
test("accepts a valid apartment", () => {
  assert.equal(apartmentInput.safeParse(validApartment).success, true);
});

test("accepts a studio (zero bedrooms)", () => {
  assert.equal(apartmentInput.safeParse({ ...validApartment, bedrooms: 0 }).success, true);
});

test("accepts an apartment without optional badge / size / floor", () => {
  const required = {
    slug: validApartment.slug,
    status: validApartment.status,
    position: validApartment.position,
    building_id: validApartment.building_id,
    bedrooms: validApartment.bedrooms,
    bathrooms: validApartment.bathrooms,
    max_guests: validApartment.max_guests,
    beds_count: validApartment.beds_count,
    cover_media_id: validApartment.cover_media_id,
    avantio_id: validApartment.avantio_id,
    avantio_url: validApartment.avantio_url,
    name: validApartment.name,
    description: validApartment.description,
    meta_title: validApartment.meta_title,
    meta_description: validApartment.meta_description,
  };
  assert.equal(apartmentInput.safeParse(required).success, true);
});

test("rejects a non-kebab-case slug", () => {
  assert.equal(apartmentInput.safeParse({ ...validApartment, slug: "Alegria Penthouse" }).success, false);
});

test("rejects an unknown status", () => {
  assert.equal(apartmentInput.safeParse({ ...validApartment, status: "live" }).success, false);
});

test("rejects zero max_guests (must be positive)", () => {
  assert.equal(apartmentInput.safeParse({ ...validApartment, max_guests: 0 }).success, false);
});

test("rejects negative bedrooms", () => {
  assert.equal(apartmentInput.safeParse({ ...validApartment, bedrooms: -1 }).success, false);
});

test("rejects a non-positive size_m2", () => {
  assert.equal(apartmentInput.safeParse({ ...validApartment, size_m2: 0 }).success, false);
});

test("rejects an empty avantio_id", () => {
  assert.equal(apartmentInput.safeParse({ ...validApartment, avantio_id: "" }).success, false);
});

test("rejects a non-url avantio_url", () => {
  assert.equal(apartmentInput.safeParse({ ...validApartment, avantio_url: "book/1234" }).success, false);
});

test("rejects a non-uuid building_id", () => {
  assert.equal(apartmentInput.safeParse({ ...validApartment, building_id: "alegria" }).success, false);
});

test("rejects a badge over the max length", () => {
  assert.equal(apartmentInput.safeParse({ ...validApartment, badge: "p".repeat(61) }).success, false);
});

// ── apartment_media ──────────────────────────────────────────────────────────
test("accepts valid apartment media", () => {
  assert.equal(
    apartmentMediaInput.safeParse({ apartment_id: BUILDING_ID, media_id: MEDIA_ID, position: 0 }).success,
    true,
  );
});

// ── translatable-field contract ──────────────────────────────────────────────
test("apartment exposes exactly badge + name + description + meta_* as translatable", () => {
  assert.deepEqual(translatablePaths(apartmentInput).sort(), [
    "badge",
    "description",
    "meta_description",
    "meta_title",
    "name",
  ]);
});

test("apartment media has no translatable fields", () => {
  assert.deepEqual(translatablePaths(apartmentMediaInput), []);
});
