import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import {
  deleteContent,
  deleteSlugs,
  loadTranslationRows,
  setSourceContent,
  setTargetTranslation,
  setSlugs,
} from "@core/i18n";
import {
  service,
  service_category,
  service_locale_content,
  service_shared_content,
} from "../schema";
import {
  SERVICE_EDITOR_LOCALES,
  type ServiceEditorialModel,
  type ServiceEnvelope,
  type ServiceEditorialResult,
} from "../editorial-types";
import { emptyServiceEnvelope } from "../locale-content";
import { readServiceEditorialModel } from "../server/locale-model";
import {
  saveServiceDraft,
  publishServiceDraft,
  setServiceArchived,
} from "../server/locale-store";
import { saveServiceCategoryNames } from "../server/category-names";
import {
  getServiceCategoryForEdit,
  listServiceCategoryOptions,
} from "../admin/queries";
import {
  getServiceBySlug,
  listServiceParams,
  listServices,
  listServiceCategories,
} from "../server/queries";
import { loadServicePublications } from "../server/locale-public";

const CAT = "e7800000-0000-4000-8000-000000000001";
const LEGACY = "e7800000-0000-4000-8000-000000000002";
const NEW = "e7800000-0000-4000-8000-000000000003";
const BAD = "e7800000-0000-4000-8000-000000000004";
const ARCHIVE = "e7800000-0000-4000-8000-000000000005";
const MAPS = "e7800000-0000-4000-8000-000000000006";
const PHOTO = "d3000000-0000-4000-8000-000000000001";
const actor = "service-locales-backend";
const slug = "service-locales-backend-new";
let verified = false;
function success(result: ServiceEditorialResult): ServiceEditorialModel {
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("not successful");
  return result.model;
}
async function model(id = NEW) {
  const result = await readServiceEditorialModel(id);
  assert.ok(result);
  return result;
}
function request(
  m: ServiceEditorialModel,
  locale: "en" | "es" | "pt" | "fr",
  payload: ServiceEnvelope,
) {
  return {
    serviceId: m.id,
    locale,
    expectedRevision: m.locales[locale].revision,
    templateRevision: m.locales[locale].templateRevision,
    expectedSharedRevision: m.shared.revision,
    payload,
  };
}
async function save(
  m: ServiceEditorialModel,
  locale: "en" | "es" | "pt" | "fr",
  change: (e: ServiceEnvelope) => void = () => {},
) {
  const e = structuredClone(m.locales[locale].working);
  change(e);
  return success(await saveServiceDraft(request(m, locale, e), actor));
}
async function publish(
  m: ServiceEditorialModel,
  locale: "en" | "es" | "pt" | "fr",
) {
  return success(
    await publishServiceDraft(
      { serviceId: m.id, locale, expectedRevision: m.locales[locale].revision },
      actor,
    ),
  );
}
async function cleanup() {
  for (const id of [LEGACY, NEW, BAD, ARCHIVE, MAPS]) {
    await db.delete(service).where(eq(service.id, id));
    await deleteContent("service", id);
    await deleteSlugs("service", id);
  }
  await db.delete(service_category).where(eq(service_category.id, CAT));
  await deleteContent("service_category", CAT);
}
before(async () => {
  assert.equal(
    new URL(process.env.DATABASE_URL ?? "http://invalid").hostname,
    "propertylocalesqa.local",
  );
  const identity = await db.execute(
    sql`select current_database() as database,current_user as role`,
  );
  assert.deepEqual(identity.rows[0], {
    database: "propertylocalesqa",
    role: "propertylocalesqa",
  });
  verified = true;
  Object.assign(globalThis, {
    __incrementalCache: {
      generateCacheKey: async (key: string) => key,
      get: async () => null,
      set: async () => undefined,
    },
  });
  await cleanup();
  await db
    .insert(service_category)
    .values({ id: CAT, slug: "service-locales-backend-category", icon: "car" });
  await saveServiceCategoryNames(CAT, { name: "Category English" }, actor);
  await setTargetTranslation(
    "service_category",
    CAT,
    "name",
    "es",
    "Categoría pendiente",
    {
      sourceValue: "Category English",
      state: "needs_review",
      updatedBy: actor,
    },
  );
  await setTargetTranslation(
    "service_category",
    CAT,
    "name",
    "pt",
    "Categoria portuguesa",
    { sourceValue: "Category English", state: "approved", updatedBy: actor },
  );
  await db.insert(service).values({
    id: LEGACY,
    slug: "service-locales-backend-legacy",
    status: "published",
    category_id: CAT,
    cover_media_id: PHOTO,
    booking_type: "external",
    cta_url: "https://example.com/book",
    cta_label: "Legacy column CTA",
  });
  await setSlugs("service", LEGACY, {
    en: "service-locales-backend-legacy",
    es: "service-locales-backend-legado",
    pt: "service-locales-backend-portugues",
    fr: "service-locales-backend-legacy",
  });
  const detail = {
    ...emptyServiceEnvelope(CAT).content.detail,
    facts: [{ icon: "clock" as const, title: "Legacy fact" }],
    itinerary: [
      {
        time: "09:00",
        title: "Legacy stop",
        text: "Legacy itinerary",
        media_id: PHOTO,
      },
    ],
  };
  await setSourceContent(
    "service",
    LEGACY,
    {
      name: "Legacy English",
      excerpt: "Legacy excerpt",
      body: "Legacy body",
      meta_title: "Legacy SEO",
      cta_label: "Book legacy",
      detail: JSON.stringify(detail),
      "copy:whatsappCta": "Preserved hidden copy",
    },
    { updatedBy: actor },
  );
  await setTargetTranslation(
    "service",
    LEGACY,
    "name",
    "pt",
    "Legado português",
    { sourceValue: "Legacy English", state: "approved", updatedBy: actor },
  );
  await setTargetTranslation(
    "service",
    LEGACY,
    "meta_title",
    "pt",
    "SEO português",
    { sourceValue: "Legacy SEO", state: "approved", updatedBy: actor },
  );
  await setTargetTranslation(
    "service",
    LEGACY,
    "name",
    "es",
    "Legado pendiente",
    { sourceValue: "Legacy English", state: "needs_review", updatedBy: actor },
  );
});
after(async () => {
  if (verified) await cleanup();
});

