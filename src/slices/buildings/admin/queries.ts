import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@core/db/client";
import {
  type ContentRef,
  loadContent,
  loadTranslationRows,
} from "@core/i18n/content";
import { loadMedia, mediaUrl } from "@core/media";
import type { AdminMediaPreview } from "@slices/backoffice/contract";
import { listCities, listLocationNameOptions } from "@slices/geography/contract";
import { AMENITY, BUILDING, BUILDING_FAQ } from "../contract";
import {
  AMENITY_LABEL_LOCALES,
  AMENITY_TARGET_LOCALES,
  type AmenityLabels,
  type AmenityTranslations,
} from "../amenity-types";
import {
  readBuildingIdentity,
  readBuildingLocaleRows,
  buildingSlugMap,
} from "../server/editorial-bootstrap";
import {
  amenity,
  building,
  building_amenity,
  building_faq,
  building_media,
} from "../schema";

/**
 * Backoffice reads for slice `buildings` (S12). Unlike the public reads these are
 * NOT cache-wrapped and return **all** statuses (draft/published/archived) +
 * **source-locale** ([T] en) values for editing. Live data — admin routes are
 * dynamic (auth), no ISR.
 */

import { readBuildingSharedState } from "../server/shared-content";
const SOURCE = "en" as const;

type BuildingStatus = "draft" | "published" | "archived";

export interface BuildingAdminListItem {
  id: string;
  name: string;
  slug: string;
  status: BuildingStatus;
  city: string;
  position: number;
  isNew: boolean;
  isFeatured: boolean;
  apartments: number;
  localeStates: Record<string, { published: boolean; draft: boolean }>;
}

/** All buildings for the inbox list (every status), in display order. */
export async function listBuildingsAdmin(): Promise<BuildingAdminListItem[]> {
  const rows = await db
    .select({
      id: building.id,
      slug: building.slug,
      status: building.status,
      city_id: building.city_id,
      position: building.position,
      is_new: building.is_new,
      is_featured: building.is_featured,
      apartments_count: building.apartments_count,
    })
    .from(building)
    .orderBy(asc(building.position));

  const [content, cities] = await Promise.all([
    loadContent(
      rows.map((r) => ({ type: BUILDING, id: r.id })),
      SOURCE,
    ),
    listCities(SOURCE),
  ]);
  const cityName = new Map(cities.map((c) => [c.id, c.name]));

  return Promise.all(
    rows.map(async (r) => {
      const identity = await readBuildingIdentity(r.id);
      const locales = identity
        ? await readBuildingLocaleRows(identity, false)
        : [];
      const en = locales.find((row) => row.locale === "en");
      const latest = en?.draft ?? en?.published;
      const shared = identity
        ? (await readBuildingSharedState(identity, locales)).content
        : {};
      return {
        id: r.id,
        name:
          latest?.content.name || content.get(BUILDING, r.id, "name") || r.slug,
        slug: r.slug,
        status:
          r.status === "archived"
            ? ("archived" as const)
            : locales.some((row) => row.published)
              ? ("published" as const)
              : ("draft" as const),
        city: cityName.get(shared.city_id ?? r.city_id) ?? "",
        position: shared.position ?? r.position,
        isNew: shared.is_new ?? r.is_new,
        isFeatured: shared.is_featured ?? r.is_featured,
        apartments: r.apartments_count,
        localeStates: Object.fromEntries(
          locales.map((row) => [
            row.locale,
            { published: Boolean(row.published), draft: Boolean(row.draft) },
          ]),
        ),
      };
    }),
  );
}

export interface BuildingEditData {
  id: string;
  slug: string;
  status: BuildingStatus;
  position: number;
  is_new: boolean;
  is_featured: boolean;
  city_id: string;
  neighbourhood_id: string | null;
  street_address: string;
  latitude: number | null;
  longitude: number | null;
  cover_media_id: string | null;
  og_image_media_id: string | null;
  avantio_id: string | null;
  avantio_url: string | null;
  booking_enabled: boolean;
  name: string;
  headline: string;
  teaser: string;
  description_intro: string;
  description_neighbourhood: string;
  meta_title: string;
  meta_description: string;
  gallery: string[];
  amenity_ids: string[];
  faq: { id: string; question: string; answer: string }[];
}

export interface BuildingEditBundle {
  data: BuildingEditData;
  /** Resolved previews for cover + og + gallery, keyed by media id. */
  previews: Record<string, AdminMediaPreview>;
}

