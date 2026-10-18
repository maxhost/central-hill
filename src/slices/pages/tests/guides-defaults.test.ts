import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGuides, guidesSchema } from "../schemas/guides";
import { guidesEditorDefaults } from "../admin/guides-defaults";
import { guidesLocalizedContent, guidesSourceContent } from "../server/guides-content";

test("absent and legacy Guides scaffold enabled without changing historical aside", () => {
  for (const [raw, exists] of [[undefined, false], [defaultGuides, true]] as const) {
    const prepared = guidesEditorDefaults(raw, exists);
    assert.equal(prepared.sourceInvalid, false);
    assert.ok(guidesSchema.safeParse(prepared.data).success);
    assert.deepEqual(prepared.data.guide_aside, defaultGuides.guide_aside);
    assert.equal(prepared.data.city_filter?.enabled, true);
  }
  const disabled = guidesEditorDefaults({ ...defaultGuides, city_filter: { enabled: false } }, true);
  assert.equal(disabled.data.city_filter?.enabled, false);
});

test("corrupt source blocks saving, public fallback preserves independently valid aside", () => {
  const raw = { ...defaultGuides, hero: { poster_media_id: "not-a-uuid" } };
  assert.equal(guidesEditorDefaults(raw, true).sourceInvalid, true);
  assert.deepEqual(guidesSourceContent(raw), defaultGuides);
});

test("bad translated title template falls back per field and retains valid translations", () => {
  const source = { ...defaultGuides, catalogue: { headline: "Guides in {city}", eyebrow: "Explore" } };
  const localized = { ...source, catalogue: { headline: "Invalid {wrong}", eyebrow: "Explora" } };
  const result = guidesLocalizedContent(source, localized);
  assert.equal(result.catalogue?.headline, "Guides in {city}");
  assert.equal(result.catalogue?.eyebrow, "Explora");
  assert.deepEqual(result.guide_aside, defaultGuides.guide_aside);
});
