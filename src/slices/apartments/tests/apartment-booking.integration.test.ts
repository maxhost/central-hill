import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import type {
  PropertyEditorialResult,
  PropertyLocaleModel,
} from "@slices/backoffice/contract";
import type {
  ApartmentEditorialContent,
  ApartmentEnvelope,
} from "../editorial-types";
import { apartment, apartment_locale_content } from "../schema";
import {
  readApartmentIdentity,
  readApartmentLocaleRows,
} from "../server/editorial-bootstrap";
import { apartmentLocaleModel } from "../server/editorial-model";
import { emptyApartmentEnvelope } from "../server/editorial-validation";
import { readApartmentSharedState } from "../server/shared-content";
import {
  saveApartmentDraft,
  publishApartmentDraft,
} from "../server/editorial-store";
import { listPublishedApartments } from "../server/queries";
import { listApartmentsAdmin } from "../admin/queries";

const PARENT = "e7600000-0000-4000-8000-000000000001";
const UNIT = "e7600000-0000-4000-8000-000000000002";
const LEGACY = "e7600000-0000-4000-8000-000000000003";
const ADMIN_UNIT = "e7600000-0000-4000-8000-000000000004";
const CITY = "d1000000-0000-4000-8000-000000000001";
const actor = "apartment-booking-backend";
type Model = PropertyLocaleModel<ApartmentEditorialContent>;
let verified = false;

function success(result: PropertyEditorialResult<ApartmentEditorialContent>) {
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw Error("Expected successful mutation");
  return result.model;
}
async function bundle(id: string) {
  const identity = await readApartmentIdentity(id);
  assert.ok(identity);
  const rows = await readApartmentLocaleRows(identity);
  return { rows, shared: await readApartmentSharedState(identity, rows) };
}
async function model(id: string, locale: Locale = "en"): Promise<Model> {
  const { rows, shared } = await bundle(id);
  return apartmentLocaleModel(rows, locale, shared);
}
async function storedRows(id: string) {
  return db
    .select()
    .from(apartment_locale_content)
    .where(eq(apartment_locale_content.apartment_id, id))
    .orderBy(apartment_locale_content.locale);
}
async function save(id: string, current: Model, payload: ApartmentEnvelope) {
  const { shared } = await bundle(id);
  return success(
    await saveApartmentDraft(
      {
        id,
        parentId: PARENT,
        locale: current.locale,
        expectedRevision: current.revision,
        templateRevision: current.templateRevision,
        payload,
        sharedChanged: false,
        expectedSharedRevision: shared.revision,
      },
      actor,
    ),
  );
}
async function publish(id: string, current: Model) {
  return success(
    await publishApartmentDraft(
      {
        id,
        parentId: PARENT,
        locale: current.locale,
        expectedRevision: current.revision,
      },
      actor,
    ),
  );
}
async function publicUnit(locale: Locale, id = UNIT) {
  return (await listPublishedApartments(locale, PARENT)).find(
    (unit) => unit.id === id,
  );
}
async function cleanup() {
  for (const id of [UNIT, LEGACY, ADMIN_UNIT]) {
    await db.execute(sql`delete from apartment where id=${id}::uuid`);
    await db.execute(
      sql`delete from translation where entity_type='apartment' and entity_id=${id}::uuid`,
    );
    await db.execute(
      sql`delete from slug where entity_type='apartment' and entity_id=${id}::uuid`,
    );
  }
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
  Object.assign(globalThis, {
    __incrementalCache: {
      generateCacheKey: async (key: string) => key,
      get: async () => null,
      set: async () => undefined,
    },
  });
  await cleanup();
  await db.execute(
    sql`insert into building(id,slug,status,city_id) values(${PARENT}::uuid,'apartment-booking-tests-parent','published',${CITY}::uuid)`,
  );
});
after(async () => {
  if (verified) await cleanup();
});

