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
import { slug as slugTable } from "@core/i18n/schema";
import { type MediaAsset, type MediaImageData, loadMedia, mediaUrl } from "@core/media";
import {
  SERVICE,
  SERVICE_CATEGORY,
  SERVICE_TAGS,
  type ServiceBookingType,
  type ServiceCategoryRef,
  type ServiceDetail,
  type ServiceSummary,
} from "../contract";
import { service, service_category, service_media } from "../schema";

/**
 * Public read functions for slice `services` (conventions.md → reads go through
 * typed, cache-tagged `server/` functions; never the DB at request time). Each is
 * wrapped in `unstable_cache` keyed by locale and tagged `service-list` so a publish
 * busts them (see `./publish`). Translatable fields resolve via `core/i18n`.
 */

// ── Row shapes ───────────────────────────────────────────────────────────────
interface ServiceRow {
  id: string;
  cover_media_id: string | null;
  price_from: number | null;
  booking_type: ServiceBookingType;
  cat_id: string;
  cat_slug: string;
  cat_icon: string | null;
}

const summarySelect = {
  id: service.id,
  cover_media_id: service.cover_media_id,
  price_from: service.price_from,
  booking_type: service.booking_type,
  cat_id: service_category.id,
  cat_slug: service_category.slug,
  cat_icon: service_category.icon,
} as const;

function summaryQuery() {
  return db
    .select(summarySelect)
    .from(service)
    .innerJoin(service_category, eq(service.category_id, service_category.id));
}

// ── Mapping helpers ──────────────────────────────────────────────────────────
interface SummaryCtx {
  content: ContentResolver;
  slugs: Map<string, string>;
  media: Map<string, MediaAsset>;
}

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

async function buildCtx(rows: ServiceRow[], locale: Locale): Promise<SummaryCtx> {
  const refs: ContentRef[] = [];
  const coverIds: string[] = [];
  const serviceIds: string[] = [];
  for (const r of rows) {
    serviceIds.push(r.id);
    refs.push({ type: SERVICE, id: r.id });
    refs.push({ type: SERVICE_CATEGORY, id: r.cat_id });
    if (r.cover_media_id) {
      refs.push({ type: "media_asset", id: r.cover_media_id });
      coverIds.push(r.cover_media_id);
    }
  }

  const [content, slugs, media] = await Promise.all([
    loadContent(refs, locale),
    loadSlugs(SERVICE, serviceIds, locale),
    loadMedia(coverIds),
  ]);

  return { content, slugs, media };
}

function mapSummary(row: ServiceRow, ctx: SummaryCtx): ServiceSummary {
  const { content, slugs, media } = ctx;
  const name = content.get(SERVICE, row.id, "name") ?? "";

  const category: ServiceCategoryRef = {
    id: row.cat_id,
    slug: row.cat_slug,
    icon: row.cat_icon,
    name: content.get(SERVICE_CATEGORY, row.cat_id, "name") ?? row.cat_slug,
  };

  const cover = row.cover_media_id
    ? toImageData(
        media.get(row.cover_media_id),
        content.get("media_asset", row.cover_media_id, "alt") ?? name,
      )
    : null;

  return {
    id: row.id,
    slug: slugs.get(row.id) ?? "",
    name,
    excerpt: content.get(SERVICE, row.id, "excerpt") ?? "",
    category,
    cover,
    priceFrom: row.price_from,
    durationLabel: content.get(SERVICE, row.id, "duration_label") ?? null,
    bookingType: row.booking_type,
  };
}

// ── Public, cache-wrapped reads ──────────────────────────────────────────────
async function _listServiceCategories(locale: Locale): Promise<ServiceCategoryRef[]> {
  const rows = await db
    .select({ id: service_category.id, slug: service_category.slug, icon: service_category.icon })
    .from(service_category)
    .orderBy(asc(service_category.position));
  const content = await loadContent(
    rows.map((r) => ({ type: SERVICE_CATEGORY, id: r.id })),
    locale,
  );
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    icon: r.icon,
    name: content.get(SERVICE_CATEGORY, r.id, "name") ?? r.slug,
  }));
}

export function listServiceCategories(locale: Locale): Promise<ServiceCategoryRef[]> {
  return unstable_cache(
    () => _listServiceCategories(locale),
    ["services:listServiceCategories", locale],
    { tags: [SERVICE_TAGS.list] },
  )();
}

