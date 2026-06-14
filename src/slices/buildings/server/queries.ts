import "server-only";
import { unstable_cache } from "next/cache";
import { type SQL, and, asc, eq } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import {
  type ContentRef,
  type ContentResolver,
  loadAlternateSlugs,
  loadContent,
  loadSlugs,
  resolveSlug,
} from "@core/i18n/content";
import { slug as slugTable } from "@core/i18n/schema";
import { type MediaAsset, type MediaImageData, loadMedia, mediaUrl } from "@core/media";
// Geography is consumed ONLY through its public contract (golden rule 2): we never
// query the city/neighbourhood tables directly. GEO_TAGS.list is added to our cache
// tags so a geography publish busts building reads that embed its content.
import {
  GEO_TAGS,
  type CityRef,
  type NeighbourhoodRef,
  listCities,
  listNeighbourhoods,
} from "@slices/geography/contract";
import {
  AMENITY,
  BUILDING,
  BUILDING_FAQ,
  BUILDING_TAGS,
} from "../contract";
import type {
  AmenityRef,
  BuildingDetail,
  BuildingFaqItem,
  BuildingFilter,
  BuildingLocation,
  BuildingSummary,
} from "../contract";
import { amenity, building, building_amenity, building_faq, building_media } from "../schema";

/**
 * Public read functions for slice `buildings` (conventions.md → reads go through
 * typed, cache-tagged `server/` functions; never the DB at request time). Each is
 * wrapped in `unstable_cache` keyed by locale and tagged `building-list` (+ a
 * per-building tag on detail) so a publish busts them (see `./publish`). City &
 * neighbourhood names come from the geography contract; their `[T]` plus our own
 * `[T]` fields (name, headline, teaser, description_*, meta_*) resolve via `core/i18n`.
 */

// ── Row shapes ───────────────────────────────────────────────────────────────
interface BuildingRow {
  id: string;
  slug: string;
  city_id: string;
  neighbourhood_id: string | null;
  street_address: string | null;
  cover_media_id: string | null;
  is_new: boolean;
  is_featured: boolean;
  apartments_count: number;
  total_capacity: number;
  beds_count: number;
}

const summarySelect = {
  id: building.id,
  slug: building.slug,
  city_id: building.city_id,
  neighbourhood_id: building.neighbourhood_id,
  street_address: building.street_address,
  cover_media_id: building.cover_media_id,
  is_new: building.is_new,
  is_featured: building.is_featured,
  apartments_count: building.apartments_count,
  total_capacity: building.total_capacity,
  beds_count: building.beds_count,
} as const;

const DEFAULT_W = 1600;
const DEFAULT_H = 1200;

function toImageData(asset: MediaAsset | undefined, alt: string): MediaImageData | null {
  if (!asset) return null;
  return {
    url: mediaUrl(asset.r2_key),
    width: asset.width ?? DEFAULT_W,
    height: asset.height ?? DEFAULT_H,
    alt,
    blurhash: asset.blurhash,
  };
}

// ── Location resolution (via geography contract) ───────────────────────────────
interface LocationMaps {
  cities: Map<string, CityRef>;
  neighbourhoods: Map<string, NeighbourhoodRef>;
}

/** Load the (small, cached) taxonomy once and index by id for O(1) lookup. */
async function loadLocationMaps(locale: Locale): Promise<LocationMaps> {
  const [cities, neighbourhoods] = await Promise.all([
    listCities(locale),
    listNeighbourhoods(locale),
  ]);
  return {
    cities: new Map(cities.map((c) => [c.id, c])),
    neighbourhoods: new Map(neighbourhoods.map((n) => [n.id, n])),
  };
}

function cityLocation(id: string, maps: LocationMaps): BuildingLocation {
  const c = maps.cities.get(id);
  return { id, slug: c?.slug ?? "", name: c?.name ?? "" };
}

function neighbourhoodLocation(
  id: string | null,
  maps: LocationMaps,
): BuildingLocation | null {
  if (!id) return null;
  const n = maps.neighbourhoods.get(id);
  return { id, slug: n?.slug ?? "", name: n?.name ?? "" };
}

// ── Summary mapping ────────────────────────────────────────────────────────────
interface SummaryCtx {
  content: ContentResolver;
  slugs: Map<string, string>;
  media: Map<string, MediaAsset>;
  maps: LocationMaps;
}

