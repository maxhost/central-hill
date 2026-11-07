import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import {
  apartment,
  apartment_locale_content,
  apartment_shared_content,
} from "../schema";
import {
  apartmentIdentityGuardSql,
  archiveApartmentIdentity,
  commitApartmentLocale,
  getPublishedApartmentStats,
  publishApartmentDraft,
  saveApartmentDraft,
} from "../server/editorial-store";
import {
  bootstrapApartmentLocales,
  legacyApartmentLocaleRows,
  readApartmentIdentity,
  readApartmentLocaleRows,
} from "../server/editorial-bootstrap";
import { apartmentLocaleModel } from "../server/editorial-model";
import {
  emptyApartmentEnvelope,
  apartmentSharedContent,
} from "../server/editorial-validation";
import { readApartmentSharedState } from "../server/shared-content";
import { listPublishedApartments } from "../server/queries";
import { recomputeBuildingStats } from "../server/stats";
import type { ApartmentEditorialContent } from "../editorial-types";
import type { Locale } from "@core/db/columns";
import type {
  PropertyEditorialResult,
  PropertyLocaleModel,
} from "@slices/backoffice/contract";
// This task owns e42/e52 only; existing d*/f*/c* fixtures remain untouched.
const PARENT = "e4200000-0000-4000-8000-000000000001",
  UNIT = "e5200000-0000-4000-8000-000000000001",
  LEGACY = "e5200000-0000-4000-8000-000000000002";
const ROOT_PARENT = "d4000000-0000-4000-8000-000000000001",
  PHOTO = "d3000000-0000-4000-8000-000000000001",
  actor = "property-forms-apartments-backend";
let verified = false;
function success(result: PropertyEditorialResult<ApartmentEditorialContent>) {
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw Error("Unexpected failure");
  return result.model;
}
async function bundle(id: string) {
  const identity = await readApartmentIdentity(id);
  assert.ok(identity);
  const rows = await readApartmentLocaleRows(identity);
  return {
    identity,
    rows,
    shared: await readApartmentSharedState(identity, rows),
  };
}
async function model(id: string, locale: Locale = "en") {
  const { rows, shared } = await bundle(id);
  return apartmentLocaleModel(rows, locale, shared);
}
async function save(
  id: string,
  current: PropertyLocaleModel<ApartmentEditorialContent>,
  payload = current.working,
  sharedChanged = false,
  revision?: number,
) {
  const { shared } = await bundle(id);
  return saveApartmentDraft(
    {
      id,
      parentId: PARENT,
      locale: current.locale,
      expectedRevision: current.revision,
      templateRevision: current.templateRevision,
      payload,
      sharedChanged,
      expectedSharedRevision: revision ?? shared.revision,
    },
    actor,
  );
}
const publish = (
  id: string,
  current: PropertyLocaleModel<ApartmentEditorialContent>,
) =>
  publishApartmentDraft(
    {
      id,
      parentId: PARENT,
      locale: current.locale,
      expectedRevision: current.revision,
    },
    actor,
  );
