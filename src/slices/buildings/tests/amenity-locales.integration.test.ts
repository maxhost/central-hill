import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import {
  deleteContent,
  deleteSlugs,
  hashSource,
  loadTranslationRows,
  setSlug,
  setSourceContent,
  setTargetTranslation,
} from "@core/i18n";
import { AMENITY, BUILDING } from "../contract";
import {
  amenity,
  building,
  building_amenity,
  building_locale_content,
} from "../schema";
import { getAmenityForEdit, listAmenitiesAdmin } from "../admin/queries";
import { amenitySaveInput } from "../admin/validation";
import { saveAmenityLabels } from "../server/amenity-labels";
import { getBuildingBySlug } from "../server/queries";
import { emptyBuildingEnvelope } from "../server/editorial-validation";

const AMENITY_ID = "e7700000-0000-4000-8000-000000000001";
const PARENT = "e7700000-0000-4000-8000-000000000002";
const CITY = "d1000000-0000-4000-8000-000000000001";
const SLUG = "amenity-locales-backend-building";
const actor = "amenity-locales-backend";
let verified = false;
const translations = {
  es: "Wi-Fi español",
  pt: "Wi-Fi português",
  fr: "Wi-Fi français",
};
function input(label: string, targets?: typeof translations) {
  return amenitySaveInput.parse({
    id: AMENITY_ID,
    slug: "amenity-locales-backend-wifi",
    icon: null,
    group: "qa-locales",
    label,
    ...(targets ? { translations: targets } : {}),
  });
}
async function ownOption() {
  const option = (await listAmenitiesAdmin()).find(
    (item) => item.id === AMENITY_ID,
  );
  assert.ok(option);
  return option;
}
async function publicLabel(locale: "en" | "es" | "pt" | "fr") {
  const detail = await getBuildingBySlug(locale, SLUG);
  assert.ok(detail);
  return detail.amenities.find((item) => item.id === AMENITY_ID)?.label;
}
async function cleanup() {
  await db.delete(building).where(eq(building.id, PARENT));
  await db.delete(amenity).where(eq(amenity.id, AMENITY_ID));
  await deleteContent(AMENITY, AMENITY_ID);
  await deleteContent(BUILDING, PARENT);
  await deleteSlugs(BUILDING, PARENT);
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
  await db.insert(amenity).values({
    id: AMENITY_ID,
    slug: "amenity-locales-backend-wifi",
    group: "qa-locales",
  });
  await db.insert(building).values({
    id: PARENT,
    slug: SLUG,
    status: "published",
    city_id: CITY,
    street_address: "Amenity QA Street",
  });
  await db
    .insert(building_amenity)
    .values({ building_id: PARENT, amenity_id: AMENITY_ID });
  const published = {
    ...emptyBuildingEnvelope(CITY),
    localeMode: "custom" as const,
  };
  Object.assign(published.content, {
    name: "Amenity locales QA Building",
    teaser: "A synthetic taxonomy fixture.",
    street_address: "Amenity QA Street",
    amenity_ids: [AMENITY_ID],
  });
  await db.insert(building_locale_content).values(
    (["en", "es", "pt", "fr"] as const).map((locale) => ({
      building_id: PARENT,
      locale,
      revision: 1,
      published: structuredClone(published),
    })),
  );
  await setSlug(BUILDING, PARENT, "en", SLUG);
  await setSourceContent(
    BUILDING,
    PARENT,
    {
      name: "Amenity locales QA Building",
      teaser: "A synthetic taxonomy fixture.",
    },
    { updatedBy: actor },
  );
  await setSourceContent(
    AMENITY,
    AMENITY_ID,
    { label: "Wi-Fi English" },
    { updatedBy: actor },
  );
  await setTargetTranslation(
    AMENITY,
    AMENITY_ID,
    "label",
    "es",
    "Wi-Fi español aprobado",
    { sourceValue: "Wi-Fi English", state: "approved", updatedBy: actor },
  );
  await setTargetTranslation(
    AMENITY,
    AMENITY_ID,
    "label",
    "pt",
    "Wi-Fi português pendente",
    { sourceValue: "Wi-Fi English", state: "needs_review", updatedBy: actor },
  );
});
after(async () => {
  if (verified) await cleanup();
});

