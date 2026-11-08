import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, deleteSlugs, loadTranslationRows } from "@core/i18n";
import { service, service_category } from "../schema";
import { emptyServiceEnvelope } from "../locale-content";
import type {
  ServiceEditorialModel,
  ServiceEditorialResult,
  ServiceEnvelope,
} from "../editorial-types";
import { saveServiceDraft, publishServiceDraft } from "../server/locale-store";
import { getServiceBySlug, listServices } from "../server/queries";

const categoryId = "076a1000-0000-4000-8000-000000000001";
const serviceIds = [
  "076a1000-0000-4000-8000-000000000002",
  "076a1000-0000-4000-8000-000000000003",
];
const actor = "image-alt-services-test";
let owned = false;
let photos: string[] = [];
let legacyAlts: Awaited<ReturnType<typeof loadTranslationRows>>[] = [];

function success(result: ServiceEditorialResult): ServiceEditorialModel {
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("Service mutation failed");
  return result.model;
}
async function save(
  model: ServiceEditorialModel,
  locale: "en" | "es",
  change: (envelope: ServiceEnvelope) => void,
) {
  const payload = structuredClone(model.locales[locale].working);
  change(payload);
  return success(
    await saveServiceDraft(
      {
        serviceId: model.id,
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
async function publish(model: ServiceEditorialModel, locale: "en" | "es") {
  return success(
    await publishServiceDraft(
      {
        serviceId: model.id,
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
    (await db.select().from(service).where(inArray(service.id, serviceIds)))
      .length,
    0,
  );
  assert.equal(
    (
      await db
        .select()
        .from(service_category)
        .where(eq(service_category.id, categoryId))
    ).length,
    0,
  );
  const assets = await db.execute(
    sql`select id from media_asset where mime like 'image/%' order by created_at,id limit 3`,
  );
  photos = assets.rows.map((row) => String(row.id));
  assert.equal(
    photos.length,
    3,
    "Needs three existing read-only synthetic photos",
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
  owned = true;
  await db
    .insert(service_category)
    .values({
      id: categoryId,
      slug: "image-alt-test-category-076",
      icon: "car",
    });
});
after(async () => {
  if (!owned) return;
  for (const id of serviceIds) {
    await db.delete(service).where(eq(service.id, id));
    await deleteContent("service", id);
    await deleteSlugs("service", id);
  }
  await db.delete(service_category).where(eq(service_category.id, categoryId));
  await deleteContent("service_category", categoryId);
  assert.deepEqual(
    await Promise.all(
      photos.map((id) => loadTranslationRows({ type: "media_asset", id })),
    ),
    legacyAlts,
  );
});

test("published Service ALT covers cover/gallery/OG/itinerary without leaking drafts, locales or reused photos", async () => {
  const [cover, gallery, step] = photos as [string, string, string];
  const models: ServiceEditorialModel[] = [];
  for (const [index, id] of serviceIds.entries()) {
    const payload = emptyServiceEnvelope(categoryId);
    Object.assign(payload.content, {
      name: `Service ${index}`,
      excerpt: "Excerpt",
      body: "Body",
      cover_media_id: cover,
      og_image_media_id: gallery,
      gallery: [gallery],
      media_alts: {
        [cover]: `Cover ${index}`,
        [gallery]: `Gallery ${index}`,
        [step]: `Itinerary ${index}`,
      },
    });
    payload.content.detail.itinerary = [
      {
        id: "step-one",
        time: "09:00",
        title: "Arrival",
        text: "Visit",
        media_id: step,
      },
    ];
    const model = success(
      await saveServiceDraft(
        {
          serviceId: id,
          locale: "en",
          expectedRevision: 0,
          templateRevision: null,
          expectedSharedRevision: 0,
          payload,
          slug: `image-alt-service-${index}-076`,
        },
        actor,
      ),
    );
    assert.equal(
      await getServiceBySlug("en", `image-alt-service-${index}-076`),
      null,
    );
    models.push(await publish(model, "en"));
  }
  let model = models[0]!;
  const read = (locale: "en" | "es" = "en") =>
    getServiceBySlug(locale, "image-alt-service-0-076");
  const english = await read();
  assert.equal(english?.cover?.alt, "Cover 0");
  assert.equal(english?.gallery[0]?.alt, "Gallery 0");
  assert.equal(english?.ogImage?.alt, "Gallery 0");
  assert.equal(english?.stepImages[step]?.alt, "Itinerary 0");
  assert.equal(
    (await listServices("en")).find((row) => row.id === model.id)?.cover?.alt,
    "Cover 0",
  );
  model = await save(model, "es", (envelope) => {
    envelope.content.media_alts = {
      [cover]: "Fachada ES",
      [gallery]: "Galería ES",
      [step]: "Parada ES",
    };
  });
  assert.equal(model.locales.es.draft?.localeMode, "custom");
  assert.equal(await read("es"), null, "A saved target draft is not public");
  model = await publish(model, "es");
  assert.equal((await read("es"))?.cover?.alt, "Fachada ES");
  assert.equal((await read("es"))?.gallery[0]?.alt, "Galería ES");
  assert.equal((await read("es"))?.stepImages[step]?.alt, "Parada ES");
  model = await save(model, "en", (envelope) => {
    envelope.content.media_alts![cover] = "Unpublished English ALT";
  });
  assert.equal((await read())?.cover?.alt, "Cover 0");
  assert.equal((await read("es"))?.cover?.alt, "Fachada ES");
  assert.equal(
    model.locales.pt.working.content.media_alts?.[cover],
    "Unpublished English ALT",
  );
  model = await publish(model, "en");
  assert.equal((await read())?.cover?.alt, "Unpublished English ALT");
  assert.equal((await read("es"))?.cover?.alt, "Fachada ES");
  assert.equal(
    (await getServiceBySlug("en", "image-alt-service-1-076"))?.cover?.alt,
    "Cover 1",
  );
  model = await save(model, "en", (envelope) => {
    envelope.content.media_alts![cover] = "";
  });
  await publish(model, "en");
  assert.notEqual(
    (await read())?.cover?.alt,
    "Unpublished English ALT",
    "Blank returns to the existing legacy/title fallback",
  );
});
