import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, deleteSlugs, loadTranslationRows } from "@core/i18n";
import { listCities } from "@slices/geography/contract";
import { guide_page } from "../schema";
import { emptyGuideEnvelope } from "../locale-content";
import { newSection, newPlace } from "../admin/ui/editor-model";
import type {
  GuideEditorialModel,
  GuideEditorialResult,
  GuideEnvelope,
} from "../editorial-types";
import { saveGuideDraft, publishGuideDraft } from "../server/locale-store";
import {
  getGuidePage,
  listGuideCityGroups,
  listTopRecommendations,
} from "../server/queries";

const guideIds = [
  "076a2000-0000-4000-8000-000000000001",
  "076a2000-0000-4000-8000-000000000002",
];
const sectionIds = [
  "076a2000-0000-4000-8000-000000000011",
  "076a2000-0000-4000-8000-000000000012",
];
const placeIds = [
  "076a2000-0000-4000-8000-000000000021",
  "076a2000-0000-4000-8000-000000000022",
];
const actor = "image-alt-guides-test";
let owned = false;
let cityId = "";
let citySlugs: Record<"en" | "es", string>;
let photos: string[] = [];
let legacyAlts: Awaited<ReturnType<typeof loadTranslationRows>>[] = [];
function success(result: GuideEditorialResult): GuideEditorialModel {
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("Guide mutation failed");
  return result.model;
}
async function save(
  model: GuideEditorialModel,
  locale: "en" | "es",
  change: (envelope: GuideEnvelope) => void,
) {
  const payload = structuredClone(model.locales[locale].working);
  change(payload);
  return success(
    await saveGuideDraft(
      {
        guideId: model.id,
        locale,
        payload,
        expectedRevision: model.locales[locale].revision,
        templateRevision: model.locales[locale].templateRevision,
        expectedSharedRevision: model.shared.revision,
      },
      actor,
    ),
  );
}
async function publish(model: GuideEditorialModel, locale: "en" | "es") {
  return success(
    await publishGuideDraft(
      {
        guideId: model.id,
        locale,
        expectedRevision: model.locales[locale].revision,
      },
      actor,
    ),
  );
}
before(async () => {
  assert.equal(
    new URL(process.env.DATABASE_URL ?? "http://invalid").hostname,
    "propertylocalesqa.local",
  );
  assert.deepEqual(
    (
      await db.execute(
        sql`select current_database() as database,current_user as role`,
      )
    ).rows[0],
    { database: "propertylocalesqa", role: "propertylocalesqa" },
  );
  assert.equal(
    (await db.select().from(guide_page).where(inArray(guide_page.id, guideIds)))
      .length,
    0,
  );
  const existing = await db.execute(
    sql`select id from guide_section where id in (${sectionIds[0]},${sectionIds[1]}) union all select id from guide_place where id in (${placeIds[0]},${placeIds[1]})`,
  );
  assert.equal(existing.rows.length, 0);
  const assets = await db.execute(
    sql`select id from media_asset where mime like 'image/%' order by created_at,id limit 4`,
  );
  photos = assets.rows.map((row) => String(row.id));
  assert.equal(
    photos.length,
    4,
    "Needs four existing read-only synthetic photos",
  );
  legacyAlts = await Promise.all(
    photos.map((id) => loadTranslationRows({ type: "media_asset", id })),
  );
  Object.assign(globalThis, {
    __incrementalCache: {
      generateCacheKey: async (key: string) => key,
      get: async () => null,
      set: async () => undefined,
    },
  });
  const english = await listCities("en");
  const spanish = await listCities("es");
  const city = english.find((candidate) =>
    spanish.some((target) => target.id === candidate.id),
  );
  assert.ok(city, "Needs one existing published city in EN/ES");
  cityId = city.id;
  citySlugs = {
    en: city.slug,
    es: spanish.find((candidate) => candidate.id === cityId)!.slug,
  };
  owned = true;
});
after(async () => {
  if (!owned) return;
  for (const id of guideIds) {
    await db.delete(guide_page).where(eq(guide_page.id, id));
    await deleteContent("guide_page", id);
    await deleteSlugs("guide_page", id);
  }
  for (const id of sectionIds) await deleteContent("guide_section", id);
  for (const id of placeIds) await deleteContent("guide_place", id);
  assert.deepEqual(
    await Promise.all(
      photos.map((id) => loadTranslationRows({ type: "media_asset", id })),
    ),
    legacyAlts,
  );
});

