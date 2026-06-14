import assert from "node:assert/strict";
import { test } from "node:test";
import { citySaveInput } from "../admin/validation";

/**
 * Slice `geography` backoffice (S12) — the admin **save** schema (city + inline
 * neighbourhoods). Pure (Zod, no DB). Run:
 * `npx tsx --test src/slices/geography/tests/geography-admin.test.ts`.
 */

const NB_ID = "11111111-1111-4111-8111-111111111111";

function validNb(overrides: Record<string, unknown> = {}) {
  return { slug: "principe-real", name: "Príncipe Real", ...overrides };
}

function valid(overrides: Record<string, unknown> = {}) {
  return {
    slug: "lisbon",
    position: 0,
    status: "published",
    country: "PT",
    hero_media_id: null,
    name: "Lisbon",
    intro: null,
    neighbourhoods: [validNb()],
    ...overrides,
  };
}

test("accepts a complete, valid city with neighbourhoods", () => {
  assert.equal(citySaveInput.safeParse(valid()).success, true);
});

test("accepts null hero + null intro + empty neighbourhoods", () => {
  assert.equal(
    citySaveInput.safeParse(valid({ hero_media_id: null, intro: null, neighbourhoods: [] })).success,
    true,
  );
});

test("country must be exactly 2 chars", () => {
  assert.equal(citySaveInput.safeParse(valid({ country: "PRT" })).success, false);
  assert.equal(citySaveInput.safeParse(valid({ country: "PT" })).success, true);
});

test("city + neighbourhood slugs must be kebab-case", () => {
  assert.equal(citySaveInput.safeParse(valid({ slug: "Lisbon City" })).success, false);
  assert.equal(
    citySaveInput.safeParse(valid({ neighbourhoods: [validNb({ slug: "Príncipe Real" })] })).success,
    false,
  );
});

test("rejects a blank city or neighbourhood name", () => {
  assert.equal(citySaveInput.safeParse(valid({ name: "" })).success, false);
  assert.equal(citySaveInput.safeParse(valid({ neighbourhoods: [validNb({ name: "" })] })).success, false);
});

test("neighbourhood id is optional (absent ⇒ insert, present ⇒ update)", () => {
  assert.equal(
    citySaveInput.safeParse(valid({ neighbourhoods: [validNb({ id: NB_ID })] })).success,
    true,
  );
});

test("validation surfaces the offending neighbourhood path", () => {
  const r = citySaveInput.safeParse(valid({ neighbourhoods: [validNb(), validNb({ name: "" })] }));
  assert.equal(r.success, false);
  if (!r.success) assert.ok(r.error.issues.some((i) => i.path.join(".") === "neighbourhoods.1.name"));
});
