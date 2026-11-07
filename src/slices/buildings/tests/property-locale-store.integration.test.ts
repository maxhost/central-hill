import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { setSlugs, loadTranslationRows } from "@core/i18n";
import type {
  PropertyEditorialResult,
  PropertyLocaleModel,
} from "@slices/backoffice/contract";
import type {
  BuildingEditorialContent,
  BuildingEnvelope,
} from "../editorial-types";
import { building, building_locale_content } from "../schema";
import {
  saveBuildingDraft,
  publishBuildingDraft,
  commitBuildingLocale,
  getBuildingLocaleScope,
  validateBuildingReferences,
  getBuildingSharedState,
} from "../server/editorial-store";
import {
  readBuildingIdentity,
  readBuildingLocaleRows,
  legacyBuildingLocaleRows,
  bootstrapBuildingLocales,
  PropertyLegacyError,
} from "../server/editorial-bootstrap";
import { buildingLocaleModel } from "../server/editorial-model";
import { emptyBuildingEnvelope } from "../server/editorial-validation";
const CITY = "d1000000-0000-4000-8000-000000000001",
  MEDIA = "d3000000-0000-4000-8000-000000000001";
const NEW = "e4100000-0000-4000-8000-000000000001",
  LEGACY = "e4100000-0000-4000-8000-000000000002",
  BROKEN = "e4100000-0000-4000-8000-000000000003",
  RETRY = "e4100000-0000-4000-8000-000000000004",
  PENDING_SHARED = "e4100000-0000-4000-8000-000000000005";
const actor = "propertylocalesqa-buildings-backend";
let verified = false;
type Model = PropertyLocaleModel<BuildingEditorialContent>;
function success(
  result: PropertyEditorialResult<BuildingEditorialContent>,
): Model {
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw Error("Mutation failed");
  return result.model;
}
async function model(id: string, locale: "en" | "es" | "pt" | "fr" = "en") {
  const identity = await readBuildingIdentity(id);
  assert.ok(identity);
  return buildingLocaleModel(
    await readBuildingLocaleRows(identity),
    locale,
    emptyBuildingEnvelope(identity.city_id),
  );
}
const complete = (envelope: BuildingEnvelope, name: string) => ({
  ...structuredClone(envelope),
  content: {
    ...structuredClone(envelope.content),
    name,
    teaser: `${name} teaser`,
    street_address: "QA street",
    city_id: CITY,
  },
});
const save = async (
  id: string,
  current: Model,
  payload = current.working,
  common = current.locale === "en",
) =>
  saveBuildingDraft(
    {
      id,
      locale: current.locale,
      expectedRevision: current.revision,
      templateRevision: current.templateRevision,
      expectedSharedRevision: (await getBuildingSharedState(id))?.revision ?? 0,
      sharedChanged: common,
      payload,
    },
    actor,
  );
const publish = (id: string, current: Model) =>
  publishBuildingDraft(
    { id, locale: current.locale, expectedRevision: current.revision },
    actor,
  );