test("Amenity form reads authored pending labels while selector/public reads approved values with English fallback", async () => {
  const beforeRows = await loadTranslationRows({
    type: AMENITY,
    id: AMENITY_ID,
  });
  const edit = await getAmenityForEdit(AMENITY_ID);
  assert.ok(edit);
  assert.equal(edit.label, "Wi-Fi English");
  assert.deepEqual(edit.translations, {
    es: "Wi-Fi español aprobado",
    pt: "Wi-Fi português pendente",
    fr: "",
  });
  assert.equal(edit.buildings, 1);
  assert.equal(edit.slug, "amenity-locales-backend-wifi");
  assert.equal(edit.group, "qa-locales");
  assert.equal(edit.icon, "");
  const option = await ownOption();
  assert.equal(option.label, "Wi-Fi English");
  assert.deepEqual(option.labels, {
    en: "Wi-Fi English",
    es: "Wi-Fi español aprobado",
    pt: "Wi-Fi English",
    fr: "Wi-Fi English",
  });
  assert.equal(await publicLabel("pt"), "Wi-Fi English");
  assert.deepEqual(
    await loadTranslationRows({ type: AMENITY, id: AMENITY_ID }),
    beforeRows,
  );
  // Historic approved-empty rows predate the new form's blank-target deletion.
  await setTargetTranslation(AMENITY, AMENITY_ID, "label", "fr", "   ", {
    sourceValue: "Wi-Fi English",
    state: "approved",
    updatedBy: actor,
  });
  assert.equal((await ownOption()).labels?.fr, "Wi-Fi English");
});

test("Saving manual labels approves all targets; English changes preserve custom text and old clients preserve target rows", async () => {
  await saveAmenityLabels(
    AMENITY_ID,
    input(" Wi-Fi revised English ", translations),
    actor,
  );
  const rows = await loadTranslationRows({ type: AMENITY, id: AMENITY_ID });
  assert.equal(rows.length, 4);
  for (const row of rows.filter((item) => item.locale !== "en")) {
    assert.equal(row.state, "approved");
    assert.equal(row.source_hash, hashSource("Wi-Fi revised English"));
    assert.equal(
      row.value,
      translations[row.locale as keyof typeof translations],
    );
  }
  assert.deepEqual(
    (await getAmenityForEdit(AMENITY_ID))?.translations,
    translations,
  );
  await saveAmenityLabels(
    AMENITY_ID,
    input("Wi-Fi renamed English", translations),
    actor,
  );
  assert.deepEqual(
    (await getAmenityForEdit(AMENITY_ID))?.translations,
    translations,
  );
  const targetsBefore = (
    await loadTranslationRows({ type: AMENITY, id: AMENITY_ID })
  ).filter((row) => row.locale !== "en");
  await saveAmenityLabels(
    AMENITY_ID,
    input("Wi-Fi older-client English"),
    actor,
  );
  assert.deepEqual(
    (await loadTranslationRows({ type: AMENITY, id: AMENITY_ID })).filter(
      (row) => row.locale !== "en",
    ),
    targetsBefore,
  );
  assert.deepEqual((await ownOption()).labels, {
    en: "Wi-Fi older-client English",
    ...translations,
  });
});

test("Clearing one target removes only that label and updates published amenities without republishing Building documents", async () => {
  const before = await db
    .select()
    .from(building_locale_content)
    .where(eq(building_locale_content.building_id, PARENT));
  assert.equal(before.length, 4);
  const targetValues = { ...translations, fr: "   " };
  await saveAmenityLabels(
    AMENITY_ID,
    input("Wi-Fi fallback English", targetValues),
    actor,
  );
  const rows = await loadTranslationRows({ type: AMENITY, id: AMENITY_ID });
  assert.equal(
    rows.some((row) => row.locale === "fr"),
    false,
  );
  assert.deepEqual((await getAmenityForEdit(AMENITY_ID))?.translations, {
    ...translations,
    fr: "",
  });
  assert.deepEqual((await ownOption()).labels, {
    en: "Wi-Fi fallback English",
    ...translations,
    fr: "Wi-Fi fallback English",
  });
  assert.equal(await publicLabel("es"), translations.es);
  assert.equal(await publicLabel("pt"), translations.pt);
  assert.equal(await publicLabel("fr"), "Wi-Fi fallback English");
  assert.deepEqual(
    await db
      .select()
      .from(building_locale_content)
      .where(eq(building_locale_content.building_id, PARENT)),
    before,
  );
  const [metadata] = await db
    .select()
    .from(amenity)
    .where(eq(amenity.id, AMENITY_ID));
  assert.equal(metadata?.slug, "amenity-locales-backend-wifi");
  assert.equal(metadata?.group, "qa-locales");
  assert.equal(metadata?.icon, null);
});
