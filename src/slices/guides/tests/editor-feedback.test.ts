import test from "node:test";
import assert from "node:assert/strict";
import { feedbackMessage } from "@slices/backoffice/contract-client";
import { guideSectionErrors, guideTreeErrors } from "../admin/validation";
import type { GuideSectionEdit } from "../admin/model";
import { newGuide, newSection, newPlace } from "../admin/ui/editor-model";
import { checkGuideEnvelope } from "../server/locale-validation";
import {
  createGuideWorkspace,
  changeGuideContent,
} from "../admin/ui/locale-form-state";
import {
  guideFeedbackDestination,
  guideFeedbackGroups,
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

test("Photo module validation and feedback use the real image group contract", () => {
  const p = newGuide(id, city);
  p.title = "Guide";
  p.status = "published";
  p.slugs.en = "guide";
  const s = section();
  s.header_media_id = null;
  s.presentation = { version: 1, modules: { image: true } };
  s.places = [
    {
      ...newPlace("eef00000-0000-4000-8000-000000000004", sectionId, 0),
      name: "Place",
      media_id: "eef00000-0000-4000-8000-000000000005",
    },
  ];
  p.sections = [s];
  const errors = guideTreeErrors(p, [
    { id: city, name: "City", status: "published", slug: "city" } as never,
  ]);
  assert.ok(
    errors[`sections.${sectionId}.image`],
    "a place image does not satisfy the section Photo module",
  );
  assert.equal(
    errors[`sections.${sectionId}.header_media_id`],
    undefined,
    "the server reports its actual group path",
  );
  const w = createGuideWorkspace(null, p),
    target = guideFeedbackDestination(
      w.locales.en.working,
      id,
      `sections.${sectionId}.image`,
    );
  assert.deepEqual(target, {
    id: sectionId,
    name: "image",
    label: "Photo",
    section: "Section 1",
  });
});

test("Guide shared dependencies point to English while independent and mixed content errors keep their locale", () => {
  const p = newGuide(id, city);
  const placeId = "eef00000-0000-4000-8000-000000000004";
  p.sections = [
    {
      ...section(),
      places: [{ ...newPlace(placeId, sectionId, 0), name: "Cafe" }],
    },
  ];
  const w = createGuideWorkspace(null, p);
  w.locales.es.errors = {
    city_id: "Publish the city.",
    hero_media_id: "Select an available image.",
    title: "Enter a title.",
    [`sections.${sectionId}.image`]: "Complete Photo.",
    [`sections.${sectionId}.presentation`]:
      "Keep at least one module with content.",
    [`sections.${sectionId}.body`]: "Enter body.",
    [`sections.${sectionId}.cta_url`]: "Enter button URL.",
    [`sections.${sectionId}.places`]: "Add a place.",
    [`sections.${sectionId}.places.${placeId}.phone`]: "Enter a valid phone.",
    [`sections.${sectionId}.places.${placeId}.name`]: "Enter a name.",
  };
  const groups = guideFeedbackGroups(w),
    issues = groups.find((group) => group.locale === "es")!.issues;
  for (const path of [
    "city_id",
    "hero_media_id",
    `sections.${sectionId}.image`,
    `sections.${sectionId}.places.${placeId}.phone`,
  ])
    assert.equal(
      issues.find((issue) => issue.path === path)?.sourceLocale,
      "en",
    );
  for (const path of [
    "title",
    `sections.${sectionId}.presentation`,
    `sections.${sectionId}.body`,
    `sections.${sectionId}.cta_url`,
    `sections.${sectionId}.places`,
    `sections.${sectionId}.places.${placeId}.name`,
  ])
    assert.equal(
      issues.find((issue) => issue.path === path)?.sourceLocale,
      undefined,
    );
  assert.equal(
    groups.find((group) => group.locale === "en")!.issues.length,
    0,
    "a shared source hint does not invent an English validation error",
  );
  const toast = feedbackMessage({
    action: "publish",
    locale: "es",
    outcome: "validation",
    groups,
  });
  assert.match(toast, /Cannot publish ES/);
  assert.match(toast, /Shared field — managed in EN/);
  assert.doesNotMatch(toast, /Other known errors: EN/);

  const targetOnly = "eef00000-0000-4000-8000-000000000006";
  w.locales.es.working.sections = [{ ...section(), id: targetOnly }];
  w.locales.es.errors = {
    [`sections.${targetOnly}.header_media_id`]: "Select an image.",
  };
  assert.equal(
    guideFeedbackGroups(w).find((group) => group.locale === "es")!.issues[0]!
      .sourceLocale,
    undefined,
    "do not navigate to a source control that is absent in English",
  );
});
