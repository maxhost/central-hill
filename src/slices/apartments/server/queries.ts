import "server-only";
import { unstable_cache } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
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
import { type MediaAsset, type MediaImageData, loadMedia, mediaUrl } from "@core/media";
import {
  APARTMENT,
  APARTMENT_TAGS,
  type ApartmentDetail,
  type ApartmentSummary,
} from "../contract";
import { apartment, apartment_media } from "../schema";

/**
 * Public read functions for slice `apartments` (conventions.md → reads go through
 * typed, cache-tagged `server/` functions; never the DB at request time). Each is
 * wrapped in `unstable_cache` keyed by locale and tagged `apartment-list` (+ a
 * per-unit tag on detail) so a publish busts them (see `./publish`). The
 * `name`/`badge`/`description`/`meta_*` [T] fields resolve via `core/i18n`.
 */

// ── Row shape ────────────────────────────────────────────────────────────────
interface ApartmentRow {
  id: string;
  slug: string;
  building_id: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  beds_count: number;
  size_m2: number | null;
  floor: number | null;
  cover_media_id: string | null;
  avantio_id: string | null;
  avantio_url: string | null;
}

const summarySelect = {
  id: apartment.id,
  slug: apartment.slug,
  building_id: apartment.building_id,
  bedrooms: apartment.bedrooms,
  bathrooms: apartment.bathrooms,
  max_guests: apartment.max_guests,
  beds_count: apartment.beds_count,
  size_m2: apartment.size_m2,
  floor: apartment.floor,
  cover_media_id: apartment.cover_media_id,
  avantio_id: apartment.avantio_id,
  avantio_url: apartment.avantio_url,
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

// ── Summary mapping ──────────────────────────────────────────────────────────
interface SummaryCtx {
  content: ContentResolver;
  slugs: Map<string, string>;
  media: Map<string, MediaAsset>;
}

async function buildCtx(rows: ApartmentRow[], locale: Locale): Promise<SummaryCtx> {
  const refs: ContentRef[] = [];
  const coverIds: string[] = [];
  const ids: string[] = [];
  for (const r of rows) {
    ids.push(r.id);
    refs.push({ type: APARTMENT, id: r.id });
    if (r.cover_media_id) {
      refs.push({ type: "media_asset", id: r.cover_media_id });
      coverIds.push(r.cover_media_id);
    }
  }
  const [content, slugs, media] = await Promise.all([
    loadContent(refs, locale),
    loadSlugs(APARTMENT, ids, locale),
    loadMedia(coverIds),
  ]);
  return { content, slugs, media };
}

function mapSummary(row: ApartmentRow, ctx: SummaryCtx): ApartmentSummary {
  const { content, slugs, media } = ctx;
  const name = content.get(APARTMENT, row.id, "name") ?? row.slug;
  const cover = row.cover_media_id
    ? toImageData(
        media.get(row.cover_media_id),
        content.get("media_asset", row.cover_media_id, "alt") ?? name,
      )
    : null;

  return {
    id: row.id,
    slug: slugs.get(row.id) ?? row.slug,
    buildingId: row.building_id,
    name,
    badge: content.get(APARTMENT, row.id, "badge") ?? null,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    maxGuests: row.max_guests,
    bedsCount: row.beds_count,
    sizeM2: row.size_m2,
    floor: row.floor,
    cover,
    avantio: { id: row.avantio_id, url: row.avantio_url },
  };
}

// ── Public, cache-wrapped reads ──────────────────────────────────────────────
async function _listByBuilding(locale: Locale, buildingId: string): Promise<ApartmentSummary[]> {
  const rows = await db
    .select(summarySelect)
    .from(apartment)
    .where(and(eq(apartment.building_id, buildingId), eq(apartment.status, "published")))
    .orderBy(asc(apartment.position));
  if (rows.length === 0) return [];
  const ctx = await buildCtx(rows, locale);
  return rows.map((r) => mapSummary(r, ctx));
}

/** Published units of a building, in display order (the "Apartments in this Building" grid). */
export function listByBuilding(locale: Locale, buildingId: string): Promise<ApartmentSummary[]> {
  return unstable_cache(
    () => _listByBuilding(locale, buildingId),
    ["apartments:listByBuilding", locale, buildingId],
    { tags: [APARTMENT_TAGS.list] },
  )();
}

async function _getApartmentBySlug(locale: Locale, slugValue: string): Promise<ApartmentDetail | null> {
  const id = await resolveSlug(APARTMENT, locale, slugValue);
  if (!id) return null;

  const detailRows = await db
    .select(summarySelect)
    .from(apartment)
    .where(and(eq(apartment.id, id), eq(apartment.status, "published")))
    .limit(1);
  const detail = detailRows[0];
  if (!detail) return null;

  // OG override column (kept off the summary select).
  const ogRows = await db
    .select({ og_image_media_id: apartment.og_image_media_id })
    .from(apartment)
    .where(eq(apartment.id, id))
    .limit(1);
  const ogImageId = ogRows[0]?.og_image_media_id ?? null;

  // Gallery (ordered, excludes the cover).
  const galleryRows = await db
    .select({ media_id: apartment_media.media_id })
    .from(apartment_media)
    .where(eq(apartment_media.apartment_id, id))
    .orderBy(asc(apartment_media.position));
  const galleryIds = galleryRows
    .map((g) => g.media_id)
    .filter((mid) => mid !== detail.cover_media_id);

  const ctx = await buildCtx([detail], locale);
  const summary = mapSummary(detail, ctx);

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

  let ogImage = summary.cover;
  if (ogImageId) {
    const ogMap = await loadMedia([ogImageId]);
    ogImage =
      toImageData(
        ogMap.get(ogImageId),
        ctx.content.get("media_asset", ogImageId, "alt") ?? summary.name,
      ) ?? summary.cover;
  }

  const alternateSlugs = await loadAlternateSlugs(APARTMENT, id);

  return {
    ...summary,
    description: ctx.content.get(APARTMENT, id, "description") ?? "",
    gallery,
    metaTitle: ctx.content.get(APARTMENT, id, "meta_title") ?? undefined,
    metaDescription: ctx.content.get(APARTMENT, id, "meta_description") ?? undefined,
    ogImage,
    alternateSlugs,
  };
}

/**
 * A single published unit by slug, with gallery + [T] description + SEO. The public
 * UX books a unit through its building's Avantio engine (no standalone detail route
 * in the mock); this read exists for S9 / S13 (SEO, alternates) and a future unit
 * microsite.
 */
export function getApartmentBySlug(locale: Locale, slugValue: string): Promise<ApartmentDetail | null> {
  return unstable_cache(
    () => _getApartmentBySlug(locale, slugValue),
    ["apartments:getApartmentBySlug", locale, slugValue],
    { tags: [APARTMENT_TAGS.list] },
  )();
}
