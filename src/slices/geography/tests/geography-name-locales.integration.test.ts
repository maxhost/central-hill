import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import {
  deleteContent,
  deleteSlugs,
  loadAllSlugs,
  loadTranslationRows,
  setSlugs,
  setSourceContent,
  setTargetTranslation,
} from "@core/i18n";
import { city, neighbourhood } from "../schema";
import { saveCity } from "../admin/actions";
import { getCityForEdit } from "../admin/queries";
import {
  listCities,
  listNeighbourhoods,
  getCityBySlug,
  getNeighbourhoodBySlug,
} from "../server/queries";
import { listLocationNameOptions } from "../server/location-name-options";
import { listGuideCityOptions } from "../server/guide-city-options";
import { GEOGRAPHY_NAME_LOCALES } from "../reference-name-types";
const CITY = "e8200000-0000-4000-8000-000000000001",
  NB = "e8200000-0000-4000-8000-000000000002",
  DRAFT = "e8200000-0000-4000-8000-000000000003";
const cities = new Set([CITY, DRAFT]);
const FOREIGN = "e8200000-0000-4000-8000-000000000004";
const actor = "geography-name-locales-backend";
const targets = { es: "Ciudad ES", pt: "Cidade PT", fr: "Ville FR" };
let verified = false;
const ownRows = (id = CITY, type = "city") => loadTranslationRows({ type, id });
const ownSlugs = async (type: string, id: string) =>
  (await loadAllSlugs(type)).filter((row) => row.entity_id === id);
const introRows = async () =>
  (await ownRows()).filter((row) => row.field === "intro");