test("Legacy GET is read-only; pending targets stay private and lazy bootstrap preserves public snapshots/slugs/hidden copy", async () => {
  const translations = await loadTranslationRows({
    type: "service",
    id: LEGACY,
  });
  let m = await model(LEGACY);
  assert.equal(m.locales.pt.working.content.name, "Legado português");
  assert.equal(m.locales.es.working.content.name, "Legado pendiente");
  assert.equal(m.locales.es.published?.content.name, "Legacy English");
  assert.equal(m.locales.pt.published?.content.meta_title, "SEO português");
  assert.equal(
    m.locales.en.working.content.copy?.whatsappCta,
    "Preserved hidden copy",
  );
  assert.equal(
    (
      await db
        .select()
        .from(service_locale_content)
        .where(eq(service_locale_content.service_id, LEGACY))
    ).length,
    0,
  );
  m = await save(m, "en", (e) => {
    e.content.name = "New unpublished English";
  });
  assert.equal(
    (await getServiceBySlug("en", "service-locales-backend-legacy"))?.name,
    "Legacy English",
  );
  assert.equal(
    (await getServiceBySlug("es", "service-locales-backend-legado"))?.name,
    "Legacy English",
  );
  assert.equal(
    (await getServiceBySlug("pt", "service-locales-backend-portugues"))?.name,
    "Legado português",
  );
  assert.equal(m.slugByLocale.pt, "service-locales-backend-portugues");
  assert.deepEqual(
    await loadTranslationRows({ type: "service", id: LEGACY }),
    translations,
  );
  assert.equal(m.locales.pt.working.localeMode, "custom");
  assert.equal(m.locales.es.draft?.content.name, "Legado pendiente");
});