/** Full editable record for one building (source-locale values), or null. */
export async function getBuildingForEdit(
  id: string,
): Promise<BuildingEditBundle | null> {
  const [row] = await db
    .select()
    .from(building)
    .where(eq(building.id, id))
    .limit(1);
  if (!row) return null;

  const [galleryRows, amenityRows, faqRows] = await Promise.all([
    db
      .select({ media_id: building_media.media_id })
      .from(building_media)
      .where(eq(building_media.building_id, id))
      .orderBy(asc(building_media.position)),
    db
      .select({ amenity_id: building_amenity.amenity_id })
      .from(building_amenity)
      .where(eq(building_amenity.building_id, id)),
    db
      .select({ id: building_faq.id })
      .from(building_faq)
      .where(eq(building_faq.building_id, id))
      .orderBy(asc(building_faq.position)),
  ]);

  const faqIds = faqRows.map((f) => f.id);
  const refs: ContentRef[] = [
    { type: BUILDING, id },
    ...faqIds.map((fid) => ({ type: BUILDING_FAQ, id: fid })),
  ];
  const content = await loadContent(refs, SOURCE);

  const data: BuildingEditData = {
    id: row.id,
    slug: row.slug,
    status: row.status,
    position: row.position,
    is_new: row.is_new,
    is_featured: row.is_featured,
    city_id: row.city_id,
    neighbourhood_id: row.neighbourhood_id,
    street_address: row.street_address ?? "",
    latitude: row.latitude,
    longitude: row.longitude,
    cover_media_id: row.cover_media_id,
    og_image_media_id: row.og_image_media_id,
    avantio_id: row.avantio_id,
    avantio_url: row.avantio_url,
    booking_enabled: row.booking_enabled,
    name: content.get(BUILDING, id, "name") ?? "",
    headline: content.get(BUILDING, id, "headline") ?? "",
    teaser: content.get(BUILDING, id, "teaser") ?? "",
    description_intro: content.get(BUILDING, id, "description_intro") ?? "",
    description_neighbourhood:
      content.get(BUILDING, id, "description_neighbourhood") ?? "",
    meta_title: content.get(BUILDING, id, "meta_title") ?? "",
    meta_description: content.get(BUILDING, id, "meta_description") ?? "",
    gallery: galleryRows.map((g) => g.media_id),
    amenity_ids: amenityRows.map((a) => a.amenity_id),
    faq: faqIds.map((fid) => ({
      id: fid,
      question: content.get(BUILDING_FAQ, fid, "question") ?? "",
      answer: content.get(BUILDING_FAQ, fid, "answer") ?? "",
    })),
  };

  const previews = await resolvePreviews([
    row.cover_media_id,
    row.og_image_media_id,
    ...data.gallery,
  ]);

  return { data, previews };
}

export interface BuildingWorkspace {
  id: string;
  /** Source-locale ([T] en) name, falling back to the slug. */
  name: string;
  status: BuildingStatus;
  /** Public detail URL in the source locale (`/en/buildings/<slug>`). */
  publicPath: string;
}

/**
 * Header data for the building workspace (`/admin/buildings/[id]` layout): name,
 * status and public URL. The apartment count is composed by the route from the
 * apartments slice — this slice never reads apartments.
 */
export async function getBuildingWorkspace(
  id: string,
): Promise<BuildingWorkspace | null> {
  const [row] = await db
    .select({ id: building.id, slug: building.slug, status: building.status })
    .from(building)
    .where(eq(building.id, id))
    .limit(1);
  if (!row) return null;
  const [content, identity, slugs] = await Promise.all([
    loadContent([{ type: BUILDING, id }], SOURCE),
    readBuildingIdentity(id),
    buildingSlugMap(id),
  ]);
  const rows = identity ? await readBuildingLocaleRows(identity, false) : [];
  const en = rows.find((r) => r.locale === "en");
  const published =
    rows.find((r) => r.locale === "en" && r.published) ??
    rows.find((r) => r.published);
  return {
    id: row.id,
    name:
      (en?.draft ?? en?.published)?.content.name ||
      content.get(BUILDING, id, "name") ||
      row.slug,
    status:
      row.status === "archived"
        ? "archived"
        : published
          ? "published"
          : "draft",
    publicPath: published
      ? `/${published.locale}/buildings/${slugs[published.locale] ?? row.slug}`
      : "",
  };
}

/** Build admin previews for a set of media ids (drops blanks / missing). */
async function resolvePreviews(
  ids: (string | null)[],
): Promise<Record<string, AdminMediaPreview>> {
  const clean = Array.from(new Set(ids.filter((x): x is string => !!x)));
  if (clean.length === 0) return {};
  const assets = await loadMedia(clean);
  const out: Record<string, AdminMediaPreview> = {};
  for (const [mid, a] of assets) {
    out[mid] = {
      id: mid,
      url: mediaUrl(a.r2_key),
      width: a.width,
      height: a.height,
      mime: a.mime,
    };
  }
  return out;
}