test("Published unit URLs change only after selected-language Publish and custom Portuguese survives later English saves", async () => {
  const payload = emptyApartmentEnvelope();
  Object.assign(payload.content, {
    name: "Booking link QA unit",
    max_guests: 4,
    beds_count: 2,
    booking_link: "https://example.test/unit-en?lang=en",
    default_booking_url: "https://example.test/hidden-default",
    avantio_id: "retained-handle",
    meta_title: "Retained English SEO",
    meta_description: "Retained English description",
  });
  let en = success(
    await saveApartmentDraft(
      {
        id: UNIT,
        parentId: PARENT,
        locale: "en",
        expectedRevision: 0,
        templateRevision: null,
        payload,
        sharedChanged: true,
        expectedSharedRevision: 0,
      },
      actor,
    ),
  );
  assert.equal(await publicUnit("en"), undefined);
  en = await publish(UNIT, en);
  assert.equal(
    (await publicUnit("en"))?.avantio.url,
    "https://example.test/unit-en?lang=en",
  );
  const ptInitial = await model(UNIT, "pt");
  assert.equal(ptInitial.working.localeMode, "inherit");
  assert.equal(
    ptInitial.working.content.booking_link,
    payload.content.booking_link,
  );
  const own = {
    ...structuredClone(ptInitial.working),
    localeMode: "custom" as const,
  };
  own.content.booking_link = "https://example.test/unit-pt?lang=pt";
  own.content.meta_title = "SEO português preservado";
  await save(UNIT, ptInitial, own);
  assert.equal(await publicUnit("pt"), undefined);
  const ptBefore = (await storedRows(UNIT)).find((row) => row.locale === "pt");
  const update = structuredClone(en.working);
  update.content.booking_link = "https://example.test/unit-en-updated";
  en = await save(UNIT, en, update);
  assert.equal(
    (await publicUnit("en"))?.avantio.url,
    payload.content.booking_link,
  );
  assert.equal(
    (await model(UNIT, "es")).working.content.booking_link,
    update.content.booking_link,
  );
  assert.equal(
    (await model(UNIT, "pt")).working.content.booking_link,
    own.content.booking_link,
  );
  en = await publish(UNIT, en);
  assert.deepEqual(
    (await storedRows(UNIT)).find((row) => row.locale === "pt"),
    ptBefore,
  );
  await publish(UNIT, await model(UNIT, "pt"));
  assert.equal((await publicUnit("pt"))?.avantio.url, own.content.booking_link);
  assert.equal(
    (await publicUnit("en"))?.avantio.url,
    update.content.booking_link,
  );
  assert.equal(await publicUnit("es"), undefined);
  assert.equal(await publicUnit("fr"), undefined);
  assert.equal(
    (await model(UNIT, "pt")).published?.content.meta_title,
    "SEO português preservado",
  );
  assert.equal(
    (await model(UNIT)).published?.content.meta_description,
    "Retained English description",
  );
});

test("Clearing a localized URL is private until Publish and never revives the hidden default or resets SEO", async () => {
  const pt = await model(UNIT, "pt");
  const enBefore = (await storedRows(UNIT)).find((row) => row.locale === "en");
  const update = structuredClone(pt.working);
  update.content.booking_link = null;
  const saved = await save(UNIT, pt, update);
  assert.equal(
    (await publicUnit("pt"))?.avantio.url,
    "https://example.test/unit-pt?lang=pt",
  );
  await publish(UNIT, saved);
  assert.equal((await publicUnit("pt"))?.avantio.url, null);
  assert.equal(
    (await publicUnit("en"))?.avantio.url,
    "https://example.test/unit-en-updated",
  );
  assert.deepEqual(
    (await storedRows(UNIT)).find((row) => row.locale === "en"),
    enBefore,
  );
  const retained = await model(UNIT, "pt");
  assert.equal(
    retained.published?.content.meta_title,
    "SEO português preservado",
  );
  assert.equal(
    retained.published?.content.meta_description,
    "Retained English description",
  );
  assert.equal(
    retained.working.content.default_booking_url,
    "https://example.test/hidden-default",
  );
  assert.equal(retained.working.content.avantio_id, "retained-handle");
});