async function _listServices(locale: Locale, categorySlug?: string): Promise<ServiceSummary[]> {
  const where = categorySlug
    ? and(eq(service.status, "published"), eq(service_category.slug, categorySlug))
    : eq(service.status, "published");
  const rows = await summaryQuery().where(where).orderBy(asc(service.position));
  if (rows.length === 0) return [];
  const ctx = await buildCtx(rows, locale);
  return rows.map((r) => mapSummary(r, ctx));
}

export function listServices(locale: Locale, categorySlug?: string): Promise<ServiceSummary[]> {
  return unstable_cache(
    () => _listServices(locale, categorySlug),
    ["services:listServices", locale, categorySlug ?? "all"],
    { tags: [SERVICE_TAGS.list] },
  )();
}

async function _getServiceBySlug(locale: Locale, slugValue: string): Promise<ServiceDetail | null> {
  const id = await resolveSlug(SERVICE, locale, slugValue);
  if (!id) return null;

  const detailRows = await summaryQuery()
    .where(and(eq(service.id, id), eq(service.status, "published")))
    .limit(1);
  const detailRow = detailRows[0];
  if (!detailRow) return null;

  // CTA columns (label is [T], url + booking_type are plain columns).
  const ctaRows = await db
    .select({
      cta_url: service.cta_url,
      og_image_media_id: service.og_image_media_id,
    })
    .from(service)
    .where(eq(service.id, id))
    .limit(1);
  const extra = ctaRows[0]!;

  // Gallery (ordered, excludes cover).
  const galleryRows = await db
    .select({ media_id: service_media.media_id })
    .from(service_media)
    .where(eq(service_media.service_id, id))
    .orderBy(asc(service_media.position));
  const galleryIds = galleryRows
    .map((g) => g.media_id)
    .filter((mid) => mid !== detailRow.cover_media_id);

  const ctx = await buildCtx([detailRow], locale);
  const summary = mapSummary(detailRow, ctx);

  // Gallery images + alt text.
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
      const img = toImageData(galleryMedia.get(mid), galleryAlt.get("media_asset", mid, "alt") ?? summary.name);
      if (img) gallery.push(img);
    }
  }

  // CTA: label is [T] (fallback to a generic action handled in the UI), url is a column.
  const ctaLabel = ctx.content.get(SERVICE, id, "cta_label") ?? undefined;
  const cta =
    summary.bookingType !== "none" && extra.cta_url && ctaLabel
      ? { label: ctaLabel, url: extra.cta_url }
      : null;

  // OG image: explicit override, else cover.
  let ogImage = summary.cover;
  if (extra.og_image_media_id) {
    const ogMap = await loadMedia([extra.og_image_media_id]);
    ogImage =
      toImageData(
        ogMap.get(extra.og_image_media_id),
        ctx.content.get("media_asset", extra.og_image_media_id, "alt") ?? summary.name,
      ) ?? summary.cover;
  }

  const alternateSlugs = await loadAlternateSlugs(SERVICE, id);

  return {
    ...summary,
    body: ctx.content.get(SERVICE, id, "body") ?? "",
    gallery,
    cta,
    metaTitle: ctx.content.get(SERVICE, id, "meta_title") ?? undefined,
    metaDescription: ctx.content.get(SERVICE, id, "meta_description") ?? undefined,
    ogImage,
    alternateSlugs,
  };
}

export function getServiceBySlug(locale: Locale, slugValue: string): Promise<ServiceDetail | null> {
  return unstable_cache(
    () => _getServiceBySlug(locale, slugValue),
    ["services:getServiceBySlug", locale, slugValue],
    { tags: [SERVICE_TAGS.list] },
  )();
}

/** For `generateStaticParams`: every published service's slug, per locale. */
export async function listServiceParams(): Promise<Array<{ locale: Locale; slug: string }>> {
  const rows = await db
    .select({ locale: slugTable.locale, slug: slugTable.slug })
    .from(slugTable)
    .innerJoin(service, eq(slugTable.entity_id, service.id))
    .where(and(eq(slugTable.entity_type, SERVICE), eq(service.status, "published")));
  return rows.map((r) => ({ locale: r.locale, slug: r.slug }));
}