async function cleanup() {
  for (const id of [NEW, LEGACY, BROKEN, RETRY, PENDING_SHARED]) {
    await db.execute(sql`delete from building where id=${id}::uuid`);
    await db.execute(sql`delete from translation where entity_id=${id}::uuid`);
    await db.execute(sql`delete from slug where entity_id=${id}::uuid`);
  }
}
before(async () => {
  // Standalone Node has no Next request runtime. Keep the production resolver
  // and its real DB queries; this adapter simply bypasses the cache storage.
  Object.assign(globalThis, {
    __incrementalCache: {
      generateCacheKey: async (key: string) => key,
      get: async () => null,
      set: async () => undefined,
    },
  });

  assert.equal(
    new URL(process.env.DATABASE_URL ?? "http://invalid.test").hostname,
    "propertylocalesqa.local",
  );
  const identity = await db.execute(
    sql`select current_database()as database,current_user as role`,
  );
  assert.deepEqual(identity.rows[0], {
    database: "propertylocalesqa",
    role: "propertylocalesqa",
  });
  verified = true;
  await validateBuildingReferences(emptyBuildingEnvelope(CITY));
  await cleanup();
});
after(async () => {
  if (verified) await cleanup();
});
test("First save persists incomplete EN only, four invisible rows, stable retry identity and immutable slug", async () => {
  const payload = emptyBuildingEnvelope(CITY);
  const input = {
    id: NEW,
    locale: "en" as const,
    expectedRevision: 0,
    templateRevision: null,
    payload,
    slug: "propertylocales-backend-building",
  };
  const first = success(await saveBuildingDraft(input, actor));
  assert.equal(first.revision, 1);
  const rows = await db
    .select()
    .from(building_locale_content)
    .where(eq(building_locale_content.building_id, NEW));
  assert.equal(rows.length, 4);
  assert.ok(rows.every((row) => row.published === null));
  assert.deepEqual((await model(NEW)).draft, {
    ...payload,
    localeMode: "custom",
  });
  assert.deepEqual(await saveBuildingDraft(input, actor), {
    ok: false,
    error: "conflict",
  });
  assert.equal((await publish(NEW, first)).ok, false);
  const renamed = await saveBuildingDraft(
    { ...input, expectedRevision: 1, slug: "renamed" },
    actor,
  );
  assert.equal(renamed.ok, false);
});
test("ES publishes before EN, public scope does not read children and EN publication cannot mutate ES", async () => {
  const en = await model(NEW);
  const enSaved = success(await save(NEW, en, complete(en.working, "English")));
  const es = await model(NEW, "es");
  const payload = {
    ...complete(es.working, "Español"),
    localeMode: "custom" as const,
  };
  payload.content.booking_button = { label: "Reservar", link: "https://example.test/es" };
  const esSaved = success(await save(NEW, es, payload));
  const published = success(await publish(NEW, esSaved));
  assert.equal(published.draft, null);
  assert.equal((await getBuildingLocaleScope(NEW, "en"))?.published, false);
  assert.deepEqual(await getBuildingLocaleScope(NEW, "es"), {
    id: NEW,
    archived: false,
    published: true,
    bookingUrl: "https://example.test/es",
  });
  const esBefore = (
    await readBuildingLocaleRows((await readBuildingIdentity(NEW))!)
  ).find((row) => row.locale === "es");
  success(await publish(NEW, enSaved));
  assert.deepEqual(
    (await readBuildingLocaleRows((await readBuildingIdentity(NEW))!)).find(
      (row) => row.locale === "es",
    ),
    esBefore,
  );
});
test("Concurrent same-locale writers enforce CAS and never resurrect cleared drafts", async () => {
  const en = await model(NEW);
  const results = await Promise.all([
    save(NEW, en, complete(en.working, "Writer A")),
    save(NEW, en, complete(en.working, "Writer B")),
  ]);
  assert.equal(results.filter((r) => r.ok).length, 1);
  assert.ok(results.some((r) => !r.ok && r.error === "conflict"));
  const current = await model(NEW);
  success(await publish(NEW, current));
  assert.equal(
    await commitBuildingLocale({
      id: NEW,
      locale: "en",
      revision: current.revision,
      payload: current.working,
      actor,
    }),
    false,
  );
  assert.equal((await model(NEW)).draft, null);
});
test("Any locale can Save global common data, stale text-only Save retains it, shared CAS is atomic", async () => {
  const es = await model(NEW, "es");
  const before = await getBuildingSharedState(NEW);
  const document = structuredClone(es.working);
  document.content.cover_media_id = MEDIA;
  document.content.street_address = "Shared new address";
  const commonSave = await save(NEW, es, document, true);
  const saved = success(commonSave);
  assert.equal(
    (await getBuildingSharedState(NEW))?.content.cover_media_id,
    MEDIA,
  );
  const publication = (await model(NEW, "es")).published;
  assert.notEqual(publication?.content.street_address, "Shared new address");
  const stale = await saveBuildingDraft(
    {
      id: NEW,
      locale: "es",
      expectedRevision: saved.revision,
      templateRevision: null,
      payload: document,
      sharedChanged: true,
      expectedSharedRevision: before!.revision,
    },
    actor,
  );
  assert.deepEqual(stale, { ok: false, error: "conflict" });
  assert.equal((await model(NEW, "es")).revision, saved.revision);
  const en = await model(NEW);
  en.working.content.cover_media_id = null;
  en.working.content.name = "Text only English";
  const textSave = success(await save(NEW, en, en.working, false));
  assert.equal(textSave.working.content.cover_media_id, MEDIA);
  assert.equal(
    (await getBuildingSharedState(NEW))?.content.street_address,
    "Shared new address",
  );
  const bad = structuredClone(textSave.working);
  bad.content.cover_media_id = "e3100000-0000-4000-8000-000000000099";
  assert.equal((await save(NEW, textSave, bad, true)).ok, false);
});
test("Inherited drafts track EN in workspace, require resave after text change, and survive EN Publish with unchanged text", async () => {
  let fr = await model(NEW, "fr");
  assert.equal(fr.working.localeMode, "inherit");
  const inherited = success(await save(NEW, fr, fr.working, false));
  const en = await model(NEW);
  const update = structuredClone(en.working);
  update.content.name = "New English source";
  const latest = success(await save(NEW, en, update, false));
  assert.deepEqual(await publish(NEW, inherited), {
    ok: false,
    error: "conflict",
  });
  fr = await model(NEW, "fr");
  assert.equal(fr.working.content.name, "New English source");
  const refreshed = success(await save(NEW, fr, fr.working, false));
  success(await publish(NEW, latest));
  const final = success(await publish(NEW, refreshed));
  assert.equal(final.published?.content.name, "New English source");
});
test("Legacy bootstrap captures four resolved publications and pending draft without changing translations or slugs", async () => {
  await db.insert(building).values({
    id: LEGACY,
    slug: "propertylocales-backend-legacy",
    status: "published",
    city_id: CITY,
    avantio_url: "https://example.test/base",
  });
  await setSlugs("building", LEGACY, {
    en: "propertylocales-backend-legacy",
    es: "propertylocales-backend-legado",
    pt: "propertylocales-backend-legado-pt",
    fr: "propertylocales-backend-ancien",
  });
  for (const [locale, value, state] of [
    ["en", "Legacy EN", "draft"],
    ["es", "Legado ES", "approved"],
    ["pt", "Pendente PT", "needs_review"],
  ])
    await db.execute(
      sql`insert into translation(entity_type,entity_id,field,locale,value,state)values('building',${LEGACY}::uuid,'name',${locale},${value},${state})`,
    );
  const identity = (await readBuildingIdentity(LEGACY))!;
  const baseline = await legacyBuildingLocaleRows(identity);
  assert.equal(
    baseline.find((row) => row.locale === "es")?.published?.content.name,
    "Legado ES",
  );
  const pt = baseline.find((row) => row.locale === "pt")!;
  assert.equal(pt.draft?.localeMode, "custom");
  assert.equal(
    baseline.find((row) => row.locale === "fr")?.published?.localeMode,
    "inherit",
  );
  assert.equal(pt.published?.content.name, "Legacy EN");
  assert.equal(pt.draft?.content.name, "Pendente PT");
  assert.ok(
    baseline.every(
      (row) =>
        row.published?.content.default_booking_url ===
        "https://example.test/base",
    ),
  );
  const before = await loadTranslationRows({ type: "building", id: LEGACY });
  await bootstrapBuildingLocales(identity, actor);
  const initial = await readBuildingLocaleRows(identity);
  await bootstrapBuildingLocales(identity, actor);
  assert.deepEqual(await readBuildingLocaleRows(identity), initial);
  assert.deepEqual(
    await loadTranslationRows({ type: "building", id: LEGACY }),
    before,
  );
  for (const row of baseline)
    assert.deepEqual(
      initial.find((r) => r.locale === row.locale)?.published,
      row.published,
    );
});
test("Invalid legacy blocks bootstrap, while present null publication never falls back; slug retry corrects only virgin identity", async () => {
  await db.insert(building).values({
    id: BROKEN,
    slug: "propertylocales-backend-broken",
    status: "published",
    city_id: CITY,
    avantio_url: "javascript:invalid",
  });
  await assert.rejects(
    async () =>
      bootstrapBuildingLocales(
        { ...(await readBuildingIdentity(BROKEN))! },
        actor,
      ),
    PropertyLegacyError,
  );
  assert.equal(
    (
      await db
        .select()
        .from(building_locale_content)
        .where(eq(building_locale_content.building_id, BROKEN))
    ).length,
    0,
  );
  await db
    .insert(building_locale_content)
    .values({ building_id: LEGACY, locale: "en", published: null, draft: null })
    .onConflictDoUpdate({
      target: [
        building_locale_content.building_id,
        building_locale_content.locale,
      ],
      set: { published: null, draft: null },
    });
  assert.equal((await getBuildingLocaleScope(LEGACY, "en"))?.published, false);
  const input = {
    id: RETRY,
    locale: "en" as const,
    expectedRevision: 0,
    templateRevision: null,
    payload: emptyBuildingEnvelope(CITY),
    slug: "propertylocales-backend-building",
  };
  assert.deepEqual(await saveBuildingDraft(input, actor), {
    ok: false,
    error: "slug_conflict",
  });
  const saved = success(
    await saveBuildingDraft(
      { ...input, slug: "propertylocales-backend-retry" },
      actor,
    ),
  );
  assert.equal(saved.revision, 1);
});

