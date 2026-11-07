import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import {
  loadTranslationRows,
  loadAlternateSlugs,
  type TranslationRow,
} from "@core/i18n";
import type { Locale } from "@core/db/columns";
import { PROPERTY_EDITOR_LOCALES } from "@slices/backoffice/contract";
import {
  building,
  building_locale_content,
  building_media,
  building_amenity,
  building_faq,
} from "../schema";
import { PROPERTY_GRAPH_LOCK, type BuildingEnvelope } from "../editorial-types";
import { checkBuildingEnvelope } from "./editorial-validation";
export type BuildingIdentity = typeof building.$inferSelect;
export type BuildingLocaleRow = typeof building_locale_content.$inferSelect;
export class PropertyLegacyError extends Error {
  constructor() {
    super("Existing building content cannot be read safely.");
    this.name = "PropertyLegacyError";
  }
}
export function propertyGraphLockQuery() {
  return db.execute(
    sql`select pg_advisory_xact_lock(${PROPERTY_GRAPH_LOCK},1)`,
  );
}
export async function readBuildingIdentity(
  id: string,
): Promise<BuildingIdentity | null> {
  return (
    (await db.select().from(building).where(eq(building.id, id)).limit(1))[0] ??
    null
  );
}
export function buildingSlugMap(id: string) {
  return loadAlternateSlugs("building", id);
}
const fields = [
  "name",
  "headline",
  "teaser",
  "description_intro",
  "description_neighbourhood",
  "meta_title",
  "meta_description",
];
export function legacyBuildingEnvelope(
  identity: BuildingIdentity,
  translations: TranslationRow[],
  gallery: string[],
  amenityIds: string[],
  faq: { id: string; rows: TranslationRow[] }[],
  locale: Locale,
  pending = false,
  strict = true,
): BuildingEnvelope {
  const get = (rows: TranslationRow[], field: string) =>
    rows.find(
      (r) =>
        r.field === field &&
        r.locale === locale &&
        locale !== "en" &&
        (pending || r.state === "approved"),
    )?.value ?? rows.find((r) => r.field === field && r.locale === "en")?.value;
  const envelope: BuildingEnvelope = {
    schemaVersion: 1,
    localeMode:
      locale === "en" ||
      [
        ...translations.filter((r) => fields.includes(r.field)),
        ...faq.flatMap((f) => f.rows),
      ].some((r) => r.locale === locale)
        ? "custom"
        : "inherit",
    content: {
      name: get(translations, "name") ?? "",
      headline: get(translations, "headline") ?? "",
      teaser: get(translations, "teaser") ?? "",
      description_intro: get(translations, "description_intro") ?? "",
      description_neighbourhood:
        get(translations, "description_neighbourhood") ?? null,
      meta_title: get(translations, "meta_title") ?? null,
      meta_description: get(translations, "meta_description") ?? null,
      position: identity.position,
      is_new: identity.is_new,
      is_featured: identity.is_featured,
      city_id: identity.city_id,
      neighbourhood_id: identity.neighbourhood_id,
      street_address: identity.street_address,
      latitude: identity.latitude,
      longitude: identity.longitude,
      cover_media_id: identity.cover_media_id,
      og_image_media_id: identity.og_image_media_id,
      gallery,
      amenity_ids: amenityIds,
      faq: faq.map((f) => ({
        id: f.id,
        question: get(f.rows, "question") ?? "",
        answer: get(f.rows, "answer") ?? "",
      })),
      avantio_id: identity.avantio_id,
      default_booking_url: identity.avantio_url,
      booking_url: null,
      booking_enabled: identity.booking_enabled,
    },
  };
  if (strict && !checkBuildingEnvelope(envelope).envelope)
    throw new PropertyLegacyError();
  return envelope;
}
export async function legacyBuildingLocaleRows(
  identity: BuildingIdentity,
  strict = true,
): Promise<BuildingLocaleRow[]> {
  const [translations, gallery, amenities, faqRows] = await Promise.all([
    loadTranslationRows({ type: "building", id: identity.id }),
    db
      .select()
      .from(building_media)
      .where(eq(building_media.building_id, identity.id))
      .orderBy(asc(building_media.position)),
    db
      .select()
      .from(building_amenity)
      .where(eq(building_amenity.building_id, identity.id)),
    db
      .select()
      .from(building_faq)
      .where(eq(building_faq.building_id, identity.id))
      .orderBy(asc(building_faq.position)),
  ]);
  const faq = await Promise.all(
    faqRows.map(async (f) => ({
      id: f.id,
      rows: await loadTranslationRows({ type: "building_faq", id: f.id }),
    })),
  );
  return PROPERTY_EDITOR_LOCALES.map((locale) => {
    const published =
      identity.status === "published"
        ? legacyBuildingEnvelope(
            identity,
            translations,
            gallery.map((g) => g.media_id),
            amenities.map((a) => a.amenity_id),
            faq,
            locale,
            false,
            strict,
          )
        : null;
    const pending = [
      ...translations.filter((r) => fields.includes(r.field)),
      ...faq.flatMap((f) => f.rows),
    ].some(
      (r) => r.locale === locale && locale !== "en" && r.state !== "approved",
    );
    const draft =
      !published || pending
        ? legacyBuildingEnvelope(
            identity,
            translations,
            gallery.map((g) => g.media_id),
            amenities.map((a) => a.amenity_id),
            faq,
            locale,
            true,
            strict,
          )
        : null;
    return {
      id: identity.id,
      building_id: identity.id,
      locale,
      published,
      draft,
      revision: 0,
      published_at: published ? identity.updated_at : null,
      draft_saved_at: draft ? identity.updated_at : null,
      updated_by: null,
      created_at: identity.created_at,
      updated_at: identity.updated_at,
    };
  });
}
/** A present row with null publication intentionally disables legacy fallback. */
export async function readBuildingLocaleRows(
  identity: BuildingIdentity,
  strict = true,
): Promise<BuildingLocaleRow[]> {
  const rows = await db
    .select()
    .from(building_locale_content)
    .where(eq(building_locale_content.building_id, identity.id));
  if (
    rows.length === 4 &&
    rows.every(
      (row) =>
        row.revision > 0 ||
        (row.draft ?? row.published)?.localeMode ||
        (!row.draft && !row.published),
    )
  )
    return rows;
  const legacy = await legacyBuildingLocaleRows(identity, strict);
  return PROPERTY_EDITOR_LOCALES.map((locale) => {
    const own = rows.find((r) => r.locale === locale);
    const fallback = legacy.find((r) => r.locale === locale)!;
    if (!own) return fallback;
    const mode =
      locale === "en" || own.revision > 0
        ? "custom"
        : ((fallback.draft ?? fallback.published)?.localeMode ?? "inherit");
    return {
      ...own,
      draft: own.draft
        ? { ...own.draft, localeMode: own.draft.localeMode ?? mode }
        : null,
      published: own.published
        ? { ...own.published, localeMode: own.published.localeMode ?? mode }
        : null,
    };
  });
}
export async function bootstrapBuildingLocales(
  identity: BuildingIdentity,
  actor: string,
) {
  const existing = await db
    .select({ locale: building_locale_content.locale })
    .from(building_locale_content)
    .where(eq(building_locale_content.building_id, identity.id));
  if (existing.length === 4) return;
  const rows = await legacyBuildingLocaleRows(identity);
  await db.batch([
    propertyGraphLockQuery(),
    db
      .insert(building_locale_content)
      .values(
        rows.map((r) => ({
          building_id: identity.id,
          locale: r.locale,
          published: r.published,
          draft: r.draft,
          revision: 0,
          published_at: r.published_at,
          draft_saved_at: r.draft_saved_at,
          updated_by: actor,
        })),
      )
      .onConflictDoNothing(),
  ]);
}