async function buildCtx(rows: BuildingRow[], locale: Locale): Promise<SummaryCtx> {
  const refs: ContentRef[] = [];
  const coverIds: string[] = [];
  const ids: string[] = [];
  for (const r of rows) {
    ids.push(r.id);
    refs.push({ type: BUILDING, id: r.id });
    if (r.cover_media_id) {
      refs.push({ type: "media_asset", id: r.cover_media_id });
      coverIds.push(r.cover_media_id);
    }
  }
  const [content, slugs, media, maps] = await Promise.all([
    loadContent(refs, locale),
    loadSlugs(BUILDING, ids, locale),
    loadMedia(coverIds),
    loadLocationMaps(locale),
  ]);
  return { content, slugs, media, maps };
}

function mapSummary(row: BuildingRow, ctx: SummaryCtx): BuildingSummary {
  const { content, slugs, media, maps } = ctx;
  const name = content.get(BUILDING, row.id, "name") ?? row.slug;
  const cover = row.cover_media_id
    ? toImageData(
        media.get(row.cover_media_id),
        content.get("media_asset", row.cover_media_id, "alt") ?? name,
      )
    : null;

  return {
    id: row.id,
    slug: slugs.get(row.id) ?? row.slug,
    name,
    headline: content.get(BUILDING, row.id, "headline") ?? "",
    teaser: content.get(BUILDING, row.id, "teaser") ?? "",
    streetAddress: row.street_address,
    city: cityLocation(row.city_id, maps),
    neighbourhood: neighbourhoodLocation(row.neighbourhood_id, maps),
    cover,
    isNew: row.is_new,
    isFeatured: row.is_featured,
    stats: {
      apartments: row.apartments_count,
      capacity: row.total_capacity,
      beds: row.beds_count,
    },
  };
}

// ── Filter → SQL ───────────────────────────────────────────────────────────────
function whereFor(filter?: BuildingFilter): SQL | undefined {
  const conds: SQL[] = [eq(building.status, "published")];
  if (filter?.cityId) conds.push(eq(building.city_id, filter.cityId));
  if (filter?.neighbourhoodId) conds.push(eq(building.neighbourhood_id, filter.neighbourhoodId));
  if (filter?.isNew !== undefined) conds.push(eq(building.is_new, filter.isNew));
  if (filter?.isFeatured !== undefined) conds.push(eq(building.is_featured, filter.isFeatured));
  return and(...conds);
}

function filterKey(filter?: BuildingFilter): string {
  if (!filter) return "all";
  return JSON.stringify({
    c: filter.cityId ?? "",
    n: filter.neighbourhoodId ?? "",
    new: filter.isNew ?? "",
    feat: filter.isFeatured ?? "",
  });
}

// ── Public, cache-wrapped reads ──────────────────────────────────────────────
async function _listBuildings(locale: Locale, filter?: BuildingFilter): Promise<BuildingSummary[]> {
  const rows = await db
    .select(summarySelect)
    .from(building)
    .where(whereFor(filter))
    .orderBy(asc(building.position));
  const ctx = await buildCtx(rows, locale);
  return rows.map((r) => mapSummary(r, ctx));
}

export function listBuildings(
  locale: Locale,
  filter?: BuildingFilter,
): Promise<BuildingSummary[]> {
  return unstable_cache(
    () => _listBuildings(locale, filter),
    ["buildings:listBuildings", locale, filterKey(filter)],
    { tags: [BUILDING_TAGS.list, GEO_TAGS.list] },
  )();
}

async function _getFeaturedBuildings(locale: Locale, limit: number): Promise<BuildingSummary[]> {
  const rows = await db
    .select(summarySelect)
    .from(building)
    .where(and(eq(building.status, "published"), eq(building.is_featured, true)))
    .orderBy(asc(building.position))
    .limit(limit);
  const ctx = await buildCtx(rows, locale);
  return rows.map((r) => mapSummary(r, ctx));
}

/** Featured portfolio (home page, S9). Defaults to 3 per the content brief. */
export function getFeaturedBuildings(locale: Locale, limit = 3): Promise<BuildingSummary[]> {
  return unstable_cache(
    () => _getFeaturedBuildings(locale, limit),
    ["buildings:getFeaturedBuildings", locale, String(limit)],
    { tags: [BUILDING_TAGS.list, GEO_TAGS.list] },
  )();
}