test("New service drafts/publications are explicit per-language; incomplete drafts save and EN publishes alone", async () => {
  const e = emptyServiceEnvelope(CAT);
  let m = success(
    await saveServiceDraft(
      {
        serviceId: NEW,
        locale: "en",
        expectedRevision: 0,
        templateRevision: null,
        expectedSharedRevision: 0,
        payload: e,
        slug,
      },
      actor,
    ),
  );
  assert.equal(m.status, "draft");
  const rejected = await publishServiceDraft(
    { serviceId: NEW, locale: "en", expectedRevision: m.locales.en.revision },
    actor,
  );
  assert.equal(rejected.ok, false);
  m = await save(m, "en", (e) => {
    e.content.name = "English public";
    e.content.excerpt = "Service excerpt";
    e.content.body = "Service body";
    e.content.cover_media_id = PHOTO;
    e.content.cta_label = "Book English";
    e.content.cta_url = "https://example.com/english";
    e.content.booking_type = "external";
    e.content.meta_title = "English SEO";
    e.content.detail.facts = [
      { id: "fact-first", icon: "clock", title: "First fact" },
      { id: "fact-second", icon: "car", title: "Second fact" },
    ];
    e.content.detail.itinerary = [
      {
        id: "step-first",
        time: "09:00",
        title: "First stop",
        text: "First text",
        media_id: PHOTO,
      },
      {
        id: "step-second",
        time: "10:00",
        title: "Second stop",
        text: "Second text",
      },
    ];
  });
  m = await publish(m, "en");
  assert.equal((await getServiceBySlug("en", slug))?.name, "English public");
  assert.equal(await getServiceBySlug("pt", slug), null);
  const params = (await listServiceParams()).filter((p) => p.slug === slug);
  assert.deepEqual(params, [{ locale: "en", slug }]);
  assert.deepEqual((await getServiceBySlug("en", slug))?.alternateSlugs, {
    en: slug,
  });
  assert.equal(
    (await listServices("pt")).some((row) => row.id === NEW),
    false,
  );
});

test("Inheritance follows saved EN until real localized edit; saved target publication never follows new English drafts", async () => {
  let m = await model();
  m = await save(m, "en", (e) => {
    e.content.name = "English second draft";
  });
  assert.equal(m.locales.pt.working.content.name, "English second draft");
  assert.equal((await getServiceBySlug("en", slug))?.name, "English public");
  m = await save(m, "pt");
  assert.equal(m.locales.pt.draft?.localeMode, "inherit");
  m = await publish(m, "pt");
  assert.equal(
    (await getServiceBySlug("pt", slug))?.name,
    "English second draft",
  );
  m = await save(m, "en", (e) => {
    e.content.name = "English third draft";
  });
  assert.equal(m.locales.pt.working.content.name, "English third draft");
  assert.equal(
    (await getServiceBySlug("pt", slug))?.name,
    "English second draft",
  );
  m = await save(m, "pt", (e) => {
    e.content.name = "Português próprio";
    e.content.meta_title = "SEO próprio";
    e.content.cta_label = "Reservar PT";
    e.content.cta_url = "https://example.com/pt";
    e.content.detail.itinerary[0]!.title = "Primeira parada";
  });
  assert.equal(m.locales.pt.draft?.localeMode, "custom");
  m = await publish(m, "pt");
  const ptBefore = structuredClone(m.locales.pt.published);
  m = await save(m, "en", (e) => {
    e.content.name = "English fourth draft";
    e.content.meta_title = "New English SEO";
  });
  m = await publish(m, "en");
  assert.equal(m.locales.pt.working.content.name, "Português próprio");
  assert.deepEqual(m.locales.pt.published, ptBefore);
  assert.equal(
    (await getServiceBySlug("pt", slug))?.cta?.url,
    "https://example.com/pt",
  );
  assert.equal((await getServiceBySlug("pt", slug))?.metaTitle, "SEO próprio");
});

