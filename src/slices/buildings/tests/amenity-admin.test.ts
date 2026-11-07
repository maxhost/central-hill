import assert from "node:assert/strict";
import { test } from "node:test";
import { amenitySaveInput } from "../admin/validation";
import { amenityPayload } from "../admin/ui/amenity-payload";

/**
 * Slice `buildings` — the amenity taxonomy editor (`/admin/amenities`): the form → post
 * mapping and the admin save schema. Pure (no DB). Run:
 * `npx tsx --test src/slices/buildings/tests/amenity-admin.test.ts`.
 */

const ID = "11111111-1111-4111-8111-111111111111";

const form = (overrides: Partial<Parameters<typeof amenityPayload>[0]> = {}) => ({
  slug: "rooftop-terrace",
  icon: "sun-light",
  group: "Outdoor",
  label: "Rooftop terrace",
  translations: { es: "", pt: "", fr: "" },
  ...overrides,
});

test("payload trims values and keeps the id", () => {
  const p = amenityPayload(
    form({ slug: " rooftop-terrace ", label: " Rooftop terrace ", group: " Outdoor " }),
    ID,
  );
  assert.deepEqual(p, {
    id: ID,
    slug: "rooftop-terrace",
    icon: "sun-light",
    group: "Outdoor",
    label: "Rooftop terrace",
    translations: { es: "", pt: "", fr: "" },
  });
});

test("payload sends null for a blank icon and a blank group", () => {
  const p = amenityPayload(form({ icon: "", group: "   " }), undefined);
  assert.equal(p.icon, null);
  assert.equal(p.group, null);
  assert.equal(p.id, undefined);
});

test("a valid amenity passes, with or without an icon", () => {
  assert.equal(amenitySaveInput.safeParse(amenityPayload(form(), ID)).success, true);
  assert.equal(
    amenitySaveInput.safeParse(amenityPayload(form({ icon: "", group: "" }), undefined)).success,
    true,
  );
});

test("rejects an unknown icon name (strict iconKey)", () => {
  const r = amenitySaveInput.safeParse(amenityPayload(form({ icon: "not-a-real-icon-xyz" }), ID));
  assert.equal(r.success, false);
  if (!r.success) assert.ok(r.error.issues.some((i) => i.path.join(".") === "icon"));
});

test("rejects a blank label and a non-kebab slug", () => {
  const blank = amenitySaveInput.safeParse(amenityPayload(form({ label: "  " }), ID));
  assert.equal(blank.success, false);
  if (!blank.success) assert.ok(blank.error.issues.some((i) => i.path.join(".") === "label"));
  assert.equal(
    amenitySaveInput.safeParse(amenityPayload(form({ slug: "Rooftop Terrace" }), ID)).success,
    false,
  );
});

test("payload preserves all four manual labels while trimming their whitespace", () => {
  const p = amenityPayload(form({
    label: " Rooftop terrace ",
    translations: { es: " Terraza ", pt: " Terraço ", fr: " Terrasse " },
  }), ID);
  assert.equal(p.label, "Rooftop terrace");
  assert.deepEqual(p.translations, { es: "Terraza", pt: "Terraço", fr: "Terrasse" });
  assert.equal(amenitySaveInput.safeParse(p).success, true);
});

test("blank target labels stay explicit empty strings, including a cleared translation", () => {
  const p = amenityPayload(form({
    translations: { es: "   ", pt: "Terraço", fr: "" },
  }), ID);
  assert.deepEqual(p.translations, { es: "", pt: "Terraço", fr: "" });
  assert.equal(amenitySaveInput.safeParse(p).success, true);
});

test("schema trims direct-client target values and rejects labels longer than 80 characters", () => {
  const p = amenityPayload(form(), ID);
  const parsed = amenitySaveInput.parse({ ...p, translations: { es: " Terraza ", pt: "  ", fr: " Terrasse " } });
  assert.deepEqual(parsed.translations, { es: "Terraza", pt: "", fr: "Terrasse" });
  assert.equal(amenitySaveInput.safeParse({ ...p, label: "x".repeat(81) }).success, false);
  for (const locale of ["es", "pt", "fr"] as const) {
    const result = amenitySaveInput.safeParse({
      ...p,
      translations: { ...p.translations, [locale]: "x".repeat(81) },
    });
    assert.equal(result.success, false);
    if (!result.success)
      assert.ok(result.error.issues.some((issue) => issue.path.join(".") === `translations.${locale}`));
  }
});

test("older clients may omit translations, while supplied targets require the complete supported record", () => {
  const legacy = { id: ID, slug: "rooftop-terrace", icon: null, group: null, label: "Terrace" };
  const parsed = amenitySaveInput.parse(legacy);
  assert.equal(Object.hasOwn(parsed, "translations"), false);
  assert.equal(amenitySaveInput.safeParse({ ...legacy, translations: { es: "Terraza" } }).success, false);
  assert.equal(amenitySaveInput.safeParse({
    ...legacy,
    translations: { es: "Terraza", pt: "Terraço", fr: "Terrasse", de: "Terrasse" },
  }).success, false);
});
