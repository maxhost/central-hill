import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyServiceEnvelope,
  identifyServiceContent,
  overlayServiceShared,
  serviceSharedContent,
  serviceLocalizedEqual,
} from "../locale-content";
import {
  checkServiceEnvelope,
  serviceSharedSchema,
} from "../server/locale-validation";
import { serviceSourceOnlyErrors } from "../server/locale-store";
import { serviceLocaleModel } from "../server/locale-model";
import {
  legacyServiceEnvelope,
  type ServiceIdentity,
  type ServiceLocaleRow,
} from "../server/locale-bootstrap";

const category = "e7800000-0000-4000-8000-000000000001";
const mediaA = "e7800000-0000-4000-8000-000000000011";
const mediaB = "e7800000-0000-4000-8000-000000000012";
function envelope() {
  const e = emptyServiceEnvelope(category);
  e.content.name = "English";
  e.content.detail.facts = [
    { id: "fact-a", icon: "clock", title: "First" },
    { id: "fact-b", icon: "map-pin", title: "Second" },
  ];
  e.content.detail.itinerary = [
    {
      id: "step-a",
      time: "09:00",
      title: "A",
      text: "First stop",
      media_id: mediaA,
    },
    {
      id: "step-b",
      time: "10:00",
      title: "B",
      text: "Second stop",
      media_id: mediaB,
    },
  ];
  return e;
}
function row(
  locale: ServiceLocaleRow["locale"],
  draft: ServiceLocaleRow["draft"],
  published: ServiceLocaleRow["published"],
  revision = 0,
): ServiceLocaleRow {
  return {
    id: category,
    service_id: category,
    locale,
    draft,
    published,
    revision,
    updated_by: null,
    published_at: null,
    draft_saved_at: null,
    created_at: new Date(0),
    updated_at: new Date(0),
  };
}
test("Shared nested icons and media follow stable ids after EN reordering; custom target text/order survive", () => {
  const en = envelope();
  const pt = structuredClone(en);
  pt.content.name = "Português";
  pt.content.detail.itinerary[0]!.title = "Primeira parada";
  en.content.detail.itinerary.reverse();
  en.content.detail.itinerary[1]!.media_id = mediaB;
  en.content.detail.facts.reverse();
  en.content.detail.facts[1]!.icon = "car";
  const result = overlayServiceShared(pt, serviceSharedContent(en.content));
  assert.equal(result.content.name, "Português");
  assert.equal(result.content.detail.itinerary[0]!.id, "step-a");
  assert.equal(result.content.detail.itinerary[0]!.title, "Primeira parada");
  assert.equal(result.content.detail.itinerary[0]!.media_id, mediaB);
  assert.equal(result.content.detail.facts[0]!.icon, "car");
  en.content.detail.facts = [];
  const retained = serviceSharedContent(
    en.content,
    serviceSharedContent(pt.content),
  );
  assert.equal(retained.factIcons["fact-a"], "clock");
});
test("Localized equality excludes every shared asset and icon but detects text and structure", () => {
  const source = envelope();
  const candidate = structuredClone(source);
  candidate.content.cover_media_id = mediaA;
  candidate.content.category_id = mediaB;
  candidate.content.detail.facts[0]!.icon = "car";
  candidate.content.detail.itinerary[0]!.media_id = mediaB;
  assert.equal(serviceLocalizedEqual(source.content, candidate.content), true);
  candidate.content.detail.itinerary[0]!.text = "Own target";
  assert.equal(serviceLocalizedEqual(source.content, candidate.content), false);
});
test("Inherited workspaces follow saved English; own published snapshot remains fixed and customized targets never follow", () => {
  const en = envelope();
  const saved = { ...structuredClone(en), localeMode: "inherit" as const };
  const englishNext = structuredClone(en);
  englishNext.content.name = "Next English";
  const rows = [row("en", englishNext, en, 3), row("pt", null, saved, 2)];
  const model = serviceLocaleModel(
    rows,
    "pt",
    emptyServiceEnvelope(category),
    serviceSharedContent(en.content),
  );
  assert.equal(model.working.content.name, "Next English");
  assert.equal(model.published?.content.name, "English");
  assert.equal(model.templateRevision, 3);
  rows[1]!.published!.localeMode = "custom";
  rows[1]!.published!.content.name = "Português próprio";
  assert.equal(
    serviceLocaleModel(rows, "pt", en, serviceSharedContent(en.content)).working
      .content.name,
    "Português próprio",
  );
});
test("Drafts retain incomplete primary fields; publishing and nested identity integrity remain guarded", () => {
  const empty = emptyServiceEnvelope(category);
  assert.deepEqual(checkServiceEnvelope(empty).errors, {});
  assert.ok(checkServiceEnvelope(empty, true).errors.name);
  const e = envelope();
  e.content.detail.facts[1]!.id = e.content.detail.facts[0]!.id;
  assert.ok(checkServiceEnvelope(e).errors["detail.facts"]);
  const common = serviceSharedContent(envelope().content);
  assert.equal(
    serviceSharedSchema.safeParse({
      ...common,
      factIcons: { bad: "invented-icon" },
    }).success,
    false,
  );
  assert.equal(
    serviceSharedSchema.safeParse({
      ...common,
      itineraryMedia: { bad: "not-a-media-id" },
    }).success,
    false,
  );
});
test("Targets cannot mutate category, presentation icons or fact icons through forged Save requests", () => {
  const source = envelope();
  const shared = serviceSharedContent(source.content);
  const target = structuredClone(source);
  target.content.category_id = mediaA;
  target.content.presentation = {
    version: 1,
    icons: { service_photos: "car" },
  };
  target.content.detail.facts[0]!.icon = "car";
  const errors = serviceSourceOnlyErrors(target, shared);
  assert.ok(errors.category_id);
  assert.ok(errors.presentation);
  assert.ok(errors["detail.facts.0.icon"]);
});
test("Legacy slot identities are deterministic and existing ids are preserved", () => {
  const e = envelope();
  delete e.content.detail.facts[0]!.id;
  delete e.content.detail.itinerary[0]!.id;
  const identified = identifyServiceContent(e.content);
  assert.equal(identified.detail.facts[0]!.id, "legacy-fact-0");
  assert.equal(identified.detail.itinerary[0]!.id, "legacy-step-0");
  assert.equal(identified.detail.facts[1]!.id, "fact-b");
});
test("Invalid legacy JSON prevents mutation projection rather than replacing stored detail", () => {
  const identity = {
    ...emptyServiceEnvelope(category).content,
    id: category,
    slug: "legacy",
    status: "published",
    created_at: new Date(0),
    updated_at: new Date(0),
    duration_label: null,
    cta_label: null,
    cta_url: null,
  } as ServiceIdentity;
  assert.throws(
    () =>
      legacyServiceEnvelope(
        identity,
        [
          {
            entity_type: "service",
            entity_id: category,
            field: "detail",
            locale: "en",
            value: "{broken",
            state: "draft",
            source_hash: null,
            updated_by: null,
            updated_at: new Date(0),
          },
        ],
        [],
        "en",
      ),
    /cannot be read safely/,
  );
});