test("Shared Save overlays nested media/icons by stable identity and preserves target snapshots and localization revision", async () => {
  let m = await model();
  const ptBefore = structuredClone(m.locales.pt);
  m = await save(m, "en", (e) => {
    e.content.detail.facts.reverse();
    e.content.detail.facts.find((f) => f.id === "fact-first")!.icon = "map-pin";
    e.content.detail.itinerary.reverse();
    delete e.content.detail.itinerary.find((s) => s.id === "step-first")!
      .media_id;
    e.content.gallery = [PHOTO];
    e.content.presentation = { version: 1, icons: { service_photos: "car" } };
  });
  assert.deepEqual(m.locales.pt.published, ptBefore.published);
  assert.equal(m.locales.pt.revision, ptBefore.revision);
  const pt = await getServiceBySlug("pt", slug);
  assert.ok(pt);
  assert.equal(pt.detail.itinerary[0]!.title, "Primeira parada");
  assert.equal(pt.detail.itinerary[0]!.media_id, undefined);
  assert.equal(
    pt.detail.facts.find((f) => f.id === "fact-first")!.icon,
    "map-pin",
  );
  assert.equal(pt.presentation?.icons?.service_photos, "car");
  assert.deepEqual(m.shared.content.gallery, [PHOTO]);
  assert.equal(pt.gallery.length, 0); // A gallery id equal to cover is intentionally excluded by the existing public contract.
  // Forged target common choices fail without changing any row or revision.
  const bad = structuredClone(m.locales.pt.working);
  bad.content.detail.facts[0]!.icon = "car";
  assert.equal(
    (await saveServiceDraft(request(m, "pt", bad), actor)).ok,
    false,
  );
  assert.deepEqual(await model(), m);
});

test("Stale locale/template/shared writes fail and unavailable media never reserves a new identity", async () => {
  let m = await model();
  const stale = structuredClone(m);
  m = await save(m, "en", (e) => {
    e.content.name = "Concurrency current";
  });
  assert.deepEqual(
    await saveServiceDraft(
      request(stale, "en", stale.locales.en.working),
      actor,
    ),
    { ok: false, error: "conflict" },
  );
  assert.deepEqual(
    await saveServiceDraft(
      request(stale, "fr", stale.locales.fr.working),
      actor,
    ),
    { ok: false, error: "conflict" },
  );
  assert.deepEqual(await model(), m);
  const bad = emptyServiceEnvelope(CAT);
  bad.content.cover_media_id = BAD;
  assert.equal(
    (
      await saveServiceDraft(
        {
          serviceId: BAD,
          locale: "en",
          expectedRevision: 0,
          templateRevision: null,
          expectedSharedRevision: 0,
          payload: bad,
          slug: "service-locales-invalid-media",
        },
        actor,
      )
    ).ok,
    false,
  );
  assert.equal(await readServiceEditorialModel(BAD), null);
});

