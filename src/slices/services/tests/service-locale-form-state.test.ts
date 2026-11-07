import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyServiceEnvelope, serviceSharedContent } from "../locale-content";
import type {
  ServiceEditorialModel,
  ServiceEnvelope,
} from "../editorial-types";
import { SERVICE_EDITOR_LOCALES } from "../editorial-types";
import {
  createServiceWorkspace,
  changeServiceForm,
  applyServiceModel,
  applyServiceVisibilityModel,
  servicePublicationNeedsSave,
  serviceAnyFormDirty,
  serviceLocaleFormDirty,
  serviceFormEnvelope,
  serviceFormEqual,
} from "../admin/locale-form-state";
import { detailToDraft, draftToDetail, moveAt } from "../admin/detail-draft";

const category = "e7800000-0000-4000-8000-000000000001";
const image1 = "e7800000-0000-4000-8000-000000000011";
const image2 = "e7800000-0000-4000-8000-000000000012";
function envelope(name = "English"): ServiceEnvelope {
  const e = emptyServiceEnvelope(category);
  e.content.name = name;
  e.content.detail.facts = [
    { id: "f1", icon: "clock", title: "Time" },
    { id: "f2", icon: "map-pin", title: "Place" },
  ];
  e.content.detail.itinerary = [
    { id: "s1", time: "9", title: "First", text: "Arrival", media_id: image1 },
    { id: "s2", time: "10", title: "Second", text: "Depart", media_id: image2 },
  ];
  return e;
}
function model(e = envelope()): ServiceEditorialModel {
  return {
    id: "e7800000-0000-4000-8000-000000000020",
    status: "draft",
    slugByLocale: { en: "service" },
    shared: { revision: 2, content: serviceSharedContent(e.content) },
    previews: {},
    locales: Object.fromEntries(
      SERVICE_EDITOR_LOCALES.map((locale) => {
        const own = structuredClone(e);
        own.localeMode = locale === "en" ? "custom" : "inherit";
        return [
          locale,
          {
            locale,
            revision: 1,
            templateRevision: locale === "en" ? null : 1,
            draft: locale === "en" ? own : null,
            published: null,
            working: own,
          },
        ];
      }),
    ) as ServiceEditorialModel["locales"],
  };
}

test("tabs and shared-only changes do not take ownership; EN unsaved text does not propagate", () => {
  const initial = model();
  let w = createServiceWorkspace(initial, category);
  assert.equal(serviceAnyFormDirty(w), false);
  w = changeServiceForm(w, "en", {
    ...w.locales.en.working,
    name: "Unsaved English",
  });
  assert.equal(w.locales.pt.working.name, "English");
  assert.equal(serviceFormEnvelope(w, "pt").localeMode, "inherit");
  w = changeServiceForm(w, "pt", {
    ...w.locales.pt.working,
    cover_media_id: image2,
  });
  for (const locale of SERVICE_EDITOR_LOCALES)
    assert.equal(w.locales[locale].working.cover_media_id, image2);
  assert.equal(serviceFormEnvelope(w, "pt").localeMode, "inherit");
  assert.equal(serviceLocaleFormDirty(w, "pt"), true);
  w = changeServiceForm(w, "pt", {
    ...w.locales.pt.working,
    meta_title: "SEO português",
  });
  assert.equal(serviceFormEnvelope(w, "pt").localeMode, "custom");
  w = changeServiceForm(w, "pt", { ...w.locales.pt.working, meta_title: "" });
  assert.equal(
    serviceFormEnvelope(w, "pt").localeMode,
    "inherit",
    "reverting an unsaved text edit does not claim ownership",
  );
});

test("saved EN refreshes untouched targets, retaining unsaved PT/SEO/booking and custom locales", () => {
  let w = createServiceWorkspace(model(), category);
  w = changeServiceForm(w, "pt", {
    ...w.locales.pt.working,
    name: "Meu passeio",
    meta_title: "Meu SEO",
    cta_url: "https://example.test/pt",
  });
  const incoming = model(envelope("Saved English"));
  incoming.locales.en.revision = 2;
  incoming.shared.revision = 3;
  w = applyServiceModel(w, "en", incoming, "Saved");
  assert.equal(w.locales.es.working.name, "Saved English");
  assert.equal(w.locales.pt.working.name, "Meu passeio");
  assert.equal(w.locales.pt.working.meta_title, "Meu SEO");
  assert.equal(w.locales.pt.working.cta_url, "https://example.test/pt");
  assert.equal(w.locales.pt.conflict, false);
  assert.equal(serviceFormEnvelope(w, "pt").localeMode, "custom");
  assert.equal(serviceLocaleFormDirty(w, "en"), false);
  assert.equal(serviceLocaleFormDirty(w, "pt"), true);
  const custom = model(envelope("Português salvo"));
  custom.locales.pt.working.localeMode = "custom";
  w = applyServiceModel(w, "pt", custom);
  assert.equal(serviceLocaleFormDirty(w, "pt"), false);
  assert.equal(serviceFormEnvelope(w, "pt").localeMode, "custom");
});