test("JSONB key ordering does not acquire target ownership or report false shared changes", () => {
  const en = envelope();
  const reversed = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(reversed)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value)
              .reverse()
              .map(([key, child]) => [key, reversed(child)]),
          )
        : value;
  const roundTrip = reversed(en) as typeof en;
  assert.equal(serviceLocalizedEqual(en.content, roundTrip.content), true);
});

test("Cleared legacy translated duration and CTA labels never revive stale plain columns", () => {
  const identity: ServiceIdentity = {
    id: category,
    slug: "legacy-cleared-text",
    status: "published",
    position: 0,
    category_id: category,
    cover_media_id: null,
    og_image_media_id: null,
    price_from: null,
    rating_tenths: null,
    presentation: null,
    booking_type: "none",
    duration_label: "Stale duration column",
    cta_label: "Stale CTA column",
    cta_url: null,
    created_at: new Date(0),
    updated_at: new Date(0),
  };
  for (const locale of ["en", "pt"] as const) {
    const projected = legacyServiceEnvelope(identity, [], [], locale);
    assert.equal(projected.content.duration_label, null);
    assert.equal(projected.content.cta_label, null);
  }
  const projected = legacyServiceEnvelope(
    identity,
    [
      {
        entity_type: "service",
        entity_id: category,
        field: "duration_label",
        locale: "en",
        value: "Two hours",
        state: "draft",
        source_hash: null,
        updated_by: null,
        updated_at: new Date(0),
      },
      {
        entity_type: "service",
        entity_id: category,
        field: "cta_label",
        locale: "en",
        value: "Book translated action",
        state: "draft",
        source_hash: null,
        updated_by: null,
        updated_at: new Date(0),
      },
    ],
    [],
    "pt",
  );
  assert.equal(projected.content.duration_label, "Two hours");
  assert.equal(projected.content.cta_label, "Book translated action");
  assert.equal(identity.duration_label, "Stale duration column");
  assert.equal(identity.cta_label, "Stale CTA column");
});


test("ALT maps pass locale validation as localized data and cannot enter common state", () => {
  const e = envelope();
  e.content.media_alts = { [mediaA]: "Own nested image description" };
  const checked = checkServiceEnvelope(e);
  assert.deepEqual(checked.errors, {});
  assert.equal(checked.envelope?.content.media_alts?.[mediaA], "Own nested image description");
  assert.equal(Object.hasOwn(serviceSharedContent(e.content), "media_alts"), false);
  const own = structuredClone(e);
  own.content.media_alts![mediaA] = "Descripción propia";
  assert.equal(serviceLocalizedEqual(e.content, own.content), false);
  assert.equal(overlayServiceShared(own, serviceSharedContent(e.content)).content.media_alts?.[mediaA], "Descripción propia");
  assert.equal(serviceSharedSchema.safeParse({ ...serviceSharedContent(e.content), media_alts: e.content.media_alts }).success, false);
  e.content.media_alts = { invalid: "No UUID" };
  assert.ok(Object.keys(checkServiceEnvelope(e).errors).length);
  e.content.media_alts = { [mediaA]: "a".repeat(501) };
  assert.ok(Object.keys(checkServiceEnvelope(e).errors).length);
});
