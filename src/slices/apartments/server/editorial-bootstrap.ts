import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import {
  loadAlternateSlugs,
  loadTranslationRows,
  type TranslationRow,
} from "@core/i18n";
import type { Locale } from "@core/db/columns";
import { PROPERTY_EDITOR_LOCALES } from "@slices/backoffice/contract";
import { PROPERTY_GRAPH_LOCK } from "@slices/buildings/contract";
import {
  apartment,
  apartment_media,
  apartment_locale_content,
} from "../schema";
import type { ApartmentEnvelope } from "../editorial-types";
import { checkApartmentEnvelope } from "./editorial-validation";
export type ApartmentIdentity = typeof apartment.$inferSelect;
export type ApartmentLocaleRow = typeof apartment_locale_content.$inferSelect;
export class LegacyApartmentError extends Error {
  constructor() {
    super("Existing apartment content is invalid; no content was replaced.");
    this.name = "PropertyLegacyError";
  }
}
export function propertyGraphLockQuery() {
  return db.execute(
    sql`select pg_advisory_xact_lock(${PROPERTY_GRAPH_LOCK},1)`,
  );
}
export function legacyApartmentEnvelope(
  identity: ApartmentIdentity,
  rows: TranslationRow[],
  gallery: string[],
  locale: Locale,
  pending = false,
  strict = true,
): ApartmentEnvelope {
  const source = new Map(
    rows
      .filter((row) => row.locale === "en")
      .map((row) => [row.field, row.value]),
  );
  const target = new Map(
    rows
      .filter(
        (row) =>
          row.locale === locale &&
          locale !== "en" &&
          (pending || row.state === "approved"),
      )
      .map((row) => [row.field, row.value]),
  );
  const get = (key: string) => target.get(key) ?? source.get(key);
  const envelope: ApartmentEnvelope = {
    schemaVersion: 1,
    localeMode: locale === "en" || target.size > 0 ? "custom" : "inherit",
    content: {
      name: get("name") ?? identity.slug,
      badge: get("badge") ?? identity.badge,
      description: get("description") ?? "",
      meta_title: get("meta_title") ?? null,
      meta_description: get("meta_description") ?? null,
      bedrooms: identity.bedrooms,
      bathrooms: identity.bathrooms,
      max_guests: identity.max_guests,
      beds_count: identity.beds_count,
      size_m2: identity.size_m2,
      floor: identity.floor,
      cover_media_id: identity.cover_media_id,
      og_image_media_id: identity.og_image_media_id,
      gallery,
      avantio_id: identity.avantio_id,
      default_booking_url: identity.avantio_url,
      booking_url: null,
    },
  };
  if (!strict) return envelope;
  const checked = checkApartmentEnvelope(envelope);
  if (!checked.envelope || Object.keys(checked.errors).length)
    throw new LegacyApartmentError();
  return checked.envelope;
}
export async function legacyApartmentLocaleRows(
  identity: ApartmentIdentity,
  strict = true,
): Promise<ApartmentLocaleRow[]> {
  const [translations, gallery] = await Promise.all([
    loadTranslationRows({ type: "apartment", id: identity.id }),
    db
      .select()
      .from(apartment_media)
      .where(eq(apartment_media.apartment_id, identity.id))
      .orderBy(asc(apartment_media.position)),
  ]);
  return PROPERTY_EDITOR_LOCALES.map((locale) => {
    const published =
      identity.status === "published"
        ? legacyApartmentEnvelope(
            identity,
            translations,
            gallery.map((row) => row.media_id),
            locale,
            false,
            strict,
          )
        : null;
    const pending = translations.some(
      (row) =>
        row.locale === locale && locale !== "en" && row.state !== "approved",
    );
    const draft =
      !published || pending
        ? legacyApartmentEnvelope(
            identity,
            translations,
            gallery.map((row) => row.media_id),
            locale,
            true,
            strict,
          )
        : null;
    return {
      id: identity.id,
      apartment_id: identity.id,
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
export async function readApartmentLocaleRows(
  identity: ApartmentIdentity,
  strict = true,
): Promise<ApartmentLocaleRow[]> {
  const rows = await db
    .select()
    .from(apartment_locale_content)
    .where(eq(apartment_locale_content.apartment_id, identity.id));
  if (
    rows.length === 4 &&
    rows.every((row) =>
      [row.draft, row.published].every((value) => !value || value.localeMode),
    )
  )
    return rows;
  const legacy = await legacyApartmentLocaleRows(identity, strict);
  for (const row of rows) {
    const baseline = legacy.find((value) => value.locale === row.locale);
    for (const key of ["draft", "published"] as const) {
      const value = row[key];
      if (value && !value.localeMode)
        row[key] = {
          ...value,
          localeMode:
            row.locale === "en" || row.revision > 0
              ? "custom"
              : (baseline?.[key]?.localeMode ??
                baseline?.draft?.localeMode ??
                baseline?.published?.localeMode ??
                "inherit"),
        };
    }
  }
  return PROPERTY_EDITOR_LOCALES.map(
    (locale) =>
      rows.find((row) => row.locale === locale) ??
      legacy.find((row) => row.locale === locale)!,
  );
}
export async function bootstrapApartmentLocales(
  identity: ApartmentIdentity,
  actor: string,
) {
  const existing = await db
    .select()
    .from(apartment_locale_content)
    .where(eq(apartment_locale_content.apartment_id, identity.id));
  if (existing.length === 4) return;
  const rows = await legacyApartmentLocaleRows(identity);
  await db.batch([
    propertyGraphLockQuery(),
    db
      .insert(apartment_locale_content)
      .values(
        rows.map((row) => ({
          apartment_id: row.apartment_id,
          locale: row.locale,
          published: row.published,
          draft: row.draft,
          revision: 0,
          published_at: row.published_at,
          draft_saved_at: row.draft_saved_at,
          updated_by: actor,
        })),
      )
      .onConflictDoNothing(),
  ]);
}
export async function readApartmentIdentity(id: string) {
  const [row] = await db
    .select()
    .from(apartment)
    .where(eq(apartment.id, id))
    .limit(1);
  return row ?? null;
}
export function apartmentSlugMap(id: string) {
  return loadAlternateSlugs("apartment", id);
}
