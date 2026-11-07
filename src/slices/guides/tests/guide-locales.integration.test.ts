import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import {
  setSourceContent,
  setTargetTranslation,
  setSlugs,
  deleteContent,
  deleteSlugs,
} from "@core/i18n";
import { listGuideCityOptions } from "@slices/geography/contract";
import {
  guide_page,
  guide_section,
  guide_place,
  guide_locale_content,
} from "../schema";
import { emptyGuideEnvelope, guideSharedContent } from "../locale-content";
import type {
  GuideEditorialModel,
  GuideEditorialResult,
  GuideEnvelope,
} from "../editorial-types";
import { readGuideEditorialModel } from "../server/locale-model";
import {
  saveGuideDraft,
  publishGuideDraft,
  setGuideArchived,
} from "../server/locale-store";
import { loadGuidePublications } from "../server/locale-public";
import {
  getGuidePage,
  listTopRecommendations,
  listGuideCityGroups,
  listGuideParams,
} from "../server/queries";
import { getGuideEditorialRedirect } from "../server/editorial-translation-policy";
const id = (n: number) =>
  `e7900000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const NEW = id(10),
  LEGACY = id(20),
  OTHER = id(30),
  SECTION = id(11),
  PLACE = id(12),
  HISTORY = id(13),
  PTSECTION = id(14),
  PTPLACE = id(15);
const actor = "guide-locales-backend";
let verified = false,
  cityId = "",
  citySlug = "";
function success(r: GuideEditorialResult) {
  assert.equal(r.ok, true, JSON.stringify(r));
  if (!r.ok) throw Error("failed");
  return r.model;
}
async function model(id = NEW) {
  const m = await readGuideEditorialModel(id);
  assert.ok(m);
  return m;
}
function request(
  m: GuideEditorialModel,
  locale: "en" | "es" | "pt" | "fr",
  payload = structuredClone(m.locales[locale].working),
) {
  return {
    guideId: m.id,
    locale,
    payload,
    expectedRevision: m.locales[locale].revision,
    templateRevision: m.locales[locale].templateRevision,
    expectedSharedRevision: m.shared.revision,
  };
}
async function save(
  m: GuideEditorialModel,
  locale: "en" | "es" | "pt" | "fr",
  change: (e: GuideEnvelope) => void = () => {},
) {
  const r = request(m, locale);
  change(r.payload);
  return success(await saveGuideDraft(r, actor));
}
async function publish(
  m: GuideEditorialModel,
  locale: "en" | "es" | "pt" | "fr",
) {
  return success(
    await publishGuideDraft(
      { guideId: m.id, locale, expectedRevision: m.locales[locale].revision },
      actor,
    ),
  );
}
async function cleanup() {
  for (const guideId of [NEW, LEGACY, OTHER]) {
    await db.delete(guide_page).where(eq(guide_page.id, guideId));
    await deleteContent("guide_page", guideId);
    await deleteSlugs("guide_page", guideId);
  }
  for (const n of [21, 22])
    await deleteContent(n === 21 ? "guide_section" : "guide_place", id(n));
}
before(async () => {
  assert.equal(
    new URL(process.env.DATABASE_URL ?? "http://invalid").hostname,
    "propertylocalesqa.local",
  );
  const result = await db.execute(
    sql`select current_database() as database,current_user as role`,
  );
  assert.deepEqual(result.rows[0], {
    database: "propertylocalesqa",
    role: "propertylocalesqa",
  });
  verified = true;
  Object.assign(globalThis, {
    __incrementalCache: {
      generateCacheKey: async (k: string) => k,
      get: async () => null,
      set: async () => undefined,
    },
  });
  await cleanup();
  const city = (await listGuideCityOptions()).find(
    (c) => c.status === "published",
  );
  assert.ok(city);
  cityId = city.id;
  citySlug = city.slug;
  await db.insert(guide_page).values({
    id: LEGACY,
    city_id: cityId,
    status: "published",
    slug: "guide-locale-legacy",
  });
  await db.insert(guide_section).values({
    id: id(21),
    guide_page_id: LEGACY,
    cta_label: "Column label must stay retired",
    cta_url: "https://example.com",
  });
  await db
    .insert(guide_place)
    .values({ id: id(22), guide_section_id: id(21), category: "Restaurant" });
  await setSourceContent(
    "guide_page",
    LEGACY,
    { title: "Legacy English", intro: "Legacy intro" },
    { updatedBy: actor },
  );
  await setSourceContent(
    "guide_section",
    id(21),
    { title: "Legacy section", body: "Legacy body" },
    { updatedBy: actor },
  );
  await setSourceContent(
    "guide_place",
    id(22),
    { name: "Legacy place" },
    { updatedBy: actor },
  );
  await setTargetTranslation(
    "guide_page",
    LEGACY,
    "title",
    "es",
    "Español pendiente",
    { sourceValue: "Legacy English", state: "needs_review", updatedBy: actor },
  );
  await setSlugs("guide_page", LEGACY, {
    en: "guide-locale-legacy",
    es: "guide-locale-legado",
    pt: "guide-locale-portugues",
    fr: "guide-locale-francais",
  });
});
after(async () => {
  if (verified) await cleanup();
});
test("legacy GET has no writes and pending text stays private; raw CTA label is not revived", async () => {
  const m = await model(LEGACY);
  assert.equal(m.locales.es.published?.content.title, "Legacy English");
  assert.equal(m.locales.es.working.content.title, "Español pendiente");
  assert.equal(m.locales.en.working.content.sections[0]?.cta_label, null);
  assert.equal(
    (
      await db
        .select()
        .from(guide_locale_content)
        .where(eq(guide_locale_content.guide_id, LEGACY))
    ).length,
    0,
  );
  const pub = await getGuidePage("en", citySlug, "guide-locale-legacy");
  assert.equal(pub?.title, "Legacy English");
  assert.equal(pub?.sections[0]?.cta, null);
});
test("first save creates the full tree, registry and four locale units; publication is explicit", async () => {
  const e = emptyGuideEnvelope(cityId);
  e.content.title = "New English";
  e.content.sections = [
    {
      id: SECTION,
      guide_page_id: NEW,
      position: 0,
      layout: "standard",
      header_media_id: null,
      presentation: null,
      title: "Section",
      body: "Body",
      local_tip: null,
      cta_label: null,
      cta_url: null,
      places: [
        {
          id: PLACE,
          guide_section_id: SECTION,
          position: 0,
          category: "Restaurant",
          address: null,
          phone: null,
          price_tier: null,
          opening_hours: null,
          latitude: null,
          longitude: null,
          website_url: null,
          booking_url: null,
          media_id: null,
          name: "Place",
          description: null,
        },
      ],
    },
  ];
  let m = success(
    await saveGuideDraft(
      {
        guideId: NEW,
        locale: "en",
        expectedRevision: 0,
        templateRevision: null,
        expectedSharedRevision: 0,
        slug: "guide-locale-new",
        payload: e,
      },
      actor,
    ),
  );
  assert.equal(m.locales.es.working.content.title, "New English");
  assert.equal((await loadGuidePublications([NEW], "en")).get(NEW), null);
  assert.equal(
    await getGuideEditorialRedirect("guide_place", PLACE, "pt"),
    `/admin/guides/${NEW}?locale=pt`,
  );
  m = await publish(m, "en");
  assert.equal(
    (await loadGuidePublications([NEW], "en")).get(NEW)?.envelope.content.title,
    "New English",
  );
  assert.equal((await loadGuidePublications([NEW], "es")).get(NEW), null);
  const pub = await getGuidePage("en", citySlug, "guide-locale-new");
  assert.ok(pub);
  assert.deepEqual(Object.keys(pub.alternates), ["en"]);
  assert.equal(pub.sections[0]?.places[0]?.name, "Place");
  assert.equal(
    (await listGuideParams()).filter((p) => p.slug === "guide-locale-new")
      .length,
    1,
  );
});
test("target Save owns all localized fields; later EN changes leave target publication and draft intact", async () => {
  let m = await model();
  m = await save(m, "es", (e) => {
    e.content.title = "Español";
    e.content.sections[0]!.places[0]!.category = "Restaurante";
  });
  assert.equal(m.locales.es.working.localeMode, "custom");
  m = await publish(m, "es");
  m = await save(m, "en", (e) => {
    e.content.title = "English revised";
  });
  assert.equal(m.locales.es.working.content.title, "Español");
  assert.equal(m.locales.pt.working.content.title, "English revised");
  assert.equal(
    (await loadGuidePublications([NEW], "en")).get(NEW)?.envelope.content.title,
    "New English",
  );
  assert.equal(
    (await loadGuidePublications([NEW], "es")).get(NEW)?.envelope.content
      .sections[0]?.places[0]?.category,
    "Restaurante",
  );
  assert.equal(
    (await listGuideCityGroups("es"))
      .flatMap((c) => c.guides)
      .find((g) => g.id === NEW)?.title,
    "Español",
  );
});
test("shared images and visibility update every publication; recommendation classification survives translated categories", async () => {
  let m = await model();
  m = await save(m, "en", (e) => {
    e.content.hero_media_id = "d3000000-0000-4000-8000-000000000001";
    e.content.sections[0]!.places[0]!.media_id =
      "d3000000-0000-4000-8000-000000000001";
    e.content.sections[0]!.places[0]!.address = "Shared address";
  });
  const publicES = await getGuidePage("es", citySlug, "guide-locale-new");
  assert.equal(publicES?.sections[0]?.places[0]?.category, "Restaurante");
  assert.ok(publicES?.sections[0]?.places[0]?.image);
  assert.equal(publicES?.sections[0]?.places[0]?.address, "Shared address");
  const recs = await listTopRecommendations("es", 3, { cityIds: [cityId] });
  const rec = recs.find((r) => r.id === PLACE);
  assert.ok(rec);
  assert.equal(rec.type, "restaurant");
  assert.equal(rec.category, "Restaurante");
  const stale = request(m, "pt");
  m = success(await saveGuideDraft(stale, actor));
  m = await save(m, "en", (e) => {
    e.content.intro = "Later English";
  });
  const failed = await publishGuideDraft(
    { guideId: NEW, locale: "pt", expectedRevision: m.locales.pt.revision },
    actor,
  );
  assert.deepEqual(failed, { ok: false, error: "conflict" });
  m = await save(m, "en", (e) => {
    e.content.sections[0]!.presentation = {
      version: 1,
      modules: { places: false },
    };
  });
  assert.equal(
    (await getGuidePage("es", citySlug, "guide-locale-new"))?.sections[0]
      ?.places.length,
    0,
  );
  m = await save(m, "en", (e) => {
    e.content.sections[0]!.presentation = null;
  });
  assert.equal(
    (await getGuidePage("es", citySlug, "guide-locale-new"))?.sections[0]
      ?.places.length,
    1,
  );
  const bad = request(m, "en");
  const shared = guideSharedContent(bad.payload.content, m.shared.content);
  shared.sections[PTSECTION] = {
    layout: "standard",
    presentation: null,
    header_media_id: "e7900000-0000-4000-8000-000000000999",
  };
  const before = m.shared.revision;
  assert.equal((await saveGuideDraft({ ...bad, shared }, actor)).ok, false);
  assert.equal((await model()).shared.revision, before);
});
test("shared pending-only rows register atomically; localized placement preserves first registry parent", async () => {
  let m = await model();
  const r = request(m, "en");
  const common = guideSharedContent(r.payload.content, m.shared.content);
  common.sections[PTSECTION] = {
    header_media_id: null,
    layout: "standard",
    presentation: null,
  };
  common.places[PTPLACE] = {
    section_id: PTSECTION,
    media_id: null,
    address: null,
    phone: null,
    price_tier: null,
    latitude: null,
    longitude: null,
    recommendation_type: null,
  };
  m = success(await saveGuideDraft({ ...r, shared: common }, actor));
  assert.equal(
    (await db.select().from(guide_place).where(eq(guide_place.id, PTPLACE)))[0]
      ?.guide_section_id,
    PTSECTION,
  );
  const moved = structuredClone(m.locales.es.working);
  moved.content.sections.push({
    id: PTSECTION,
    guide_page_id: NEW,
    position: 1,
    layout: "standard",
    header_media_id: null,
    presentation: null,
    title: "Destino",
    body: "Body",
    local_tip: null,
    cta_label: null,
    cta_url: null,
    places: [],
  });
  const place = moved.content.sections[0]!.places.pop()!;
  place.guide_section_id = PTSECTION;
  moved.content.sections[1]!.places.push(place);
  m = success(
    await saveGuideDraft(
      {
        ...request(m, "es", moved),
        shared: guideSharedContent(moved.content, m.shared.content, "es"),
      },
      actor,
    ),
  );
  assert.equal(m.locales.es.working.content.sections[1]?.places[0]?.id, PLACE);
  assert.equal(
    (await db.select().from(guide_place).where(eq(guide_place.id, PLACE)))[0]
      ?.guide_section_id,
    SECTION,
  );
});
test("CAS rejects stale locale/shared and inheritance snapshots; archived save preserves publications/drafts", async () => {
  let m = await model();
  const stale = request(m, "pt");
  m = await save(m, "en", (e) => {
    e.content.intro = "Changed";
  });
  assert.equal((await saveGuideDraft(stale, actor)).ok, false);
  m = success(await setGuideArchived(NEW, true, actor));
  assert.equal(m.status, "archived");
  m = await save(m, "en", (e) => {
    e.content.title = "Archived working";
  });
  assert.equal(m.status, "archived");
  assert.equal(m.locales.es.published?.content.title, "Español");
  m = success(await setGuideArchived(NEW, false, actor));
  assert.equal(m.status, "published");
  assert.equal(m.locales.en.working.content.title, "Archived working");
});
test("foreign UUID ownership, target classification, missing history and corrupt data cannot overwrite content", async () => {
  let m = await model();
  await db
    .insert(guide_page)
    .values({ id: OTHER, city_id: cityId, slug: "guide-locale-other" });
  await db.insert(guide_section).values({ id: HISTORY, guide_page_id: OTHER });
  const r = request(m, "en");
  r.payload.content.sections.push({
    id: HISTORY,
    guide_page_id: NEW,
    position: 2,
    layout: "standard",
    header_media_id: null,
    presentation: null,
    title: "Hijack",
    body: "Body",
    local_tip: null,
    cta_label: null,
    cta_url: null,
    places: [],
  });
  const failed = await saveGuideDraft(r, actor);
  assert.deepEqual(failed, { ok: false, error: "ownership" });
  assert.equal((await model()).shared.revision, m.shared.revision);
  const target = request(m, "es");
  const common = guideSharedContent(
    target.payload.content,
    m.shared.content,
    "es",
  );
  common.places[PLACE]!.recommendation_type = "beach";
  assert.equal(
    (await saveGuideDraft({ ...target, shared: common }, actor)).ok,
    false,
  );
  delete common.places[PLACE];
  assert.equal(
    (await saveGuideDraft({ ...target, shared: common }, actor)).ok,
    false,
  );
  m = await save(m, "en");
  assert.equal(m.locales.en.working.content.title, "Archived working");
});
test("legacy Archive bootstraps publications before hiding and Restore preserves them", async () => {
  let m = success(await setGuideArchived(LEGACY, true, actor));
  assert.equal(m.locales.en.published?.content.title, "Legacy English");
  assert.equal(m.locales.es.working.content.title, "Español pendiente");
  m = success(await setGuideArchived(LEGACY, false, actor));
  assert.equal(m.status, "published");
  assert.equal(m.locales.es.published?.content.title, "Legacy English");
});

test("corrupt stored aggregate gives a readable legacy error and refuses mutations", async () => {
  const m = await model();
  await db.execute(
    sql`update guide_locale_content set draft='{"schemaVersion":99}'::jsonb where guide_id=${NEW}::uuid and locale='en'`,
  );
  await assert.rejects(() => readGuideEditorialModel(NEW), {
    name: "GuideLegacyError",
  });
  const result = await saveGuideDraft(request(m, "en"), actor);
  assert.deepEqual(result, { ok: false, error: "legacy_invalid" });
});

test("malformed legacy presentation is reported safely instead of overwritten", async () => {
  const m = await model(LEGACY);
  await db
    .delete(guide_locale_content)
    .where(eq(guide_locale_content.guide_id, LEGACY));
  await db.execute(
    sql`delete from guide_shared_content where guide_id=${LEGACY}::uuid`,
  );
  await db
    .update(guide_section)
    .set({ presentation: { version: 99 } })
    .where(eq(guide_section.id, id(21)));
  await assert.rejects(() => readGuideEditorialModel(LEGACY), {
    name: "GuideLegacyError",
  });
  const result = await saveGuideDraft(request(m, "en"), actor);
  assert.deepEqual(result, { ok: false, error: "legacy_invalid" });
});
