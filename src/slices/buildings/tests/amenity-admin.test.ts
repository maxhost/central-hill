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
