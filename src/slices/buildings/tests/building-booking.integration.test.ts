import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { setSlugs } from "@core/i18n";
import type { Locale } from "@core/db/columns";
import type { PropertyEditorialResult, PropertyLocaleModel } from "@slices/backoffice/contract";
import type { BuildingEditorialContent, BuildingEnvelope } from "../editorial-types";
import { building, building_locale_content } from "../schema";
import { readBuildingIdentity, readBuildingLocaleRows } from "../server/editorial-bootstrap";
import { buildingLocaleModel } from "../server/editorial-model";
import { emptyBuildingEnvelope } from "../server/editorial-validation";
import {
  saveBuildingDraft,
  publishBuildingDraft,
  getBuildingLocaleScope,
  getBuildingSharedState,
} from "../server/editorial-store";
import { getBuildingBySlug } from "../server/queries";

const CITY = "d1000000-0000-4000-8000-000000000001";
const LOCALIZED = "e7500000-0000-4000-8000-000000000001";
const LEGACY = "e7500000-0000-4000-8000-000000000002";
const actor = "building-booking-backend";
type Model = PropertyLocaleModel<BuildingEditorialContent>;
let verified = false;

function success(result: PropertyEditorialResult<BuildingEditorialContent>) {
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw Error("Expected successful mutation");
  return result.model;
}
async function model(id: string, locale: Locale = "en"): Promise<Model> {
  const identity = await readBuildingIdentity(id);
  assert.ok(identity);
  return buildingLocaleModel(await readBuildingLocaleRows(identity), locale, emptyBuildingEnvelope(CITY));
}
async function rows(id: string) {
  return db.select().from(building_locale_content)
    .where(eq(building_locale_content.building_id, id))
    .orderBy(building_locale_content.locale);
}
async function save(id: string, current: Model, payload: BuildingEnvelope) {
  return success(await saveBuildingDraft({
    id, locale: current.locale, expectedRevision: current.revision,
    templateRevision: current.templateRevision, payload,
    sharedChanged: false,
    expectedSharedRevision: (await getBuildingSharedState(id))?.revision ?? 0,
  }, actor));
}
async function publish(id: string, current: Model) {
  return success(await publishBuildingDraft({ id, locale: current.locale, expectedRevision: current.revision }, actor));
}
async function cleanup() {
  for (const id of [LOCALIZED, LEGACY]) {
    await db.execute(sql`delete from building where id=${id}::uuid`);
    await db.execute(sql`delete from translation where entity_id=${id}::uuid`);
    await db.execute(sql`delete from slug where entity_id=${id}::uuid`);
  }
}
before(async () => {
  assert.equal(new URL(process.env.DATABASE_URL ?? "http://invalid.test").hostname, "propertylocalesqa.local");
  const identity = await db.execute(sql`select current_database() as database,current_user as role`);
  assert.deepEqual(identity.rows[0], { database: "propertylocalesqa", role: "propertylocalesqa" });
  verified = true;
  Object.assign(globalThis, { __incrementalCache: {
    generateCacheKey: async (key: string) => key,
    get: async () => null,
    set: async () => undefined,
  } });
  await cleanup();
});
after(async () => { if (verified) await cleanup(); });

test("Localized Label/Link save and publish independently, inherited work follows English and customized Portuguese stays intact", async () => {
  const english = { label: "Book English", link: "https://example.test/book-en" };
  const payload = emptyBuildingEnvelope(CITY);
  Object.assign(payload.content, {
    name: "Booking QA building", teaser: "Synthetic booking fixture.", street_address: "Booking QA Street",
    booking_button: english,
    default_booking_url: "https://example.test/legacy-base",
    avantio_id: "legacy-handle", booking_enabled: true,
    meta_title: "English SEO",
  });
  let en = success(await saveBuildingDraft({
    id: LOCALIZED, locale: "en", expectedRevision: 0, templateRevision: null,
    payload, slug: "building-booking-localized", expectedSharedRevision: 0, sharedChanged: true,
  }, actor));
  assert.equal((await getBuildingLocaleScope(LOCALIZED, "en"))?.published, false);
  en = await publish(LOCALIZED, en);
  assert.deepEqual((await getBuildingBySlug("en", "building-booking-localized"))?.booking,
    { enabled: true, url: english.link, label: english.label });
  assert.equal((await getBuildingLocaleScope(LOCALIZED, "es"))?.published, false);
  const ptInitial = await model(LOCALIZED, "pt");
  assert.equal(ptInitial.working.localeMode, "inherit");
  assert.deepEqual(ptInitial.working.content.booking_button, english);
  const ptPayload = { ...structuredClone(ptInitial.working), localeMode: "custom" as const };
  const portuguese = { label: "Reservar em português", link: "https://example.test/book-pt" };
  ptPayload.content.booking_button = portuguese;
  ptPayload.content.meta_title = "SEO português";
  await save(LOCALIZED, ptInitial, ptPayload);
  assert.equal((await getBuildingLocaleScope(LOCALIZED, "pt"))?.published, false);
  const ptBeforeEnglish = (await rows(LOCALIZED)).find((row) => row.locale === "pt");
  const nextEnglish = { label: "Updated English booking", link: "https://example.test/new-en" };
  const enPayload = structuredClone(en.working);
  enPayload.content.booking_button = nextEnglish;
  en = await save(LOCALIZED, en, enPayload);
  assert.equal((await getBuildingBySlug("en", "building-booking-localized"))?.booking.url, english.link);
  assert.deepEqual((await model(LOCALIZED, "es")).working.content.booking_button, nextEnglish);
  assert.deepEqual((await model(LOCALIZED, "pt")).working.content.booking_button, portuguese);
  en = await publish(LOCALIZED, en);
  assert.deepEqual((await rows(LOCALIZED)).find((row) => row.locale === "pt"), ptBeforeEnglish);
  assert.deepEqual((await getBuildingBySlug("en", "building-booking-localized"))?.booking,
    { enabled: true, url: nextEnglish.link, label: nextEnglish.label });
  await publish(LOCALIZED, await model(LOCALIZED, "pt"));
  const ptPublic = await getBuildingBySlug("pt", "building-booking-localized");
  assert.ok(ptPublic);
  assert.deepEqual(ptPublic.booking, { enabled: true, url: portuguese.link, label: portuguese.label });
  assert.equal(ptPublic.avantio.url, portuguese.link);
  assert.equal(ptPublic.metaTitle, "SEO português");
  assert.equal((await getBuildingLocaleScope(LOCALIZED, "pt"))?.bookingUrl, portuguese.link);
  assert.equal((await getBuildingLocaleScope(LOCALIZED, "fr"))?.published, false);
});

