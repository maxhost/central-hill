import test from "node:test";
import assert from "node:assert/strict";
import type {
  BuildingEditorialContent,
  BuildingEnvelope,
} from "../editorial-types";
import {
  emptyBuildingEnvelope,
  prepareBuildingTarget,
  buildingMediaIds,
  effectiveBuildingBooking,
  applyBuildingLocaleResult,
  changeBuildingField,
  applyBuildingSharedResult,
  buildingValuesEqual,
  buildingSharedContent,
  buildingLocaleDirty,
  type BuildingWorkspace,
} from "../admin/ui/property-editor-state";
import {
  checkBuildingEnvelope,
  sharedBuildingValuesMatch,
} from "../server/editorial-validation";
const ids = [
  "b1000000-0000-4000-8000-000000000001",
  "b1000000-0000-4000-8000-000000000002",
];
function workspace(): BuildingWorkspace {
  return Object.fromEntries(
    ["en", "es", "pt", "fr"].map((locale) => [
      locale,
      {
        model: {
          locale,
          revision: 1,
          templateRevision: locale === "en" ? null : 1,
          published: emptyBuildingEnvelope(ids[0]),
          draft: null,
          working: {
            ...emptyBuildingEnvelope(ids[0]),
            localeMode: locale === "en" ? "custom" : "inherit",
          },
        },
        errors: {},
        notice: "",
        conflict: false,
      },
    ]),
  ) as BuildingWorkspace;
}
test("Incomplete draft is valid; publication needs copy/address/city, optional cover remains supported", () => {
  const empty = emptyBuildingEnvelope();
  assert.deepEqual(checkBuildingEnvelope(empty).errors, {});
  assert.deepEqual(
    Object.keys(checkBuildingEnvelope(empty, true).errors).sort(),
    ["city_id", "name", "street_address", "teaser"],
  );
  Object.assign(empty.content, {
    name: "Name",
    teaser: "Teaser",
    street_address: "Street",
    city_id: ids[0],
  });
  assert.deepEqual(checkBuildingEnvelope(empty, true).errors, {});
});
test("Strict envelopes reject arbitrary keys, duplicate IDs, executable booking URLs and UTF8 overflow", () => {
  const empty = emptyBuildingEnvelope(ids[0]);
  assert.equal(
    checkBuildingEnvelope({ ...empty, extra: 1 }).envelope,
    undefined,
  );
  for (const key of ["booking_url", "default_booking_url"] as const) {
    const x = structuredClone(empty);
    x.content[key] = "javascript:alert(1)";
    assert.equal(checkBuildingEnvelope(x).envelope, undefined);
  }
  const x = structuredClone(empty);
  x.content.gallery = [ids[0]!, ids[0]!];
  assert.equal(checkBuildingEnvelope(x).envelope, undefined);
  const huge = structuredClone(empty);
  huge.content.faq = Array.from({ length: 30 }, (_, index) => ({
    id: `b7000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    question: "Q",
    answer: "é".repeat(5000),
  }));
  assert.ok(checkBuildingEnvelope(huge).errors._source);
});
test("Customized targets own FAQ structure and retired prose while sharing common values", () => {
  const source = emptyBuildingEnvelope(ids[0]);
  source.content.faq = [
    { id: ids[1]!, question: "Second EN", answer: "EN" },
    { id: ids[0]!, question: "First EN", answer: "EN" },
  ];
  const own = emptyBuildingEnvelope(ids[0]);
  own.content.faq = [{ id: ids[0]!, question: "Uno ES", answer: "ES" }];
  Object.assign(own.content, {
    name: "Edificio",
    headline: "Retired ES",
    description_intro: "Old ES",
    booking_url: "https://example.test/es",
  });
  source.content.default_booking_url = "https://example.test/base";
  const next = prepareBuildingTarget(source, own);
  assert.deepEqual(
    next.content.faq.map((f) => f.question),
    ["Uno ES"],
  );
  assert.equal(next.content.headline, "Retired ES");
  assert.equal(next.content.description_intro, "Old ES");
  assert.equal(
    effectiveBuildingBooking(next.content),
    "https://example.test/es",
  );
  assert.equal(sharedBuildingValuesMatch(next, source), true);
  assert.equal(own.content.faq.length, 1);
});
test("English saves refresh inherited saved drafts, while an unsaved localized edit immediately pins ownership", () => {
  let states = workspace();
  states.es.model.draft = {
    ...structuredClone(states.es.model.working),
    localeMode: "inherit",
  };
  states = changeBuildingField(states, "pt", "name", "Português local");
  assert.equal(states.pt.model.working.localeMode, "custom");
  const source = structuredClone(states.en.model);
  source.revision = 2;
  source.draft = { ...structuredClone(source.working), localeMode: "custom" };
  source.draft.content.name = "Latest English";
  source.working = source.draft;
  const next = applyBuildingLocaleResult(states, "en", source, "Saved");
  assert.equal(next.es.model.working.content.name, "Latest English");
  assert.equal(next.es.model.working.localeMode, "inherit");
  assert.equal(next.es.model.draft?.content.name, "");
  assert.equal(next.pt.model.working.content.name, "Português local");
  assert.equal(buildingLocaleDirty(next.es.model), true);
  assert.equal(next.fr.model.published?.content.name, "");
});
test("No-op and shared-only edits never pin a locale; common changes reach every working tab without replacing own text", () => {
  const states = workspace();
  const same = changeBuildingField(states, "pt", "name", "");
  assert.equal(same, states);
  assert.equal(buildingLocaleDirty({ ...states.pt.model, published: null, draft: null }), false);
  const common = changeBuildingField(states, "pt", "gallery", [ids[1]!]);
  for (const locale of ["en", "es", "pt", "fr"] as const) {
    assert.deepEqual(common[locale].model.working.content.gallery, [ids[1]]);
    assert.equal(common[locale].model.published?.content.gallery.length, 0);
  }
  assert.equal(common.pt.model.working.localeMode, "inherit");
  assert.equal(buildingLocaleDirty(common.pt.model), false);
  const custom = changeBuildingField(
    common,
    "pt",
    "booking_url",
    "https://example.test/pt",
  );
  const saved = applyBuildingSharedResult(custom, { cover_media_id: ids[0]! });
  assert.equal(
    saved.pt.model.working.content.booking_url,
    "https://example.test/pt",
  );
  assert.equal(saved.en.model.working.content.cover_media_id, ids[0]);
  assert.equal(saved.pt.model.working.localeMode, "custom");
});
test("Object ordering does not create false edits; ordered galleries and FAQ remain ordered", () => {
  assert.equal(
    buildingValuesEqual({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 }),
    true,
  );
  assert.equal(buildingValuesEqual({ optional: undefined }, {}), true);
  assert.equal(buildingValuesEqual([ids[0], ids[1]], [ids[1], ids[0]]), false);
  const states = workspace();
  const current = structuredClone(states.en.model.working);
  current.content = Object.fromEntries(
    Object.entries(current.content).reverse(),
  ) as BuildingEditorialContent;
  states.en.model.working = current;
  assert.equal(buildingLocaleDirty(states.en.model), false);
  assert.equal(
    Object.hasOwn(buildingSharedContent(current.content), "meta_title"),
    false,
  );
});
test("Scoped media IDs dedupe only current envelope and booking fallback is entirely snapshot-local", () => {
  const doc: BuildingEnvelope = emptyBuildingEnvelope(ids[0]);
  Object.assign(doc.content, {
    cover_media_id: ids[0],
    og_image_media_id: ids[0],
    gallery: [ids[1]],
    default_booking_url: "https://example.test/base",
    booking_url: "",
  });
  assert.deepEqual(buildingMediaIds(doc), ids);
  assert.equal(
    effectiveBuildingBooking(doc.content),
    "https://example.test/base",
  );
  doc.content.default_booking_url = null;
  assert.equal(effectiveBuildingBooking(doc.content), null);
});