async function cleanup() {
  await db.execute(
    sql`delete from apartment where id in (${UNIT}::uuid,${LEGACY}::uuid)`,
  );
  await db.execute(
    sql`delete from translation where entity_type='apartment' and entity_id in (${UNIT}::uuid,${LEGACY}::uuid)`,
  );
  await db.execute(
    sql`delete from slug where entity_type='apartment' and entity_id in (${UNIT}::uuid,${LEGACY}::uuid)`,
  );
  await db.execute(sql`delete from building where id=${PARENT}::uuid`);
}
before(async () => {
  assert.equal(
    new URL(process.env.DATABASE_URL ?? "http://invalid.test").hostname,
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
  await cleanup();
  await db.execute(
    sql`insert into building(id,slug,status,city_id) select ${PARENT}::uuid,'apartment-forms-backend-parent','published',city_id from building where id=${ROOT_PARENT}::uuid`,
  );
});
after(async () => {
  if (verified) await cleanup();
});
test("first incomplete EN save keeps a stable identity and all locales private, with CAS and immutable parent", async () => {
  const payload = emptyApartmentEnvelope();
  const request = {
    id: UNIT,
    parentId: PARENT,
    locale: "en" as const,
    expectedRevision: 0,
    templateRevision: null,
    payload,
    sharedChanged: true,
    expectedSharedRevision: 0,
  };
  const saved = success(await saveApartmentDraft(request, actor));
  assert.equal(saved.revision, 1);
  const { rows, shared } = await bundle(UNIT);
  assert.equal(rows.length, 4);
  assert.ok(rows.every((row) => !row.published));
  assert.equal(shared.revision, 1);
  assert.equal(saved.draft?.localeMode, "custom");
  assert.deepEqual(saved.draft?.content, payload.content);
  assert.deepEqual(await saveApartmentDraft(request, actor), {
    ok: false,
    error: "conflict",
  });
  assert.deepEqual(
    await saveApartmentDraft(
      { ...request, parentId: ROOT_PARENT, expectedRevision: 1 },
      actor,
    ),
    { ok: false, error: "not_found" },
  );
  assert.equal((await readApartmentIdentity(UNIT))?.building_id, PARENT);
  assert.deepEqual(await listPublishedApartments("en", PARENT), []);
  assert.equal((await publish(UNIT, saved)).ok, false);
});
test("inherited work follows saved EN, own PT stays independent and every publication remains explicit", async () => {
  let en = await model(UNIT);
  const complete = structuredClone(en.working);
  Object.assign(complete.content, {
    name: "English",
    max_guests: 4,
    beds_count: 3,
    meta_title: "EN SEO",
    default_booking_url: "https://example.test/base",
  });
  en = success(await save(UNIT, en, complete, true));
  let es = success(await save(UNIT, await model(UNIT, "es")));
  assert.equal(es.draft?.localeMode, "inherit");
  es = success(await publish(UNIT, es));
  assert.equal((await model(UNIT)).published, null);
  assert.equal((await model(UNIT, "fr")).published, null);
  let pt = await model(UNIT, "pt");
  const own = { ...structuredClone(pt.working), localeMode: "custom" as const };
  Object.assign(own.content, {
    name: "Português",
    meta_title: "PT SEO",
    booking_url: "https://example.test/pt",
  });
  pt = success(await save(UNIT, pt, own));
  pt = success(await publish(UNIT, pt));
  assert.equal(
    (await listPublishedApartments("pt", PARENT))[0]?.name,
    "Português",
  );
  const next = structuredClone(en.working);
  next.content.name = "Updated English";
  next.content.meta_title = "Updated EN SEO";
  en = success(await save(UNIT, en, next));
  assert.equal(
    (await model(UNIT, "es")).working.content.name,
    "Updated English",
  );
  assert.equal(
    (await listPublishedApartments("es", PARENT))[0]?.name,
    "English",
  );
  assert.equal((await model(UNIT, "pt")).working.content.name, "Português");
  assert.equal((await model(UNIT, "pt")).working.content.meta_title, "PT SEO");
  assert.equal(
    (await model(UNIT, "pt")).working.content.booking_url,
    "https://example.test/pt",
  );
  assert.deepEqual(await publish(UNIT, await model(UNIT, "fr")), {
    ok: false,
    error: "no_draft",
  });
  // An inherited draft saved before a source edit cannot be published accidentally.
  es = success(await save(UNIT, await model(UNIT, "es")));
  const later = structuredClone(en.working);
  later.content.name = "Latest English";
  en = success(await save(UNIT, en, later));
  assert.deepEqual(await publish(UNIT, es), { ok: false, error: "conflict" });
  es = success(await save(UNIT, await model(UNIT, "es")));
  en = success(await publish(UNIT, en)); // source revision changes but semantic text does not
  es = success(await publish(UNIT, es));
  assert.equal(es.published?.content.name, "Latest English");
  assert.equal((await model(UNIT, "fr")).published, null);
});
test("shared Save is live in every published locale without publishing texts; stale common copies and CAS cannot undo it", async () => {
  const before = await bundle(UNIT),
    ptBefore = before.rows.find((row) => row.locale === "pt");
  const es = await model(UNIT, "es"),
    changed = structuredClone(es.working);
  changed.content.max_guests = 7;
  changed.content.beds_count = 5;
  changed.content.cover_media_id = PHOTO;
  changed.content.name = "Unpublished ES copy";
  changed.localeMode = "custom";
  const saved = success(await save(UNIT, es, changed, true));
  for (const locale of ["en", "es", "pt"] as const) {
    const [unit] = await listPublishedApartments(locale, PARENT);
    assert.equal(unit?.maxGuests, 7);
    assert.equal(unit?.bedsCount, 5);
    assert.ok(unit?.cover);
    assert.notEqual(unit?.name, "Unpublished ES copy");
    assert.deepEqual(await getPublishedApartmentStats(PARENT, locale), {
      apartments: 1,
      capacity: 7,
      beds: 5,
    });
  }
  const after = await bundle(UNIT);
  assert.deepEqual(
    after.rows.find((row) => row.locale === "pt"),
    ptBefore,
  );
  assert.deepEqual(apartmentSharedContent(saved.working), after.shared.content);
  const stalePT = apartmentLocaleModel(before.rows, "pt", before.shared);
  const textOnly = structuredClone(stalePT.working);
  textOnly.content.meta_description = "Private PT SEO";
  const textSaved = success(
    await save(UNIT, stalePT, textOnly, false, before.shared.revision),
  );
  assert.equal(textSaved.working.content.max_guests, 7);
  assert.equal(textSaved.working.content.cover_media_id, PHOTO);
  const attempted = structuredClone(textSaved.working);
  attempted.content.max_guests = 99;
  attempted.content.name = "Must not save";
  assert.deepEqual(
    await save(UNIT, textSaved, attempted, true, before.shared.revision),
    { ok: false, error: "conflict" },
  );
  assert.notEqual(
    (await model(UNIT, "pt")).draft?.content.name,
    "Must not save",
  );
  const en = await model(UNIT),
    candidate = structuredClone(en.working);
  candidate.content.bedrooms = 3;
  const requests = await Promise.all([
    save(UNIT, en, candidate, true),
    save(UNIT, en, en.working, false),
  ]);
  assert.equal(requests.filter((result) => result.ok).length, 1);
  await recomputeBuildingStats(PARENT);
  const stats = await db.execute(
    sql`select apartments_count,total_capacity,beds_count from building where id=${PARENT}::uuid`,
  );
  assert.deepEqual(stats.rows[0], {
    apartments_count: 1,
    total_capacity: 7,
    beds_count: 5,
  });
});
test("legacy ownership and pending text survive read-only fallback/bootstrap; archive hides identity but preserves localized documents", async () => {
  await db.insert(apartment).values({
    id: LEGACY,
    building_id: PARENT,
    slug: "apartment-forms-legacy",
    status: "published",
    max_guests: 2,
    beds_count: 1,
  });
  await db.execute(sql`insert into translation(entity_type,entity_id,field,locale,value,state)values
    ('apartment',${LEGACY}::uuid,'name','en','Legacy EN','draft'),('apartment',${LEGACY}::uuid,'name','es','Legado ES','approved'),
    ('apartment',${LEGACY}::uuid,'badge','fr','Brouillon FR','needs_review')`);
  const identity = (await readApartmentIdentity(LEGACY))!,
    baseline = await legacyApartmentLocaleRows(identity);
  assert.equal(
    baseline.find((row) => row.locale === "es")?.published?.localeMode,
    "custom",
  );
  assert.equal(
    baseline.find((row) => row.locale === "pt")?.published?.localeMode,
    "inherit",
  );
  assert.equal(
    baseline.find((row) => row.locale === "fr")?.draft?.localeMode,
    "custom",
  );
  const read = await bundle(LEGACY);
  assert.equal(read.shared.revision, 0);
  assert.equal(
    (
      await db
        .select()
        .from(apartment_shared_content)
        .where(eq(apartment_shared_content.apartment_id, LEGACY))
    ).length,
    0,
  );
  assert.equal(
    (
      await db
        .select()
        .from(apartment_locale_content)
        .where(eq(apartment_locale_content.apartment_id, LEGACY))
    ).length,
    0,
  );
  await bootstrapApartmentLocales(identity, actor);
  const rows = await readApartmentLocaleRows(identity);
  assert.equal(
    rows.find((row) => row.locale === "fr")?.draft?.content.badge,
    "Brouillon FR",
  );
  // Before the shared table is initialized, an old EN draft is the only copy
  // of its pending photos. A direct action must preserve it just like the UI.
  await db.execute(sql`update apartment_locale_content
    set draft=jsonb_set(published,'{content,cover_media_id}',to_jsonb(${PHOTO}::text)),revision=1
    where apartment_id=${LEGACY}::uuid and locale='en'`);
  const pendingCommon = await bundle(LEGACY);
  assert.equal(pendingCommon.shared.content.cover_media_id, null);
  assert.equal(pendingCommon.shared.working?.cover_media_id, PHOTO);
  assert.deepEqual(await publish(LEGACY, await model(LEGACY)), {
    ok: false,
    error: "validation",
    fieldErrors: { _source: "Save shared changes before publishing." },
  });
  const afterRejectedPublish = await bundle(LEGACY);
  assert.deepEqual(afterRejectedPublish.rows, pendingCommon.rows);
  assert.equal(afterRejectedPublish.shared.working?.cover_media_id, PHOTO);
  assert.equal(
    (
      await db
        .select()
        .from(apartment_shared_content)
        .where(eq(apartment_shared_content.apartment_id, LEGACY))
    ).length,
    0,
  );
  // Old snapshots with revisions and no localeMode are custom even if text equals English.
  await db.execute(
    sql`update apartment_locale_content set draft=jsonb_build_object('schemaVersion',1,'content',published->'content'),revision=2 where apartment_id=${LEGACY}::uuid and locale='pt'`,
  );
  assert.equal((await model(LEGACY, "pt")).working.localeMode, "custom");
  const current = await model(UNIT);
  assert.equal(await archiveApartmentIdentity(UNIT, ROOT_PARENT), false);
  assert.equal(await archiveApartmentIdentity(UNIT, PARENT), true);
  assert.equal(
    await commitApartmentLocale({
      id: UNIT,
      parentId: PARENT,
      locale: "en",
      revision: current.revision,
      payload: current.working,
      actor,
    }),
    false,
  );
  assert.deepEqual((await model(UNIT)).published, current.published);
  assert.deepEqual(await getPublishedApartmentStats(PARENT, "es"), {
    apartments: 1,
    capacity: 2,
    beds: 1,
  });
  assert.equal(
    (await db.execute(apartmentIdentityGuardSql(PARENT))).rows.length,
    2,
  );
});