test("shared nested images and icons are joined by stable ids across reordered custom arrays", () => {
  let w = createServiceWorkspace(model(), category);
  const pt = structuredClone(w.locales.pt.working);
  pt.detail.itinerary = moveAt(pt.detail.itinerary, 0, 1);
  pt.detail.itinerary[0]!.title = "Segundo em português";
  pt.detail.facts = moveAt(pt.detail.facts, 0, 1);
  pt.detail.facts[0]!.title = "Local";
  w = changeServiceForm(w, "pt", pt);
  const en = structuredClone(w.locales.en.working);
  en.detail.itinerary[0]!.media_id = image2;
  en.detail.facts[0]!.icon = "car";
  w = changeServiceForm(w, "en", en);
  assert.equal(w.locales.pt.working.detail.itinerary[0]!.id, "s2");
  assert.equal(
    w.locales.pt.working.detail.itinerary[0]!.title,
    "Segundo em português",
  );
  assert.equal(w.locales.pt.working.detail.itinerary[1]!.media_id, image2);
  assert.equal(w.locales.pt.working.detail.facts[0]!.title, "Local");
  assert.equal(w.locales.pt.working.detail.facts[1]!.icon, "car");
  assert.deepEqual(
    draftToDetail(detailToDraft(envelope().content.detail)),
    envelope().content.detail,
  );
});

test("a full-model result cannot silently clear other-language work or acknowledge its external revision", () => {
  let w = createServiceWorkspace(model(), category);
  w = changeServiceForm(w, "fr", {
    ...w.locales.fr.working,
    body: "Travail français non enregistré",
  });
  const incoming = model();
  incoming.locales.fr.revision = 4;
  incoming.locales.fr.working.content.body = "External edit";
  w = applyServiceModel(w, "en", incoming);
  assert.equal(w.locales.fr.working.body, "Travail français non enregistré");
  assert.equal(w.locales.fr.conflict, true);
  assert.equal(serviceAnyFormDirty(w), true);
});

test("JSONB object order is ignored while localized order and explicit clears remain meaningful", () => {
  assert.equal(
    serviceFormEqual({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 }),
    true,
  );
  assert.equal(serviceFormEqual({ a: null }, {}), false);
  assert.equal(serviceFormEqual(["a", "b"], ["b", "a"]), false);
});

test("Archive/Restore keep selected unsaved text, other tabs, common pending images and saved drafts", () => {
  let w = createServiceWorkspace(model(), category);
  w = changeServiceForm(w, "en", {
    ...w.locales.en.working,
    name: "Current unsaved EN",
    cover_media_id: image2,
  });
  w = changeServiceForm(w, "pt", {
    ...w.locales.pt.working,
    name: "Current unsaved PT",
  });
  const archived = model();
  archived.status = "archived";
  w = applyServiceVisibilityModel(w, archived);
  assert.equal(w.model?.status, "archived");
  assert.equal(w.locales.en.working.name, "Current unsaved EN");
  assert.equal(w.locales.pt.working.name, "Current unsaved PT");
  assert.equal(w.locales.es.working.cover_media_id, image2);
  assert.equal(w.model?.locales.en.draft?.content.name, "English");
  assert.equal(serviceLocaleFormDirty(w, "en"), true);
  assert.equal(serviceLocaleFormDirty(w, "pt"), true);
  assert.equal(w.locales.en.conflict, false);
  const restored = model();
  restored.status = "published";
  w = applyServiceVisibilityModel(w, restored);
  assert.equal(w.locales.en.working.name, "Current unsaved EN");
  assert.equal(w.locales.fr.working.cover_media_id, image2);
});

test("new saved EN requires re-saving an older inherited draft before Publish without taking ownership", () => {
  const m = model(envelope("Latest saved English"));
  m.locales.pt.draft = {
    ...envelope("Older saved English"),
    localeMode: "inherit",
  };
  const w = createServiceWorkspace(m, category);
  assert.equal(w.locales.pt.working.name, "Latest saved English");
  assert.equal(serviceLocaleFormDirty(w, "pt"), false);
  assert.equal(serviceFormEnvelope(w, "pt").localeMode, "inherit");
  assert.equal(servicePublicationNeedsSave(w, "pt"), true);
  m.locales.pt.draft = structuredClone(m.locales.pt.working);
  assert.equal(
    servicePublicationNeedsSave(createServiceWorkspace(m, category), "pt"),
    false,
  );
});
