import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyGuideEnvelope,
  guideSharedContent,
  guideLocalizedEqual,
  guideValuesEqual,
  overlayGuideShared,
} from "../locale-content";
import { checkGuideEnvelope } from "../server/locale-validation";
import { guideSharedPayloadErrors } from "../server/locale-store";
import { guideLocaleModel } from "../server/locale-model";
import type { GuideLocaleRow } from "../server/locale-bootstrap";
const city = "e7900000-0000-4000-8000-000000000001",
  guide = "e7900000-0000-4000-8000-000000000002",
  section = "e7900000-0000-4000-8000-000000000003";
function envelope() {
  const e = emptyGuideEnvelope(city);
  e.content.title = "English";
  e.content.sections = [
    {
      id: section,
      guide_page_id: guide,
      position: 0,
      layout: "standard",
      presentation: null,
      header_media_id: null,
      title: "Section",
      body: "Body",
      local_tip: null,
      cta_label: null,
      cta_url: null,
      places: [],
    },
  ];
  return e;
}
function row(
  locale: GuideLocaleRow["locale"],
  draft: GuideLocaleRow["draft"],
  revision = 0,
): GuideLocaleRow {
  return {
    id: guide,
    guide_id: guide,
    locale,
    draft,
    published: null,
    revision,
    published_at: null,
    draft_saved_at: null,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };
}
test("draft supports incomplete text and sections before first save; rejects foreign parent and duplicate IDs", () => {
  const e = envelope();
  e.content.title = "";
  e.content.sections[0]!.title = "";
  assert.deepEqual(checkGuideEnvelope(e, guide).errors, {});
  e.content.sections[0]!.guide_page_id = city;
  assert.ok(checkGuideEnvelope(e, guide).errors.sections);
  e.content.sections.push({ ...e.content.sections[0]! });
  assert.ok(checkGuideEnvelope(e, guide).errors.sections);
});
test("English inherited working ignores an old inherited draft; independent custom text survives", () => {
  const en = envelope(),
    old = envelope();
  old.localeMode = "inherit";
  old.content.title = "Old";
  const shared = guideSharedContent(en.content);
  const inherited = guideLocaleModel(
    [row("en", en, 5), row("es", old, 2)],
    "es",
    en,
    shared,
  );
  assert.equal(inherited.working.content.title, "English");
  assert.equal(inherited.templateRevision, 5);
  old.localeMode = "custom";
  assert.equal(
    guideLocaleModel([row("en", en, 5), row("es", old, 2)], "es", en, shared)
      .working.content.title,
    "Old",
  );
});
test("shared overlays preserve localized tree and retain inactive UUID history", () => {
  const en = envelope(),
    shared = guideSharedContent(en.content);
  en.content.sections = [];
  const retained = guideSharedContent(en.content, shared);
  assert.ok(retained.sections[section]);
  assert.equal(overlayGuideShared(en, retained).content.sections.length, 0);
  assert.ok(
    guideSharedPayloadErrors(en, { ...retained, sections: {} }, shared)._shared,
  );
});
test("localized equality ignores neutral media and JSONB object order but preserves tree order", () => {
  const en = envelope(),
    other = structuredClone(en);
  other.content.hero_media_id = city;
  assert.equal(guideLocalizedEqual(en.content, other.content), true);
  assert.equal(guideValuesEqual({ a: 1, b: 2 }, { b: 2, a: 1 }), true);
  other.content.sections[0]!.title = "Spanish";
  assert.equal(guideLocalizedEqual(en.content, other.content), false);
});