export interface AmenityOption {
  id: string;
  label: string;
  /** Approved localized names with English fallback; optional for older callers. */
  labels?: import("../amenity-types").AmenityLabels;
  group: string | null;
}

/** Full taxonomy with approved names for each Building editor language. */
export async function listAmenitiesAdmin(): Promise<AmenityOption[]> {
  const rows = await db
    .select({ id: amenity.id, slug: amenity.slug, group: amenity.group })
    .from(amenity)
    .orderBy(asc(amenity.group), asc(amenity.slug));
  if (rows.length === 0) return [];
  const refs = rows.map((a) => ({ type: AMENITY, id: a.id }));
  const contents = await Promise.all(
    AMENITY_LABEL_LOCALES.map((locale) => loadContent(refs, locale)),
  );
  return rows.map((a) => {
    const label = contents[0]!.get(AMENITY, a.id, "label")?.trim() || a.slug;
    const labels = Object.fromEntries(
      AMENITY_LABEL_LOCALES.map((locale, index) => [
        locale,
        contents[index]!.get(AMENITY, a.id, "label")?.trim() || label,
      ]),
    ) as AmenityLabels;
    return { id: a.id, label: labels.en, labels, group: a.group };
  });
}

// ── Amenity taxonomy editor (`/admin/amenities`) ──────────────────────────────
export interface AmenityAdminListItem {
  id: string;
  label: string;
  slug: string;
  icon: string | null;
  group: string | null;
  /** How many buildings list this amenity (deleting it removes it from all of them). */
  buildings: number;
}

/** The amenity taxonomy (source labels) for the list screen, grouped then by slug. */
export async function listAmenitiesForAdminTable(): Promise<
  AmenityAdminListItem[]
> {
  const rows = await db
    .select({
      id: amenity.id,
      slug: amenity.slug,
      icon: amenity.icon,
      group: amenity.group,
      buildings: count(building_amenity.building_id),
    })
    .from(amenity)
    .leftJoin(building_amenity, eq(building_amenity.amenity_id, amenity.id))
    .groupBy(amenity.id)
    .orderBy(asc(amenity.group), asc(amenity.slug));
  if (rows.length === 0) return [];
  const content = await loadContent(
    rows.map((a) => ({ type: AMENITY, id: a.id })),
    SOURCE,
  );
  return rows.map((a) => ({
    id: a.id,
    label: content.get(AMENITY, a.id, "label") ?? a.slug,
    slug: a.slug,
    icon: a.icon,
    group: a.group,
    buildings: a.buildings,
  }));
}

export interface AmenityEditData {
  id: string;
  slug: string;
  /** `""` when unset (the building page then draws `check-circle`). */
  icon: string;
  group: string;
  label: string;
  /** Actual authored target values, including pending work; never fallback copies. */
  translations?: import("../amenity-types").AmenityTranslations;
  buildings: number;
}

/** Raw authored labels, including pending target work; absent targets stay blank. */
export async function getAmenityForEdit(
  id: string,
): Promise<AmenityEditData | null> {
  const [row] = await db
    .select()
    .from(amenity)
    .where(eq(amenity.id, id))
    .limit(1);
  if (!row) return null;
  const [translations, [usage]] = await Promise.all([
    loadTranslationRows({ type: AMENITY, id }),
    db
      .select({ n: count() })
      .from(building_amenity)
      .where(eq(building_amenity.amenity_id, id)),
  ]);
  return {
    id: row.id,
    slug: row.slug,
    icon: row.icon ?? "",
    group: row.group ?? "",
    label:
      translations.find(
        (value) => value.field === "label" && value.locale === SOURCE,
      )?.value ?? "",
    translations: Object.fromEntries(
      AMENITY_TARGET_LOCALES.map((locale) => [
        locale,
        translations.find(
          (value) => value.field === "label" && value.locale === locale,
        )?.value ?? "",
      ]),
    ) as AmenityTranslations,
    buildings: usage?.n ?? 0,
  };
}

/**
 * Lean `{ id, name }` options of **all** buildings (every status), source names —
 * for the apartments admin building selector (exported on the buildings contract so
 * S3 doesn't read the building table directly).
 */
export async function listBuildingOptions(): Promise<
  { id: string; name: string }[]
> {
  return (await listBuildingsAdmin()).map((row) => ({
    id: row.id,
    name: row.name,
  }));
}

export type LocationOptions = import("@slices/geography/contract").GeographyLocationOptions;

/** Published location IDs with approved labels for each editor language. */
export async function listLocationOptions(): Promise<LocationOptions> {
  return listLocationNameOptions();
}