async function _getBuildingBySlug(locale: Locale, slugValue: string): Promise<BuildingDetail | null> {
  const id = await resolveSlug(BUILDING, locale, slugValue);
  if (!id) return null;

  const detailRows = await db
    .select({
      ...summarySelect,
      latitude: building.latitude,
      longitude: building.longitude,
      og_image_media_id: building.og_image_media_id,
      avantio_id: building.avantio_id,
      avantio_url: building.avantio_url,
    })
    .from(building)
    .where(and(eq(building.id, id), eq(building.status, "published")))
    .limit(1);

  const detail = detailRows[0];
  if (!detail) return null;

  // Gallery, amenities and FAQ are all building-owned tables (this slice).
  const [galleryRows, amenityRows, faqRows] = await Promise.all([
    db
      .select({ media_id: building_media.media_id, position: building_media.position })
      .from(building_media)
      .where(eq(building_media.building_id, id))
      .orderBy(asc(building_media.position)),
    db
      .select({
        id: amenity.id,
        slug: amenity.slug,
        icon: amenity.icon,
        group: amenity.group,
      })
      .from(building_amenity)
      .innerJoin(amenity, eq(building_amenity.amenity_id, amenity.id))
      .where(eq(building_amenity.building_id, id))
      .orderBy(asc(amenity.slug)),
    db
      .select({ id: building_faq.id, position: building_faq.position })
      .from(building_faq)
      .where(eq(building_faq.building_id, id))
      .orderBy(asc(building_faq.position)),
  ]);

  const ctx = await buildCtx([detail], locale);
  const summary = mapSummary(detail, ctx);

  // Gallery media + [T] alt.
  const galleryIds = galleryRows.map((g) => g.media_id);
  const gallery: MediaImageData[] = [];
  if (galleryIds.length) {
    const [galleryMedia, galleryAlt] = await Promise.all([
      loadMedia(galleryIds),
      loadContent(
        galleryIds.map((mid) => ({ type: "media_asset", id: mid })),
        locale,
      ),
    ]);
    for (const mid of galleryIds) {
      const img = toImageData(
        galleryMedia.get(mid),
        galleryAlt.get("media_asset", mid, "alt") ?? summary.name,
      );
      if (img) gallery.push(img);
    }
  }

  // Amenities ([T] label) + FAQ ([T] question/answer) in one content batch.
  const amenityContent = await loadContent(
    amenityRows.map((a) => ({ type: AMENITY, id: a.id })),
    locale,
  );
  const amenities: AmenityRef[] = amenityRows.map((a) => ({
    id: a.id,
    slug: a.slug,
    icon: a.icon,
    group: a.group,
    label: amenityContent.get(AMENITY, a.id, "label") ?? a.slug,
  }));

  const faqContent = await loadContent(
    faqRows.map((f) => ({ type: BUILDING_FAQ, id: f.id })),
    locale,
  );
  const faq: BuildingFaqItem[] = faqRows
    .map((f) => ({
      id: f.id,
      question: faqContent.get(BUILDING_FAQ, f.id, "question") ?? "",
      answer: faqContent.get(BUILDING_FAQ, f.id, "answer") ?? "",
    }))
    .filter((f) => f.question && f.answer);

  // OG image: explicit override, else cover.
  let ogImage = summary.cover;
  if (detail.og_image_media_id) {
    const ogMap = await loadMedia([detail.og_image_media_id]);
    ogImage =
      toImageData(
        ogMap.get(detail.og_image_media_id),
        ctx.content.get("media_asset", detail.og_image_media_id, "alt") ?? summary.name,
      ) ?? summary.cover;
  }

  const alternateSlugs = await loadAlternateSlugs(BUILDING, id);

  return {
    ...summary,
    descriptionIntro: ctx.content.get(BUILDING, id, "description_intro") ?? "",
    descriptionNeighbourhood: ctx.content.get(BUILDING, id, "description_neighbourhood") ?? null,
    latitude: detail.latitude,
    longitude: detail.longitude,
    gallery,
    amenities,
    faq,
    avantio: { id: detail.avantio_id, url: detail.avantio_url },
    metaTitle: ctx.content.get(BUILDING, id, "meta_title") ?? undefined,
    metaDescription: ctx.content.get(BUILDING, id, "meta_description") ?? undefined,
    ogImage,
    alternateSlugs,
  };
}

export function getBuildingBySlug(locale: Locale, slugValue: string): Promise<BuildingDetail | null> {
  return unstable_cache(
    () => _getBuildingBySlug(locale, slugValue),
    ["buildings:getBuildingBySlug", locale, slugValue],
    { tags: [BUILDING_TAGS.list, GEO_TAGS.list] },
  )();
}

/** For `generateStaticParams`: every published building's slug, per locale. */
export async function listBuildingParams(): Promise<Array<{ locale: Locale; slug: string }>> {
  const rows = await db
    .select({ locale: slugTable.locale, slug: slugTable.slug })
    .from(slugTable)
    .innerJoin(building, eq(slugTable.entity_id, building.id))
    .where(and(eq(slugTable.entity_type, BUILDING), eq(building.status, "published")));
  return rows.map((r) => ({ locale: r.locale, slug: r.slug }));
}