test("Category raw pending/manual approved names and empty fallbacks update all public names without republishing Services", async () => {
  const before = await db
    .select()
    .from(service_locale_content)
    .where(eq(service_locale_content.service_id, NEW));
  assert.deepEqual((await getServiceCategoryForEdit(CAT))?.translations, {
    es: "Categoría pendiente",
    pt: "Categoria portuguesa",
    fr: "",
  });
  assert.equal(
    (await listServiceCategoryOptions()).find((row) => row.id === CAT)?.names
      ?.es,
    "Category English",
  );
  await saveServiceCategoryNames(
    CAT,
    {
      name: "Category English renamed",
      translations: {
        es: "Categoría manual",
        pt: "Categoria manual",
        fr: "Catégorie manuelle",
      },
    },
    actor,
  );
  for (const [locale, name] of [
    ["en", "Category English renamed"],
    ["es", "Categoría manual"],
    ["pt", "Categoria manual"],
    ["fr", "Catégorie manuelle"],
  ] as const)
    assert.equal(
      (await listServiceCategories(locale)).find((row) => row.id === CAT)?.name,
      name,
    );
  assert.equal(
    (await getServiceBySlug("pt", slug))?.category.name,
    "Categoria manual",
  );
  await saveServiceCategoryNames(
    CAT,
    {
      name: "Final English category",
      translations: { es: "", pt: "Categoria manual", fr: "" },
    },
    actor,
  );
  assert.equal(
    (await listServiceCategoryOptions()).find((row) => row.id === CAT)?.names
      ?.es,
    "Final English category",
  );
  const targets = (
    await loadTranslationRows({ type: "service_category", id: CAT })
  ).filter((row) => row.locale !== "en");
  await saveServiceCategoryNames(CAT, { name: "Older client English" }, actor);
  assert.deepEqual(
    (await loadTranslationRows({ type: "service_category", id: CAT })).filter(
      (row) => row.locale !== "en",
    ),
    targets,
  );
  assert.deepEqual(
    await db
      .select()
      .from(service_locale_content)
      .where(eq(service_locale_content.service_id, NEW)),
    before,
  );
});

test("Archive keeps drafts/publications; archived Save retains archive, Restore consumes none and Publish reactivates only selected locale", async () => {
  let m = await model();
  const ptPublished = structuredClone(m.locales.pt.published);
  m = success(await setServiceArchived(NEW, true, actor));
  assert.equal(m.status, "archived");
  assert.equal(await getServiceBySlug("pt", slug), null);
  m = await save(m, "en", (e) => {
    e.content.name = "Saved while archived";
  });
  assert.equal(m.status, "archived");
  const enDraft = structuredClone(m.locales.en.draft);
  m = success(await setServiceArchived(NEW, false, actor));
  assert.equal(m.status, "published");
  assert.deepEqual(m.locales.en.draft, enDraft);
  assert.deepEqual(m.locales.pt.published, ptPublished);
  m = success(await setServiceArchived(NEW, true, actor));
  m = await publish(m, "en");
  assert.equal(m.status, "published");
  assert.equal(
    (await getServiceBySlug("en", slug))?.name,
    "Saved while archived",
  );
  assert.deepEqual(m.locales.pt.published, ptPublished);
});

test("Malformed shared JSON blocks safe admin reads and fails public publication closed", async () => {
  const [stored] = await db
    .select()
    .from(service_shared_content)
    .where(eq(service_shared_content.service_id, NEW));
  assert.ok(stored);
  await db
    .update(service_shared_content)
    .set({
      data: {
        ...stored.data,
        content: {
          ...stored.data.content,
          itineraryMedia: { bad: "invalid-id" },
        },
      },
    })
    .where(eq(service_shared_content.service_id, NEW));
  await assert.rejects(
    () => readServiceEditorialModel(NEW),
    /cannot be read safely/,
  );
  assert.equal((await loadServicePublications([NEW], "en")).get(NEW), null);
  await db
    .update(service_shared_content)
    .set({ data: stored.data })
    .where(eq(service_shared_content.service_id, NEW));
});