test("Legacy published URLs remain available and unrelated Save retains hidden booking/SEO without adding booking_link", async () => {
  await db.insert(apartment).values({
    id: LEGACY,
    building_id: PARENT,
    slug: "apartment-booking-legacy",
    status: "published",
    max_guests: 2,
    beds_count: 1,
    avantio_id: "legacy-avantio",
    avantio_url: "https://example.test/legacy-unit",
  });
  await db.execute(sql`insert into translation(entity_type,entity_id,field,locale,value,state) values
    ('apartment',${LEGACY}::uuid,'name','en','Legacy booking unit','draft'),
    ('apartment',${LEGACY}::uuid,'meta_title','en','Hidden legacy SEO','draft'),
    ('apartment',${LEGACY}::uuid,'meta_description','en','Hidden legacy description','draft')`);
  assert.equal(
    (await publicUnit("en", LEGACY))?.avantio.url,
    "https://example.test/legacy-unit",
  );
  assert.equal((await storedRows(LEGACY)).length, 0);
  const en = await model(LEGACY);
  assert.equal(Object.hasOwn(en.working.content, "booking_link"), false);
  const update = structuredClone(en.working);
  update.content.badge = "Unrelated badge";
  const saved = await save(LEGACY, en, update);
  assert.equal(Object.hasOwn(saved.draft!.content, "booking_link"), false);
  await publish(LEGACY, saved);
  assert.equal(
    (await publicUnit("en", LEGACY))?.avantio.url,
    "https://example.test/legacy-unit",
  );
  const retained = (await model(LEGACY)).published!;
  assert.equal(Object.hasOwn(retained.content, "booking_link"), false);
  assert.equal(retained.content.avantio_id, "legacy-avantio");
  assert.equal(
    retained.content.default_booking_url,
    "https://example.test/legacy-unit",
  );
  assert.equal(retained.content.meta_title, "Hidden legacy SEO");
  assert.equal(retained.content.meta_description, "Hidden legacy description");
});

test("Admin own-link indicator follows saved English including explicit clear, with legacy URLs retained", async () => {
  const payload = emptyApartmentEnvelope();
  Object.assign(payload.content, {
    name: "Admin link QA unit",
    max_guests: 2,
    booking_link: "https://example.test/admin-en",
    default_booking_url: "https://example.test/hidden-admin-default",
  });
  const saved = success(
    await saveApartmentDraft(
      {
        id: ADMIN_UNIT,
        parentId: PARENT,
        locale: "en",
        expectedRevision: 0,
        templateRevision: null,
        payload,
        sharedChanged: true,
        expectedSharedRevision: 0,
      },
      actor,
    ),
  );
  const indicator = async (id: string) =>
    (await listApartmentsAdmin({ buildingId: PARENT })).find(
      (unit) => unit.id === id,
    )?.hasAvantioUrl;
  assert.equal(await indicator(ADMIN_UNIT), true);
  const en = await publish(ADMIN_UNIT, saved);
  const clear = structuredClone(en.working);
  clear.content.booking_link = null;
  await save(ADMIN_UNIT, en, clear);
  assert.equal(await indicator(ADMIN_UNIT), false);
  assert.equal(
    (await publicUnit("en", ADMIN_UNIT))?.avantio.url,
    "https://example.test/admin-en",
  );
  await db
    .insert(apartment)
    .values({
      id: LEGACY,
      building_id: PARENT,
      slug: "apartment-booking-legacy",
      status: "published",
      max_guests: 2,
      avantio_url: "https://example.test/legacy-unit",
    })
    .onConflictDoNothing();
  assert.equal(await indicator(LEGACY), true);
});
