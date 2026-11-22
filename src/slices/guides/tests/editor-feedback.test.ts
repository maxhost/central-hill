import test from "node:test";
import assert from "node:assert/strict";
import { guideSectionErrors, guideTreeErrors } from "../admin/validation";
import type { GuideSectionEdit } from "../admin/model";
import { newGuide, newSection } from "../admin/ui/editor-model";
import { checkGuideEnvelope } from "../server/locale-validation";
import {
  createGuideWorkspace,
  changeGuideContent,
} from "../admin/ui/locale-form-state";
import {
  guideFeedbackDestination,
  retainGuideErrors,
} from "../admin/ui/feedback-model";
const id = "eef00000-0000-4000-8000-000000000001",
  city = "eef00000-0000-4000-8000-000000000002",
  sectionId = "eef00000-0000-4000-8000-000000000003";
function section(): GuideSectionEdit {
  return {
    ...newSection(sectionId, id, 0),
    title: "Explore",
    body: "Places nearby",
    cta_label: "Dormant",
    cta_url: null,
    presentation: { version: 1 as const, modules: { cta: false } },
  };
}
test("CTA OFF retains dormant partial and malformed values without requiring a pair", () => {
  const s = section();
  assert.deepEqual(guideSectionErrors(s), {});
  s.cta_url = "broken";
  assert.deepEqual(guideSectionErrors(s), {});
  const p = newGuide(id, city);
  p.sections = [s];
  const { id: _, status: __, slug: ___, slugs: ____, ...content } = p;
  void _;
  void __;
  void ___;
  void ____;
  assert.deepEqual(
    checkGuideEnvelope({ schemaVersion: 1, localeMode: "custom", content }, id)
      .errors,
    {},
  );
});
test("automatic CTA empty, partial both ways, explicit ON empty, and hidden sections use effective requirements", () => {
  const s = section();
  s.presentation = { version: 1 };
  s.cta_label = null;
  assert.deepEqual(guideSectionErrors(s), {});
  s.cta_label = "Go";
  assert.ok(guideSectionErrors(s).cta_url);
  s.cta_label = null;
  s.cta_url = "https://example.test";
  assert.ok(guideSectionErrors(s).cta_label);
  s.cta_url = null;
  s.presentation = { version: 1, modules: { cta: true } };
  assert.ok(guideSectionErrors(s).cta_url);
  assert.ok(guideSectionErrors(s).cta_label);
  const p = newGuide(id, city);
  p.title = "Guide";
  p.status = "published";
  p.slugs.en = "guide";
  p.sections = [
    { ...s, presentation: { version: 1, enabled: false } },
    { ...section(), id: "eef00000-0000-4000-8000-000000000004" },
  ];
  const errors = guideTreeErrors(p, [
    { id: city, name: "City", status: "published", slug: "city" } as never,
  ]);
  assert.equal(
    Object.keys(errors).some((key) => key.startsWith(`sections.${sectionId}.`)),
    false,
  );
});
test("correcting one Guide field preserves other fields and server-only reference failures", () => {
  const p = newGuide(id, city);
  p.title = "";
  const w = createGuideWorkspace(null, p);
  w.locales.es.errors = {
    title: "Enter a title.",
    hero_media_id: "Select an uploaded image.",
  };
  w.locales.en.errors = { title: "Enter a title." };
  const changed = changeGuideContent(w, "es", {
    ...w.locales.es.working,
    title: "Fixed",
  });
  assert.equal(changed.locales.es.errors.title, undefined);
  assert.equal(
    changed.locales.es.errors.hero_media_id,
    "Select an uploaded image.",
  );
  assert.deepEqual(changed.locales.en.errors, w.locales.en.errors);
  const retained = retainGuideErrors(w, "es", w.locales.es.working, true);
  assert.ok(retained.title);
  assert.equal(retained.hero_media_id, undefined);
});
test("Guide error labels use section/place position rather than technical identities", () => {
  const p = newGuide(id, city);
  p.sections = [section()];
  const w = createGuideWorkspace(null, p);
  const d = guideFeedbackDestination(
    w.locales.en.working,
    id,
    `sections.${sectionId}.cta_url`,
  );
  assert.equal(d.section, "Section 1");
  assert.equal(d.label, "Button URL");
  assert.equal(d.id, sectionId);
});

test("switching CTA or Places OFF clears only locally revalidated conditional errors", () => {
  for (const key of ["cta", "places"] as const) {
    const p = newGuide(id, city);
    p.title = "Guide";
    p.sections = [
      {
        ...section(),
        presentation: { version: 1, modules: { [key]: true } },
        places: [],
      },
    ];
    const w = createGuideWorkspace(null, p),
      path = `sections.${sectionId}.${key === "cta" ? "cta_url" : "places"}`;
    w.locales.en.errors = {
      [path]: "Complete this module.",
      hero_media_id: "Select an uploaded image.",
    };
    w.locales.es.errors = { [path]: "Other locale stays invalid." };
    const next = changeGuideContent(w, "en", {
      ...w.locales.en.working,
      sections: w.locales.en.working.sections.map((s) => ({
        ...s,
        presentation: { version: 1, modules: { [key]: false } },
      })),
    });
    assert.equal(next.locales.en.errors[path], undefined);
    assert.equal(
      next.locales.en.errors.hero_media_id,
      "Select an uploaded image.",
    );
    assert.deepEqual(next.locales.es.errors, w.locales.es.errors);
  }
});