test("Guide published ALT reaches hero/section/place/OG/index/recommendation with independent language and draft lifecycle", async () => {
  const [hero, header, placePhoto, og] = photos as [
    string,
    string,
    string,
    string,
  ];
  const models: GuideEditorialModel[] = [];
  for (const [index, id] of guideIds.entries()) {
    const payload = emptyGuideEnvelope(cityId);
    const section = {
      ...newSection(sectionIds[index]!, id, 0),
      title: "Explore",
      body: "Body",
      header_media_id: header,
      presentation: { version: 1 as const, enabled: true },
      places: [
        {
          ...newPlace(placeIds[index]!, sectionIds[index]!, 0),
          name: "Beach",
          category: "Beach",
          address: "Synthetic test address",
          media_id: placePhoto,
        },
      ],
    };
    Object.assign(payload.content, {
      title: `Guide ${index}`,
      hero_media_id: hero,
      og_image_media_id: og,
      sections: [section],
      media_alts: {
        [hero]: `Hero ${index}`,
        [header]: `Header ${index}`,
        [placePhoto]: `Place ${index}`,
        [og]: `OG ${index}`,
      },
    });
    const model = success(
      await saveGuideDraft(
        {
          guideId: id,
          locale: "en",
          expectedRevision: 0,
          templateRevision: null,
          expectedSharedRevision: 0,
          payload,
          slug: `image-alt-guide-${index}-076`,
        },
        actor,
      ),
    );
    assert.equal(
      await getGuidePage("en", citySlugs.en, `image-alt-guide-${index}-076`),
      null,
    );
    models.push(await publish(model, "en"));
  }
  let model = models[0]!;
  const read = (locale: "en" | "es" = "en") =>
    getGuidePage(locale, citySlugs[locale], "image-alt-guide-0-076");
  const english = await read();
  assert.equal(english?.hero?.alt, "Hero 0");
  assert.equal(english?.sections[0]?.headerImage?.alt, "Header 0");
  assert.equal(english?.sections[0]?.places[0]?.image?.alt, "Place 0");
  assert.equal(english?.ogImage?.alt, "OG 0");
  assert.equal(
    (await listGuideCityGroups("en"))
      .flatMap((group) => group.guides)
      .find((guide) => guide.id === model.id)?.hero?.alt,
    "Hero 0",
  );
  assert.equal(
    (await listTopRecommendations("en", 3, { cityIds: [cityId] })).find(
      (place) => place.type === "beach",
    )?.image.alt,
    "Place 0",
  );
  model = await save(model, "es", (envelope) => {
    envelope.content.media_alts = {
      [hero]: "Tejados ES",
      [header]: "Sección ES",
      [placePhoto]: "Playa ES",
      [og]: "Portada social ES",
    };
  });
  assert.equal(model.locales.es.draft?.localeMode, "custom");
  assert.equal(await read("es"), null);
  model = await publish(model, "es");
  assert.equal((await read("es"))?.hero?.alt, "Tejados ES");
  assert.equal((await read("es"))?.sections[0]?.headerImage?.alt, "Sección ES");
  assert.equal(
    (await read("es"))?.sections[0]?.places[0]?.image?.alt,
    "Playa ES",
  );
  assert.equal((await read("es"))?.ogImage?.alt, "Portada social ES");
  assert.equal(
    (await listTopRecommendations("es", 3, { cityIds: [cityId] })).find(
      (place) => place.type === "beach",
    )?.image.alt,
    "Playa ES",
  );
  model = await save(model, "en", (envelope) => {
    envelope.content.media_alts![hero] = "Unpublished English hero";
  });
  assert.equal((await read())?.hero?.alt, "Hero 0");
  assert.equal((await read("es"))?.hero?.alt, "Tejados ES");
  assert.equal(
    model.locales.pt.working.content.media_alts?.[hero],
    "Unpublished English hero",
  );
  model = await publish(model, "en");
  assert.equal((await read())?.hero?.alt, "Unpublished English hero");
  assert.equal((await read("es"))?.hero?.alt, "Tejados ES");
  assert.equal(
    (await getGuidePage("en", citySlugs.en, "image-alt-guide-1-076"))?.hero
      ?.alt,
    "Hero 1",
  );
  model = await save(model, "en", (envelope) => {
    envelope.content.media_alts![hero] = "";
  });
  await publish(model, "en");
  assert.notEqual((await read())?.hero?.alt, "Unpublished English hero");
});
