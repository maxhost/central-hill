import { test } from "node:test";
import assert from "node:assert/strict";
import type { Locale } from "@core/db/columns";
import {
  GUIDE_EDITOR_LOCALES,
  type GuideContent,
  type GuideEditorialModel,
  type GuideEnvelope,
} from "../editorial-types";
import {
  emptyGuideEnvelope,
  guideSharedContent,
  guideSharedMediaIds,
  guideValuesEqual,
} from "../locale-content";
import {
  newGuide,
  newSection,
  newPlace,
  moveItem,
} from "../admin/ui/editor-model";
import {
  createGuideWorkspace,
  changeGuideContent,
  guideFormEnvelope,
  guideFormSharedContent,
  applyGuideModel,
  applyGuideVisibilityModel,
  guideLocalTextDirty,
  guideLocaleFormDirty,
  guideAnyFormDirty,
  guidePublicationNeedsSave,
  guideEntityErrors,
} from "../admin/ui/locale-form-state";

const pageId = "e7910000-0000-4000-8000-000000000001",
  sectionId = "e7910000-0000-4000-8000-000000000002",
  placeId = "e7910000-0000-4000-8000-000000000003";
const targetId = "e7910000-0000-4000-8000-000000000004";
const draft = () => newGuide(pageId, "e7910000-0000-4000-8000-000000000005");
function tree(): GuideContent {
  const section = {
    ...newSection(sectionId, pageId, 0),
    title: "Explore",
    presentation: { version: 1 as const, enabled: true },
    places: [
      {
        ...newPlace(placeId, sectionId, 0),
        name: "Cafe",
        category: "Restaurant",
      },
    ],
  };
  return {
    ...emptyGuideEnvelope(draft().city_id).content,
    title: "Guide",
    sections: [section],
  };
}
function envelope(content: GuideContent, locale: Locale): GuideEnvelope {
  return {
    schemaVersion: 1,
    localeMode: locale === "en" ? "custom" : "inherit",
    content: structuredClone(content),
  };
}
function model(content = tree()): GuideEditorialModel {
  return {
    id: pageId,
    status: "draft",
    slugByLocale: { en: "guide" },
    citySlugs: { en: "lisbon", es: "lisboa", pt: "lisboa", fr: "lisbonne" },
    shared: { revision: 1, content: guideSharedContent(content) },
    locales: Object.fromEntries(
      GUIDE_EDITOR_LOCALES.map((locale) => [
        locale,
        {
          locale,
          revision: 1,
          templateRevision: null,
          draft: envelope(content, locale),
          published: null,
          working: envelope(content, locale),
        },
      ]),
    ) as GuideEditorialModel["locales"],
    cities: [],
    previews: {},
  };
}
test("composes and orders the complete guide tree before first Save with stable parent identities", () => {
  let state = createGuideWorkspace(null, draft());
  const section = {
    ...newSection(sectionId, pageId, 0),
    presentation: { version: 1 as const, enabled: true },
  };
  const place = newPlace(placeId, sectionId, 0),
    other = newPlace(targetId, sectionId, 1);
  section.places = moveItem([place, other], targetId, -1);
  state = changeGuideContent(state, "en", {
    ...state.locales.en.working,
    sections: [section],
  });
  const payload = guideFormEnvelope(state, "en");
  assert.equal(state.model, null);
  assert.equal(payload.content.sections[0]?.guide_page_id, pageId);
  assert.deepEqual(
    payload.content.sections[0]?.places.map((place) => [
      place.id,
      place.guide_section_id,
      place.position,
    ]),
    [
      [targetId, sectionId, 0],
      [placeId, sectionId, 1],
    ],
  );
  assert.deepEqual(payload.content.sections[0]?.presentation, {
    version: 1,
    enabled: true,
  });
  assert.equal(guideAnyFormDirty(state), true);
  assert.equal(state.locales.es.working.sections.length, 0);
  state = changeGuideContent(state, "en", {
    ...state.locales.en.working,
    sections: [],
  });
  assert.deepEqual(state.shared.sections, {});
  assert.deepEqual(state.shared.places, {});
});
test("unsaved EN text stays local; saved EN updates untouched targets while custom targets retain ownership", () => {
  const original = model();
  original.locales.pt.working.localeMode = "custom";
  original.locales.pt.working.content.title = "Guia";
  let state = createGuideWorkspace(original, draft());
  state = changeGuideContent(state, "en", {
    ...state.locales.en.working,
    title: "Updated EN",
  });
  assert.equal(state.locales.es.working.title, "Guide");
  const incoming = model({ ...tree(), title: "Updated EN" });
  incoming.locales.en.revision = 2;
  incoming.locales.pt = structuredClone(original.locales.pt);
  state = applyGuideModel(state, "en", incoming);
  assert.equal(state.locales.es.working.title, "Updated EN");
  assert.equal(state.locales.pt.working.title, "Guia");
  assert.equal(guideFormEnvelope(state, "pt").localeMode, "custom");
  assert.equal(guideLocalTextDirty(state.locales.es), false);
});
test("shared nested photos follow UUIDs across different localized orders without changing text", () => {
  const initial = model();
  initial.locales.es.working.content.sections[0]!.places.push({
    ...newPlace(targetId, sectionId, 1),
    name: "Segundo",
  });
  initial.locales.es.working.content.sections[0]!.places.reverse();
  let state = createGuideWorkspace(initial, draft());
  const changed = structuredClone(state.locales.en.working);
  changed.sections[0]!.header_media_id = "section-photo";
  changed.sections[0]!.places[0]!.media_id = "place-photo";
  state = changeGuideContent(state, "en", changed);
  assert.equal(
    state.locales.es.working.sections[0]?.header_media_id,
    "section-photo",
  );
  assert.equal(state.locales.es.working.sections[0]?.places[1]?.id, placeId);
  assert.equal(
    state.locales.es.working.sections[0]?.places[1]?.media_id,
    "place-photo",
  );
  assert.equal(
    state.locales.es.working.sections[0]?.places[0]?.name,
    "Segundo",
  );
  assert.equal(guideLocalTextDirty(state.locales.es), false);
  assert.equal(guideLocaleFormDirty(state, "es"), true);
});
test("Save EN includes PT-only pending section/place assets and preserves pending PT text after result", () => {
  let state = createGuideWorkspace(model(), draft());
  const section = {
    ...newSection(targetId, pageId, 1),
    title: "Só PT",
    header_media_id: "pt-section",
    places: [
      {
        ...newPlace("pt-place", targetId, 0),
        name: "Lugar",
        media_id: "pt-place-photo",
      },
    ],
  };
  state = changeGuideContent(state, "pt", {
    ...state.locales.pt.working,
    title: "Guia nova",
    sections: [...state.locales.pt.working.sections, section],
  });
  assert.equal(guideFormEnvelope(state, "pt").localeMode, "custom");
  const common = guideFormSharedContent(state);
  assert.equal(common.sections[targetId]?.header_media_id, "pt-section");
  assert.equal(common.places["pt-place"]?.media_id, "pt-place-photo");
  assert.equal(common.places["pt-place"]?.section_id, targetId);
  assert.equal(guideFormEnvelope(state, "en").content.sections.length, 1);
  const incoming = model();
  incoming.shared = { revision: 2, content: common };
  incoming.locales.en.revision = 2;
  state = applyGuideModel(state, "en", incoming);
  assert.equal(state.locales.pt.working.title, "Guia nova");
  assert.equal(
    state.locales.pt.working.sections[1]?.places[0]?.media_id,
    "pt-place-photo",
  );
  assert.equal(state.locales.pt.conflict, false);
  assert.equal(guideLocalTextDirty(state.locales.pt), true);
});
test("prunes only unreferenced never-saved registry entries, retaining saved history and other-language references", () => {
  let state = createGuideWorkspace(model(), draft());
  state = changeGuideContent(state, "en", {
    ...state.locales.en.working,
    sections: [],
  });
  assert.ok(state.shared.sections[sectionId]);
  assert.ok(state.shared.places[placeId]);
  const section = {
    ...newSection(targetId, pageId, 0),
    header_media_id: "pending",
  };
  state = changeGuideContent(state, "pt", {
    ...state.locales.pt.working,
    sections: [section],
  });
  state = changeGuideContent(state, "es", {
    ...state.locales.es.working,
    sections: [structuredClone(section)],
  });
  state = changeGuideContent(state, "pt", {
    ...state.locales.pt.working,
    sections: [],
  });
  assert.ok(state.shared.sections[targetId]);
  state = changeGuideContent(state, "es", {
    ...state.locales.es.working,
    sections: [],
  });
  assert.equal(state.shared.sections[targetId], undefined);
  assert.ok(state.shared.sections[sectionId]);
  assert.equal(guideSharedMediaIds(state.shared).includes("pending"), false);
});
test("category labels translate independently; neutral recommendation eligibility remains EN-owned", () => {
  let state = createGuideWorkspace(model(), draft());
  const es = structuredClone(state.locales.es.working);
  es.sections[0]!.places[0]!.category = "Restaurante";
  state = changeGuideContent(state, "es", es);
  assert.equal(state.shared.places[placeId]?.recommendation_type, "restaurant");
  assert.equal(
    state.locales.en.working.sections[0]?.places[0]?.category,
    "Restaurant",
  );
  assert.equal(
    state.locales.es.working.sections[0]?.places[0]?.category,
    "Restaurante",
  );
  const en = structuredClone(state.locales.en.working);
  en.sections[0]!.places[0]!.category = "Beach";
  state = changeGuideContent(state, "en", en);
  assert.equal(state.shared.places[placeId]?.recommendation_type, "beach");
});
test("JSONB key ordering is not a text edit or a customization", () => {
  let state = createGuideWorkspace(model(), draft());
  const reordered = Object.fromEntries(
    Object.entries(state.locales.es.working).reverse(),
  ) as unknown as GuideContent;
  assert.equal(guideValuesEqual(reordered, state.locales.es.working), true);
  state = changeGuideContent(state, "es", reordered);
  assert.equal(guideAnyFormDirty(state), false);
  assert.equal(guideFormEnvelope(state, "es").localeMode, "inherit");
});
test("a result marks stale unsaved target revisions as conflicts rather than acknowledging them", () => {
  let state = createGuideWorkspace(model(), draft());
  state = changeGuideContent(state, "pt", {
    ...state.locales.pt.working,
    title: "Pending PT",
  });
  const incoming = model();
  incoming.locales.pt.revision = 2;
  incoming.locales.pt.working.content.title = "External PT";
  state = applyGuideModel(state, "en", incoming);
  assert.equal(state.locales.pt.working.title, "Pending PT");
  assert.equal(state.locales.pt.conflict, true);
});
test("visibility keeps selected and other unsaved text, slug, shared images and ownership", () => {
  let state = createGuideWorkspace(model(), draft());
  state = changeGuideContent(state, "en", {
    ...state.locales.en.working,
    title: "Pending EN",
    hero_media_id: "new-root-photo",
  });
  state = changeGuideContent(state, "es", {
    ...state.locales.es.working,
    title: "Pendiente ES",
  });
  state.slug = "pending-slug";
  const incoming = model();
  incoming.status = "archived";
  state = applyGuideVisibilityModel(state, incoming);
  assert.equal(state.locales.en.working.title, "Pending EN");
  assert.equal(state.locales.es.working.title, "Pendiente ES");
  assert.equal(state.shared.hero_media_id, "new-root-photo");
  assert.equal(state.slug, "pending-slug");
  assert.equal(guideFormEnvelope(state, "es").localeMode, "custom");
  assert.equal(state.locales.en.conflict, false);
  const external = structuredClone(incoming);
  external.shared.revision = 2;
  state = applyGuideVisibilityModel(state, external);
  assert.equal(state.locales.en.conflict, true);
});
test("an inherited draft older than working EN needs Save before Publish without acquiring ownership", () => {
  const incoming = model();
  incoming.locales.es.working.content.title = "New EN";
  const state = createGuideWorkspace(incoming, draft());
  assert.equal(guidePublicationNeedsSave(state, "es"), true);
  assert.equal(guideLocalTextDirty(state.locales.es), false);
  assert.equal(guideFormEnvelope(state, "es").localeMode, "inherit");
});
test("validation resolves indexed/UUID nested paths to stable entity fields", () => {
  const errors = guideEntityErrors(tree(), pageId, {
    "payload.content.sections.0.places.0.name": "Name",
    [`sections.${sectionId}.title`]: "Title",
    "content.title": "Guide title",
    _shared: "Shared",
  });
  assert.deepEqual(errors, {
    [placeId]: { name: "Name" },
    [sectionId]: { title: "Title" },
    [pageId]: { title: "Guide title", _shared: "Shared" },
  });
});