test("Old English common drafts must Save before a direct Publish can expose shared changes", async () => {
  await db
    .insert(building)
    .values({
      id: PENDING_SHARED,
      slug: "propertyforms-pending-common",
      status: "published",
      city_id: CITY,
    });
  await setSlugs("building", PENDING_SHARED, {
    en: "propertyforms-pending-common",
  });
  const published = {
    ...complete(emptyBuildingEnvelope(CITY), "Existing English"),
    localeMode: "custom" as const,
  };
  const draft = structuredClone(published);
  draft.content.cover_media_id = MEDIA;
  draft.content.street_address = "Pending common address";
  await db
    .insert(building_locale_content)
    .values([
      {
        building_id: PENDING_SHARED,
        locale: "en",
        published,
        draft,
        revision: 1,
      },
      ...(["es", "pt", "fr"] as const).map((locale) => ({
        building_id: PENDING_SHARED,
        locale,
        revision: 0,
      })),
    ]);
  const old = await model(PENDING_SHARED);
  assert.deepEqual(await publish(PENDING_SHARED, old), {
    ok: false,
    error: "validation",
    fieldErrors: { _source: "Save shared changes before publishing." },
  });
  const unchanged = await model(PENDING_SHARED);
  assert.equal(unchanged.revision, 1);
  assert.equal(unchanged.published?.content.cover_media_id, null);
  assert.equal(unchanged.draft?.content.cover_media_id, MEDIA);
  assert.equal(
    (await getBuildingSharedState(PENDING_SHARED))?.content.cover_media_id,
    null,
  );
  const saved = success(await save(PENDING_SHARED, old, draft, true));
  assert.equal(
    (await getBuildingSharedState(PENDING_SHARED))?.content.cover_media_id,
    MEDIA,
  );
  success(await publish(PENDING_SHARED, saved));
});