test("Cleared links remain private until Publish, then suppress Building and parent-scope fallback without changing another locale", async () => {
  const pt = await model(LOCALIZED, "pt");
  const enBefore = (await rows(LOCALIZED)).find((row) => row.locale === "en");
  const payload = structuredClone(pt.working);
  payload.content.booking_button = { label: "Reservar em português", link: null };
  const saved = await save(LOCALIZED, pt, payload);
  assert.equal((await getBuildingBySlug("pt", "building-booking-localized"))?.booking.url, "https://example.test/book-pt");
  await publish(LOCALIZED, saved);
  assert.deepEqual((await getBuildingBySlug("pt", "building-booking-localized"))?.booking,
    { enabled: true, url: null, label: "Reservar em português" });
  assert.equal((await getBuildingLocaleScope(LOCALIZED, "pt"))?.bookingUrl, null);
  assert.equal((await getBuildingSharedState(LOCALIZED))?.content.default_booking_url, "https://example.test/legacy-base");
  assert.deepEqual((await rows(LOCALIZED)).find((row) => row.locale === "en"), enBefore);
  assert.equal((await getBuildingBySlug("en", "building-booking-localized"))?.booking.url, "https://example.test/new-en");
});

test("Legacy reads and unrelated Save preserve the original effective destination and absence of an authored button", async () => {
  await db.insert(building).values({
    id: LEGACY, slug: "building-booking-legacy", status: "published", city_id: CITY,
    street_address: "Legacy Booking QA Street", avantio_id: "legacy-avantio",
    avantio_url: "https://example.test/legacy-building", booking_enabled: true,
  });
  await setSlugs("building", LEGACY, {
    en: "building-booking-legacy", pt: "building-booking-legacy-pt",
    es: "building-booking-legacy-es", fr: "building-booking-legacy-fr",
  });
  for (const [field, value] of [["name", "Legacy Booking"], ["teaser", "Legacy booking teaser"]])
    await db.execute(sql`insert into translation(entity_type,entity_id,field,locale,value,state) values('building',${LEGACY}::uuid,${field},'en',${value},'draft')`);
  const legacy = await getBuildingBySlug("en", "building-booking-legacy");
  assert.ok(legacy);
  assert.deepEqual(legacy.booking, { enabled: true, url: "https://example.test/legacy-building" });
  assert.equal((await rows(LEGACY)).length, 0);
  const en = await model(LEGACY);
  assert.equal(Object.hasOwn(en.working.content, "booking_button"), false);
  const payload = structuredClone(en.working);
  payload.content.meta_title = "Unrelated SEO draft";
  const saved = await save(LEGACY, en, payload);
  assert.equal(Object.hasOwn(saved.draft!.content, "booking_button"), false);
  assert.equal(saved.draft!.content.avantio_id, "legacy-avantio");
  assert.equal(saved.draft!.content.default_booking_url, "https://example.test/legacy-building");
  await publish(LEGACY, saved);
  assert.deepEqual((await getBuildingBySlug("en", "building-booking-legacy"))?.booking, legacy.booking);
  const pt = await getBuildingBySlug("pt", "building-booking-legacy-pt");
  assert.deepEqual(pt?.booking, legacy.booking);
});
