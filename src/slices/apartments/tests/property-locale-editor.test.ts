import assert from "node:assert/strict";
import test from "node:test";
import {
  checkApartmentEnvelope,
  emptyApartmentEnvelope,
  apartmentMediaIds,
  prepareApartmentTarget,
  resolveApartmentBooking,
  sharedApartmentValuesMatch,
  apartmentSharedContent,
  semanticEqual,
} from "../server/editorial-validation";
import { apartmentLocaleModel } from "../server/editorial-model";
import {
  applyPropertyLocaleResult,
  changePropertyField,
  propertyLocaleDirty,
  type PropertyWorkspace,
} from "../admin/ui/property-editor-state";
const photo = "e3200000-0000-4000-8000-000000000001";
function envelope(name = "English") {
  const value = emptyApartmentEnvelope();
  value.content.name = name;
  value.content.max_guests = 4;
  return value;
}
function workspace(): PropertyWorkspace {
  const en = { ...envelope(), localeMode: "custom" as const };
  const rows = [
    { locale: "en" as const, revision: 2, published: en, draft: null },
  ];
  return Object.fromEntries(
    (["en", "es", "pt", "fr"] as const).map((locale) => {
      const model = apartmentLocaleModel(rows, locale);
      return [
        locale,
        {
          model,
          baseline: structuredClone(model.working),
          errors: {},
          notice: "",
          conflict: false,
        },
      ];
    }),
  ) as PropertyWorkspace;
}
test("incomplete draft remains valid; publication, URLs, strict metadata and payload size are checked", () => {
  assert.deepEqual(checkApartmentEnvelope(emptyApartmentEnvelope()).errors, {});
  assert.deepEqual(
    Object.keys(checkApartmentEnvelope(emptyApartmentEnvelope(), true).errors),
    ["name", "max_guests"],
  );
  const value = { ...envelope(), localeMode: "inherit" as const };
  value.content.booking_url = "javascript:alert(1)";
  assert.equal(checkApartmentEnvelope(value).envelope, undefined);
  value.content.booking_url = "https://example.test/es";
  assert.deepEqual(checkApartmentEnvelope(value, true).errors, {});
  assert.equal(
    checkApartmentEnvelope({ ...value, localeMode: "invalid" }).envelope,
    undefined,
  );
  assert.equal(
    checkApartmentEnvelope({ ...value, extra: true }).envelope,
    undefined,
  );
  value.content.description = "a".repeat(193 * 1024);
  assert.equal(checkApartmentEnvelope(value).envelope, undefined);
});
test("common values overlay every retained physical/image field while custom text, SEO and override stay local", () => {
  const en = envelope(),
    es = { ...envelope("Español"), localeMode: "custom" as const };
  Object.assign(en.content, {
    cover_media_id: photo,
    bedrooms: 3,
    bathrooms: 2,
    floor: 7,
    gallery: [photo],
    default_booking_url: "https://example.test/base",
  });
  Object.assign(es.content, {
    badge: "Terraza",
    description: "Descripción",
    meta_title: "SEO español",
    booking_url: "https://example.test/es",
  });
  const prepared = prepareApartmentTarget(en, es);
  assert.equal(prepared.content.name, "Español");
  assert.equal(prepared.content.badge, "Terraza");
  assert.equal(prepared.content.description, "Descripción");
  assert.equal(prepared.content.meta_title, "SEO español");
  assert.equal(prepared.content.floor, 7);
  assert.equal(prepared.content.bathrooms, 2);
  assert.deepEqual(prepared.content.gallery, [photo]);
  assert.equal(prepared.content.cover_media_id, photo);
  assert.equal(resolveApartmentBooking(prepared), "https://example.test/es");
  assert.equal(sharedApartmentValuesMatch(prepared, en), true);
  assert.equal(es.content.cover_media_id, null);
});
test("booking prefers own language override, then the unique default, then the parent booking band", () => {
  const value = envelope();
  assert.equal(resolveApartmentBooking(value), null);
  value.content.default_booking_url = "https://example.test/base";
  assert.equal(
    resolveApartmentBooking(value),
    value.content.default_booking_url,
  );
  value.content.booking_url = "https://example.test/fr-own";
  assert.equal(resolveApartmentBooking(value), value.content.booking_url);
  value.content.booking_url = " ";
  assert.equal(
    resolveApartmentBooking(value),
    value.content.default_booking_url,
  );
});
test("inherited saved drafts follow latest EN working text without changing old publications", () => {
  const en = { ...envelope("Latest EN"), localeMode: "custom" as const };
  const old = { ...envelope("Old EN"), localeMode: "inherit" as const };
  const model = apartmentLocaleModel(
    [
      { locale: "en", revision: 8, draft: en, published: null },
      { locale: "es", revision: 3, draft: old, published: old },
    ],
    "es",
  );
  assert.equal(model.working.content.name, "Latest EN");
  assert.equal(model.draft?.content.name, "Old EN");
  assert.equal(model.published?.content.name, "Old EN");
  assert.equal(model.working.localeMode, "inherit");
  assert.equal(model.templateRevision, 8);
  assert.equal(
    apartmentLocaleModel(
      [{ locale: "en", revision: 8, draft: en, published: en }],
      "fr",
    ).published,
    null,
  );
});
test("old edited snapshots stay custom; common authoritative overlay replaces historical image/capacity copies", () => {
  const old = envelope("Own old snapshot"),
    en = envelope("New English");
  const model = apartmentLocaleModel(
    [
      { locale: "en", revision: 5, draft: en, published: en },
      { locale: "pt", revision: 2, draft: old, published: old },
    ],
    "pt",
    { revision: 7, content: { max_guests: 8, cover_media_id: photo } },
  );
  assert.equal(model.working.localeMode, "custom");
  assert.equal(model.working.content.name, "Own old snapshot");
  assert.equal(model.templateRevision, null);
  assert.equal(model.working.content.max_guests, 8);
  assert.equal(model.working.content.cover_media_id, photo);
  assert.equal(model.published?.content.max_guests, 4);
});
test("first real localized edit pins immediately, no-op and common edits leave language inheritance intact", () => {
  const states = workspace();
  assert.equal(propertyLocaleDirty(states.pt.model, states.pt.baseline), false);
  assert.equal(changePropertyField(states, "pt", "name", "English"), states);
  const common = changePropertyField(states, "pt", "max_guests", 9);
  assert.equal(common.pt.model.working.localeMode, "inherit");
  assert.equal(common.en.model.working.content.max_guests, 9);
  assert.equal(common.fr.model.working.content.max_guests, 9);
  assert.equal(propertyLocaleDirty(common.pt.model, common.pt.baseline), false);
  const custom = changePropertyField(
    common,
    "pt",
    "meta_title",
    "SEO português",
  );
  assert.equal(custom.pt.model.working.localeMode, "custom");
  assert.equal(propertyLocaleDirty(custom.pt.model, custom.pt.baseline), true);
});
test("EN save updates inherited forms and preserves unsaved customized targets and their saved snapshots", () => {
  let states = workspace();
  states = changePropertyField(states, "pt", "name", "Português local");
  states = changePropertyField(
    states,
    "pt",
    "booking_url",
    "https://example.test/pt",
  );
  const pt = states.pt,
    en = { ...envelope("Updated English"), localeMode: "custom" as const };
  const next = applyPropertyLocaleResult(
    states,
    "en",
    { ...states.en.model, revision: 3, draft: en, working: en },
    "saved",
    { max_guests: 6, cover_media_id: photo },
  );
  assert.equal(next.es.model.working.content.name, "Updated English");
  assert.equal(next.es.model.working.localeMode, "inherit");
  assert.equal(propertyLocaleDirty(next.es.model, next.es.baseline), false);
  assert.equal(next.pt.model.working.content.name, "Português local");
  assert.equal(
    next.pt.model.working.content.booking_url,
    "https://example.test/pt",
  );
  assert.equal(next.pt.model.working.content.max_guests, 6);
  assert.equal(next.pt.model.published, pt.model.published);
  assert.equal(propertyLocaleDirty(next.pt.model, next.pt.baseline), true);
});
test("semantic equality ignores JSONB object key order and shared data never marks localized form dirty", () => {
  const states = workspace(),
    baseline = states.en.baseline!;
  const reversed = {
    ...baseline,
    content: Object.fromEntries(Object.entries(baseline.content).reverse()),
  };
  assert.equal(semanticEqual(reversed, baseline), true);
  const model = {
    ...states.en.model,
    working: {
      ...baseline,
      content: { ...baseline.content, cover_media_id: photo },
    },
  };
  assert.equal(propertyLocaleDirty(model, baseline), false);
  assert.equal(
    semanticEqual(
      apartmentSharedContent(model.working),
      apartmentSharedContent(baseline),
    ),
    false,
  );
});
test("media flush references are deduplicated and scoped to current property shared images", () => {
  const value = envelope();
  value.content.cover_media_id = photo;
  value.content.og_image_media_id = photo;
  value.content.gallery = [photo, "e3200000-0000-4000-8000-000000000002"];
  assert.deepEqual(apartmentMediaIds(value), [
    photo,
    "e3200000-0000-4000-8000-000000000002",
  ]);
});