test("Archiving an untouched legacy published identity bootstraps its old publications before hiding it", async () => {
  await db.insert(service).values({
    id: ARCHIVE,
    slug: "service-locales-backend-archive",
    status: "published",
    category_id: CAT,
    cover_media_id: PHOTO,
  });
  await setSlugs("service", ARCHIVE, {
    en: "service-locales-backend-archive",
    pt: "service-locales-backend-arquivo",
  });
  await setSourceContent(
    "service",
    ARCHIVE,
    {
      name: "Legacy archive",
      excerpt: "Archive excerpt",
      body: "Archive body",
    },
    { updatedBy: actor },
  );
  assert.equal(
    (
      await db
        .select()
        .from(service_locale_content)
        .where(eq(service_locale_content.service_id, ARCHIVE))
    ).length,
    0,
  );
  let archived = success(await setServiceArchived(ARCHIVE, true, actor));
  assert.equal(archived.status, "archived");
  assert.equal(archived.locales.en.published?.content.name, "Legacy archive");
  assert.equal(archived.locales.pt.published?.content.name, "Legacy archive");
  archived = success(await setServiceArchived(ARCHIVE, false, actor));
  assert.equal(archived.status, "published");
  assert.equal(
    (await getServiceBySlug("pt", "service-locales-backend-arquivo"))?.name,
    "Legacy archive",
  );
});

test("Complete common maps save a target-only itinerary image from EN and validate inactive image references", async () => {
  const mapSlug = "service-locales-backend-common-maps";
  await db.insert(service).values({
    id: MAPS,
    slug: mapSlug,
    status: "published",
    category_id: CAT,
    cover_media_id: PHOTO,
  });
  await setSlugs("service", MAPS, { en: mapSlug, pt: mapSlug });
  const en = emptyServiceEnvelope(CAT);
  Object.assign(en.content, {
    name: "Common maps English",
    excerpt: "Common maps excerpt",
    body: "Common maps body",
    cover_media_id: PHOTO,
  });
  const pt = structuredClone(en);
  pt.content.name = "Common maps português";
  pt.content.detail.itinerary = [
    {
      id: "target-only-step",
      time: "09:00",
      title: "Parada própria",
      text: "Texto próprio",
    },
  ];
  await db.insert(service_locale_content).values(
    SERVICE_EDITOR_LOCALES.map((locale) => ({
      service_id: MAPS,
      locale,
      published: locale === "pt" ? pt : en,
      revision: 1,
    })),
  );
  let current = await model(MAPS);
  const shared = structuredClone(current.shared.content);
  shared.itineraryMedia["target-only-step"] = PHOTO;
  const fullRequest = {
    ...request(current, "en", current.locales.en.working),
    shared,
  };
  current = success(await saveServiceDraft(fullRequest, actor));
  assert.equal(
    current.shared.content.itineraryMedia["target-only-step"],
    PHOTO,
  );
  const publicTarget = await getServiceBySlug("pt", mapSlug);
  assert.ok(publicTarget);
  assert.equal(publicTarget.detail.itinerary[0]!.title, "Parada própria");
  assert.equal(publicTarget.detail.itinerary[0]!.media_id, PHOTO);
  const mismatched = structuredClone(current.shared.content);
  mismatched.position += 1;
  assert.equal(
    (
      await saveServiceDraft(
        {
          ...request(current, "en", current.locales.en.working),
          shared: mismatched,
        },
        actor,
      )
    ).ok,
    false,
  );
  const mismatchedStep = structuredClone(current.locales.pt.working);
  delete mismatchedStep.content.detail.itinerary[0]!.media_id;
  assert.equal(
    (
      await saveServiceDraft(
        {
          ...request(current, "pt", mismatchedStep),
          shared: current.shared.content,
        },
        actor,
      )
    ).ok,
    false,
  );
  const invalidShared = structuredClone(current.shared.content);
  invalidShared.itineraryMedia["inactive-step"] = BAD;
  const rejected = await saveServiceDraft(
    {
      ...request(current, "en", current.locales.en.working),
      shared: invalidShared,
    },
    actor,
  );
  assert.equal(rejected.ok, false);
  assert.deepEqual(await model(MAPS), current);
  const forged = structuredClone(current.shared.content);
  forged.factIcons["invisible-fact"] = "car";
  assert.equal(
    (
      await saveServiceDraft(
        {
          ...request(current, "pt", current.locales.pt.working),
          shared: forged,
        },
        actor,
      )
    ).ok,
    false,
  );
});
