import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { type ContentRef, loadContent } from "@core/i18n/content";
import { loadMedia, mediaUrl } from "@core/media";
import type { AdminMediaPreview } from "@slices/backoffice/contract";
import { listCities, listNeighbourhoods } from "@slices/geography/contract";
import { AMENITY, BUILDING, BUILDING_FAQ } from "../contract";
import { amenity, building, building_amenity, building_faq, building_media } from "../schema";

/**
 * Backoffice reads for slice `buildings` (S12). Unlike the public reads these are
 * NOT cache-wrapped and return **all** statuses (draft/published/archived) +
 * **source-locale** ([T] en) values for editing. Live data — admin routes are
 * dynamic (auth), no ISR.
 */

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

  return rows.map((r) => ({
    id: r.id,
    name: content.get(BUILDING, r.id, "name") ?? r.slug,
    slug: r.slug,
    status: r.status,
    city: cityName.get(r.city_id) ?? "",
    position: r.position,
    isNew: r.is_new,
    isFeatured: r.is_featured,
    apartments: r.apartments_count,
  }));
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
export async function getBuildingForEdit(id: string): Promise<BuildingEditBundle | null> {
  const [row] = await db.select().from(building).where(eq(building.id, id)).limit(1);
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
  const refs: ContentRef[] = [{ type: BUILDING, id }, ...faqIds.map((fid) => ({ type: BUILDING_FAQ, id: fid }))];
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
    description_neighbourhood: content.get(BUILDING, id, "description_neighbourhood") ?? "",
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

/** Build admin previews for a set of media ids (drops blanks / missing). */
async function resolvePreviews(ids: (string | null)[]): Promise<Record<string, AdminMediaPreview>> {
  const clean = Array.from(new Set(ids.filter((x): x is string => !!x)));
  if (clean.length === 0) return {};
  const assets = await loadMedia(clean);
  const out: Record<string, AdminMediaPreview> = {};
  for (const [mid, a] of assets) {
    out[mid] = { id: mid, url: mediaUrl(a.r2_key), width: a.width, height: a.height, mime: a.mime };
  }
  return out;
}

export interface AmenityOption {
  id: string;
  label: string;
  group: string | null;
}

/** The full amenity taxonomy (source labels) for the multi-select. */
export async function listAmenitiesAdmin(): Promise<AmenityOption[]> {
  const rows = await db
    .select({ id: amenity.id, slug: amenity.slug, group: amenity.group })
    .from(amenity)
    .orderBy(asc(amenity.group), asc(amenity.slug));
  if (rows.length === 0) return [];
  const content = await loadContent(
    rows.map((a) => ({ type: AMENITY, id: a.id })),
    SOURCE,
  );
  return rows.map((a) => ({
    id: a.id,
    label: content.get(AMENITY, a.id, "label") ?? a.slug,
    group: a.group,
  }));
}

/**
 * Lean `{ id, name }` options of **all** buildings (every status), source names —
 * for the apartments admin building selector (exported on the buildings contract so
 * S3 doesn't read the building table directly).
 */
export async function listBuildingOptions(): Promise<{ id: string; name: string }[]> {
  const rows = await db
    .select({ id: building.id, slug: building.slug })
    .from(building)
    .orderBy(asc(building.position));
  if (rows.length === 0) return [];
  const content = await loadContent(
    rows.map((r) => ({ type: BUILDING, id: r.id })),
    SOURCE,
  );
  return rows.map((r) => ({ id: r.id, name: content.get(BUILDING, r.id, "name") ?? r.slug }));
}

export interface LocationOptions {
  cities: { id: string; name: string }[];
  neighbourhoods: { id: string; name: string; cityId: string }[];
}

/** City + neighbourhood options (source names) for the location selects. */
export async function listLocationOptions(): Promise<LocationOptions> {
  const [cities, neighbourhoods] = await Promise.all([
    listCities(SOURCE),
    listNeighbourhoods(SOURCE),
  ]);
  return {
    cities: cities.map((c) => ({ id: c.id, name: c.name })),
    neighbourhoods: neighbourhoods.map((n) => ({ id: n.id, name: n.name, cityId: n.cityId })),
  };
}
