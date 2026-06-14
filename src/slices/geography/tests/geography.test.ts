import assert from "node:assert/strict";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { cityInput, neighbourhoodInput } from "../validation";

/**
 * Slice `geography` unit tests — input validation for the catalog taxonomy and the
 * translatable-field contract the translation pipeline relies on (ADR 0006). Pure,
 * no DB. Run: `npx tsx --test src/slices/geography/tests/geography.test.ts`.
 */

// ── city ───────────────────────────────────────────────────────────────────
test("accepts a valid city", () => {
  const result = cityInput.safeParse({
    slug: "lisbon",
    position: 0,
    status: "published",
    country: "PT",
    name: "Lisbon",
    intro: "Portugal's hilly, sunlit capital on the Tagus.",
  });
  assert.equal(result.success, true);
});

test("city defaults country to PT and intro is optional", () => {
  const result = cityInput.safeParse({ slug: "porto", position: 1, status: "draft", name: "Porto" });
  assert.equal(result.success, true);
  assert.equal(result.success && result.data.country, "PT");
});

test("rejects a non-kebab-case city slug", () => {
  assert.equal(
    cityInput.safeParse({ slug: "Lisbon City", position: 0, status: "published", name: "Lisbon" })
      .success,
    false,
  );
});

test("rejects a country code that is not 2 chars", () => {
  assert.equal(
    cityInput.safeParse({ slug: "lisbon", position: 0, status: "published", country: "PRT", name: "Lisbon" })
      .success,
    false,
  );
});

// ── neighbourhood ────────────────────────────────────────────────────────────
test("accepts a valid neighbourhood", () => {
  const result = neighbourhoodInput.safeParse({
    city_id: "11111111-1111-4111-8111-111111111111",
    slug: "alfama",
    position: 0,
    name: "Alfama",
  });
  assert.equal(result.success, true);
});

test("neighbourhood requires a uuid city_id (never a slug)", () => {
  assert.equal(
    neighbourhoodInput.safeParse({ city_id: "lisbon", slug: "alfama", position: 0, name: "Alfama" })
      .success,
    false,
  );
});

// ── translatable-field contract ──────────────────────────────────────────────
test("city exposes name + intro as the only translatable paths", () => {
  assert.deepEqual(translatablePaths(cityInput).sort(), ["intro", "name"]);
});

test("neighbourhood exposes name as its only translatable path", () => {
  assert.deepEqual(translatablePaths(neighbourhoodInput), ["name"]);
});