const save = async (overrides: Record<string, unknown> = {}) => {
  const result = await saveCity({
    id: CITY,
    slug: "geography-backend-city",
    position: 9998,
    status: "published",
    country: "PT",
    hero_media_id: null,
    name: "City EN",
    intro: "Intro EN",
    neighbourhoods: [
      { id: NB, slug: "geography-backend-nb", name: "Neighbourhood EN" },
    ],
    ...overrides,
  });
  assert.equal(result.ok, true, JSON.stringify(result));

  return result;
};
before(async () => {
  assert.equal(
    new URL(process.env.DATABASE_URL ?? "http://invalid.test").hostname,
    "propertylocalesqa.local",
  );
  const who = await db.execute(
    sql`select current_database() as database,current_user as role`,
  );
  assert.deepEqual(who.rows[0], {
    database: "propertylocalesqa",
    role: "propertylocalesqa",
  });
  assert.equal(
    (
      await db
        .select()
        .from(city)
        .where(inArray(city.id, [CITY, NB, DRAFT, FOREIGN]))
    ).length,
    0,
  );
  assert.equal(
    (
      await db
        .select()
        .from(neighbourhood)
        .where(inArray(neighbourhood.id, [CITY, NB, DRAFT, FOREIGN]))
    ).length,
    0,
  );
  verified = true;
  await db.insert(city).values([
    {
      id: CITY,
      slug: "geography-backend-city",
      status: "published",
      position: 9998,
    },
    {
      id: DRAFT,
      slug: "geography-backend-draft",
      status: "draft",
      position: 9999,
    },
  ]);
  await db.insert(neighbourhood).values([
    { id: NB, city_id: CITY, slug: "geography-backend-nb" },
    { id: FOREIGN, city_id: DRAFT, slug: "geography-backend-foreign-nb" },
  ]);
  await setSourceContent(
    "city",
    CITY,
    { name: "City EN", intro: "Intro EN" },
    { updatedBy: actor },
  );
  await setSourceContent(
    "city",
    DRAFT,
    { name: "Draft EN" },
    { updatedBy: actor },
  );
  await setSourceContent(
    "neighbourhood",
    NB,
    { name: "Neighbourhood EN" },
    { updatedBy: actor },
  );
  await setSlugs("city", CITY, {
    en: "geography-backend-city",
    pt: "geography-backend-custom-pt",
  });
  await setSlugs("neighbourhood", NB, {
    en: "geography-backend-nb",
    pt: "geography-backend-nb-custom-pt",
  });
  await setTargetTranslation(
    "city",
    CITY,
    "intro",
    "pt",
    "Intro PT historical",
    { sourceValue: "Intro EN", state: "needs_review", updatedBy: actor },
  );
});
after(async () => {
  if (!verified) return;
  const ids = [...cities];
  const nbs = await db
    .select({ id: neighbourhood.id })
    .from(neighbourhood)
    .where(inArray(neighbourhood.city_id, ids));
  await db.delete(city).where(inArray(city.id, ids));
  for (const id of ids) {
    await deleteContent("city", id);
    await deleteSlugs("city", id);
  }
  for (const { id } of nbs) {
    await deleteContent("neighbourhood", id);
    await deleteSlugs("neighbourhood", id);
  }
  assert.equal(
    (await db.select().from(city).where(inArray(city.id, ids))).length,
    0,
  );
});
test("GET loads pending raw names, blank absent inputs, and preserves all rows", async () => {
  await setTargetTranslation("city", CITY, "name", "es", "Pending ES", {
    sourceValue: "City EN",
    state: "needs_review",
    updatedBy: actor,
  });
  await setTargetTranslation("neighbourhood", NB, "name", "fr", "Pending NB", {
    sourceValue: "Neighbourhood EN",
    state: "needs_review",
    updatedBy: actor,
  });
  const before = await ownRows(),
    nbBefore = await ownRows(NB, "neighbourhood");
  const edit = await getCityForEdit(CITY);
  assert.deepEqual(edit?.data.translations, {
    es: "Pending ES",
    pt: "",
    fr: "",
  });
  assert.deepEqual(edit?.data.neighbourhoods[0]?.translations, {
    es: "",
    pt: "",
    fr: "Pending NB",
  });
  assert.equal(
    (await listLocationNameOptions()).cities.find((row) => row.id === CITY)
      ?.labels?.es,
    "City EN",
  );
  assert.deepEqual(await ownRows(), before);
  assert.deepEqual(await ownRows(NB, "neighbourhood"), nbBefore);
});
test("manual Save approves labels while unchanged custom/missing slugs and intro rows stay exact", async () => {
  const slugs = await ownSlugs("city", CITY),
    nbSlugs = await ownSlugs("neighbourhood", NB),
    intro = await introRows();
  const result = await save({
    translations: targets,
    neighbourhoods: [
      {
        id: NB,
        slug: "geography-backend-nb",
        name: "Neighbourhood EN",
        translations: targets,
      },
    ],
  });
  assert.deepEqual(result.neighbourhoodIds, [NB]);
  assert.deepEqual(await ownSlugs("city", CITY), slugs);
  assert.deepEqual(await ownSlugs("neighbourhood", NB), nbSlugs);
  assert.deepEqual(await introRows(), intro);
  assert.ok(
    (await ownRows())
      .filter((row) => row.field === "name" && row.locale !== "en")
      .every((row) => row.state === "approved"),
  );
  for (const locale of GEOGRAPHY_NAME_LOCALES) {
    const expected = locale === "en" ? "City EN" : targets[locale];
    assert.equal(
      (await listCities(locale)).find((row) => row.id === CITY)?.name,
      expected,
    );
    assert.equal(
      (await listNeighbourhoods(locale, CITY)).find((row) => row.id === NB)
        ?.name,
      locale === "en" ? "Neighbourhood EN" : targets[locale],
    );
    assert.equal(
      (await listLocationNameOptions()).cities.find((row) => row.id === CITY)
        ?.labels?.[locale],
      expected,
    );
    assert.equal(
      (await listGuideCityOptions()).find((row) => row.id === CITY)?.labels?.[
        locale
      ],
      expected,
    );
  }
  assert.equal(
    (await listLocationNameOptions()).cities.some((row) => row.id === DRAFT),
    false,
  );
  assert.equal(
    (await listGuideCityOptions()).find((row) => row.id === DRAFT)?.status,
    "draft",
  );
  assert.equal(
    (await getCityBySlug("pt", "geography-backend-custom-pt"))?.id,
    CITY,
  );
  assert.equal(
    (await getNeighbourhoodBySlug("pt", "geography-backend-nb-custom-pt"))?.id,
    NB,
  );
});
test("EN-only old clients preserve target rows; explicit blank clears name only", async () => {
  const before = (await ownRows()).filter((row) => row.locale !== "en"),
    intro = await introRows();
  await save({ name: "Renamed EN" });
  assert.deepEqual(
    (await ownRows()).filter((row) => row.locale !== "en"),
    before,
  );
  await save({ name: "Renamed EN", translations: { ...targets, es: " " } });
  assert.equal(
    (await listCities("es")).find((row) => row.id === CITY)?.name,
    "Renamed EN",
  );
  assert.equal((await getCityForEdit(CITY))?.data.translations?.es, "");
  assert.deepEqual(await introRows(), intro);
});
test("actual EN intro clearing preserves independent targets, including source-absent subsequent save", async () => {
  const targets = (await introRows()).filter((row) => row.locale !== "en");
  await save({ intro: null });
  assert.deepEqual(await introRows(), targets);
  await save({ intro: null, name: "Again EN" });
  assert.deepEqual(await introRows(), targets);
});
test("fresh inline rows return ordered IDs which survive immediate next Save and reorder", async () => {
  const fresh = {
    slug: "geography-backend-new-nb",
    name: "Fresh EN",
    translations: targets,
  };
  const old = {
    id: NB,
    slug: "geography-backend-nb",
    name: "Neighbourhood EN",
  };
  const first = await save({ neighbourhoods: [fresh, old] });
  assert.equal(first.neighbourhoodIds?.length, 2);
  const freshId = first.neighbourhoodIds![0]!;
  assert.notEqual(freshId, NB);
  const second = await save({
    neighbourhoods: [old, { ...fresh, id: freshId }],
  });
  assert.deepEqual(second.neighbourhoodIds, [NB, freshId]);
  const edit = await getCityForEdit(CITY);
  assert.deepEqual(
    edit?.data.neighbourhoods.map((row) => row.id),
    [NB, freshId],
  );
  assert.deepEqual(edit?.data.neighbourhoods[1]?.translations, targets);
});
test("foreign neighbourhood identity creates an own row without touching the foreign city", async () => {
  const before = await db
    .select()
    .from(neighbourhood)
    .where(eq(neighbourhood.id, FOREIGN));
  const result = await save({
    neighbourhoods: [
      { id: NB, slug: "geography-backend-nb", name: "Neighbourhood EN" },
      { id: FOREIGN, slug: "geography-backend-own-copy", name: "Own copy" },
    ],
  });
  assert.notEqual(result.neighbourhoodIds?.[1], FOREIGN);
  assert.deepEqual(
    await db.select().from(neighbourhood).where(eq(neighbourhood.id, FOREIGN)),
    before,
  );
});
test("real shared slug edits and creation initialize identical four-locale URLs", async () => {
  await save({
    slug: "geography-backend-city-edited",
    neighbourhoods: [
      { id: NB, slug: "geography-backend-nb-edited", name: "Neighbourhood EN" },
    ],
  });
  const urls = await ownSlugs("city", CITY),
    nbs = await ownSlugs("neighbourhood", NB);
  assert.equal(urls.length, 4);
  assert.ok(urls.every((row) => row.slug === "geography-backend-city-edited"));
  assert.equal(nbs.length, 4);
  assert.ok(nbs.every((row) => row.slug === "geography-backend-nb-edited"));
  const created = await saveCity({
    slug: "geography-backend-created",
    position: 9999,
    status: "draft",
    country: "PT",
    hero_media_id: null,
    name: "Created EN",
    intro: null,
    translations: targets,
    neighbourhoods: [],
  });
  assert.equal(created.ok, true);
  cities.add(created.id);
  assert.deepEqual(created.neighbourhoodIds, []);
  const rows = await ownSlugs("city", created.id);
  assert.equal(rows.length, 4);
  assert.ok(rows.every((row) => row.slug === "geography-backend-created"));
});
