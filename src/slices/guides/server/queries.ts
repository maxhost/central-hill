import "server-only";
import { unstable_cache } from "next/cache";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import {
  type ContentRef,
  loadAlternateSlugs,
  loadContent,
  loadSlugs,
  resolveSlug,
} from "@core/i18n/content";
import { type MediaAsset, type MediaImageData, loadMedia, mediaUrl } from "@core/media";
import { CITY, GEO_TAGS, getCityBySlug, listCities } from "@slices/geography/contract";
import {
  GUIDE_PAGE,
  GUIDE_PLACE,
  GUIDE_SECTION,
  GUIDE_TAGS,
  type GuideCityGroup,
  type GuideCityRef,
  type GuideLayout,
  type GuidePageDetail,
  type GuidePageSummary,
  type GuidePlace,
  type GuidePriceTier,
  type GuideSection,
  type GuideTemplate,
} from "../contract";
import { guide_page, guide_place, guide_section } from "../schema";

/**
 * Public read functions for slice `guides` (conventions.md → reads go through typed,
 * cache-tagged `server/` functions; never the DB at request time). Reads are wrapped
 * in `unstable_cache` keyed by locale and tagged `guide-list` so a publish busts them
 * (see `./publish`). Because the index and detail embed **city** content, the reads
 * also carry `GEO_TAGS.list`, so a geography publish cascades here too.
 *
 * City information is resolved exclusively through the geography **contract**
 * (`listCities`, `getCityBySlug`) — this slice never queries geography's tables.
 * Translatable ([T]) fields resolve via `core/i18n` with the source-locale (`en`)
 * fallback + `approved`-only gating for target locales.
 */

const LOCALES: Locale[] = ["en", "pt", "es", "fr"];
const HERO_W = 1920;
const HERO_H = 1080;
const TILE_W = 1600;
const TILE_H = 1200;

function toImageData(
  asset: MediaAsset | undefined,
  alt: string,
  w: number,
  h: number,
): MediaImageData | null {
  if (!asset) return null;
  return {
    url: mediaUrl(asset.r2_key),
    width: asset.width ?? w,
    height: asset.height ?? h,
    alt,
    blurhash: asset.blurhash,
  };
}

// ── Index: cities and their published guide pages ────────────────────────────
async function _listGuideCityGroups(locale: Locale): Promise<GuideCityGroup[]> {
  const rows = await db
    .select({
      id: guide_page.id,
      city_id: guide_page.city_id,
      template: guide_page.template,
      hero_media_id: guide_page.hero_media_id,
    })
    .from(guide_page)
    .where(eq(guide_page.status, "published"))
    .orderBy(asc(guide_page.position));
  if (rows.length === 0) return [];

  // Cities come from geography's contract (only published cities are returned).
  const cities = await listCities(locale);
  const cityById = new Map(cities.map((c) => [c.id, c]));

  // Drop guides whose city is unpublished/absent.
  const visible = rows.filter((r) => cityById.has(r.city_id));
  if (visible.length === 0) return [];

  const refs: ContentRef[] = [];
  const heroIds: string[] = [];
  const pageIds: string[] = [];
  for (const r of visible) {
    pageIds.push(r.id);
    refs.push({ type: GUIDE_PAGE, id: r.id });
    if (r.hero_media_id) {
      refs.push({ type: "media_asset", id: r.hero_media_id });
      heroIds.push(r.hero_media_id);
    }
  }
  const [content, slugs, media] = await Promise.all([
    loadContent(refs, locale),
    loadSlugs(GUIDE_PAGE, pageIds, locale),
    loadMedia(heroIds),
  ]);

  const summaries = visible.map((r): GuidePageSummary => {
    const city = cityById.get(r.city_id)!;
    const cityRef: GuideCityRef = { id: city.id, slug: city.slug, name: city.name };
    const title = content.get(GUIDE_PAGE, r.id, "title") ?? "";
    return {
      id: r.id,
      slug: slugs.get(r.id) ?? "",
      template: r.template,
      title,
      intro: content.get(GUIDE_PAGE, r.id, "intro") ?? null,
      hero: r.hero_media_id
        ? toImageData(
            media.get(r.hero_media_id),
            content.get("media_asset", r.hero_media_id, "alt") ?? title,
            HERO_W,
            HERO_H,
          )
        : null,
      city: cityRef,
    };
  });

  // Group by city, preserving the geography listing order.
  const groups: GuideCityGroup[] = [];
  for (const city of cities) {
    const guides = summaries.filter((s) => s.city.id === city.id);
    if (guides.length === 0) continue;
    groups.push({ city: { id: city.id, slug: city.slug, name: city.name }, guides });
  }
  return groups;
}

export function listGuideCityGroups(locale: Locale): Promise<GuideCityGroup[]> {
  return unstable_cache(
    () => _listGuideCityGroups(locale),
    ["guides:listGuideCityGroups", locale],
    { tags: [GUIDE_TAGS.list, GEO_TAGS.list] },
  )();
}

// ── Detail: one guide page with its sections + places ────────────────────────
async function _getGuidePage(
  locale: Locale,
  citySlug: string,
  pageSlug: string,
): Promise<GuidePageDetail | null> {
  const city = await getCityBySlug(locale, citySlug);
  if (!city) return null;

  const id = await resolveSlug(GUIDE_PAGE, locale, pageSlug);
  if (!id) return null;

  const pageRows = await db
    .select({
      id: guide_page.id,
      city_id: guide_page.city_id,
      template: guide_page.template,
      hero_media_id: guide_page.hero_media_id,
      og_image_media_id: guide_page.og_image_media_id,
    })
    .from(guide_page)
    .where(and(eq(guide_page.id, id), eq(guide_page.status, "published")))
    .limit(1);
  const page = pageRows[0];
  if (!page || page.city_id !== city.id) return null;

  // Sections (ordered) + their places (ordered).
  const sectionRows = await db
    .select({
      id: guide_section.id,
      layout: guide_section.layout,
      header_media_id: guide_section.header_media_id,
      cta_url: guide_section.cta_url,
    })
    .from(guide_section)
    .where(eq(guide_section.guide_page_id, id))
    .orderBy(asc(guide_section.position));

  const sectionIds = sectionRows.map((s) => s.id);
  const placeRows = sectionIds.length
    ? await db
        .select({
          id: guide_place.id,
          guide_section_id: guide_place.guide_section_id,
          category: guide_place.category,
          address: guide_place.address,
          phone: guide_place.phone,
          price_tier: guide_place.price_tier,
          opening_hours: guide_place.opening_hours,
          latitude: guide_place.latitude,
          longitude: guide_place.longitude,
          website_url: guide_place.website_url,
          booking_url: guide_place.booking_url,
          media_id: guide_place.media_id,
        })
        .from(guide_place)
        .where(inArray(guide_place.guide_section_id, sectionIds))
        .orderBy(asc(guide_place.position))
    : [];

  // One batched [T] + media load for the whole tree.
  const refs: ContentRef[] = [{ type: GUIDE_PAGE, id }];
  const mediaIds: string[] = [];
  const pushMedia = (mid: string | null) => {
    if (mid) {
      refs.push({ type: "media_asset", id: mid });
      mediaIds.push(mid);
    }
  };
  pushMedia(page.hero_media_id);
  pushMedia(page.og_image_media_id);
  for (const s of sectionRows) {
    refs.push({ type: GUIDE_SECTION, id: s.id });
    pushMedia(s.header_media_id);
  }
  for (const p of placeRows) {
    refs.push({ type: GUIDE_PLACE, id: p.id });
    pushMedia(p.media_id);
  }

  const [content, media, pageAlts, cityAlts] = await Promise.all([
    loadContent(refs, locale),
    loadMedia(mediaIds),
    loadAlternateSlugs(GUIDE_PAGE, id),
    loadAlternateSlugs(CITY, page.city_id),
  ]);

  // hreflang alternates: only locales where both the city and page slug exist.
  const alternates: GuidePageDetail["alternates"] = {};
  for (const l of LOCALES) {
    const cSlug = cityAlts[l];
    const pSlug = pageAlts[l];
    if (cSlug && pSlug) alternates[l] = { city: cSlug, slug: pSlug };
  }

  const title = content.get(GUIDE_PAGE, id, "title") ?? "";

  const placesBySection = new Map<string, GuidePlace[]>();
  for (const p of placeRows) {
    const name = content.get(GUIDE_PLACE, p.id, "name") ?? "";
    const place: GuidePlace = {
      id: p.id,
      name,
      description: content.get(GUIDE_PLACE, p.id, "description") ?? null,
      category: p.category,
      address: p.address,
      phone: p.phone,
      priceTier: (p.price_tier as GuidePriceTier | null) ?? null,
      openingHours: p.opening_hours,
      latitude: p.latitude,
      longitude: p.longitude,
      websiteUrl: p.website_url,
      bookingUrl: p.booking_url,
      image: p.media_id
        ? toImageData(
            media.get(p.media_id),
            content.get("media_asset", p.media_id, "alt") ?? name,
            TILE_W,
            TILE_H,
          )
        : null,
    };
    const list = placesBySection.get(p.guide_section_id) ?? [];
    list.push(place);
    placesBySection.set(p.guide_section_id, list);
  }

  const sections: GuideSection[] = sectionRows.map((s) => {
    const ctaLabel = content.get(GUIDE_SECTION, s.id, "cta_label") ?? undefined;
    const sTitle = content.get(GUIDE_SECTION, s.id, "title") ?? "";
    return {
      id: s.id,
      layout: s.layout as GuideLayout,
      title: sTitle,
      body: content.get(GUIDE_SECTION, s.id, "body") ?? null,
      localTip: content.get(GUIDE_SECTION, s.id, "local_tip") ?? null,
      headerImage: s.header_media_id
        ? toImageData(
            media.get(s.header_media_id),
            content.get("media_asset", s.header_media_id, "alt") ?? sTitle,
            TILE_W,
            TILE_H,
          )
        : null,
      cta: ctaLabel && s.cta_url ? { label: ctaLabel, url: s.cta_url } : null,
      places: placesBySection.get(s.id) ?? [],
    };
  });

  const cityRef: GuideCityRef = { id: city.id, slug: city.slug, name: city.name };
  const hero = page.hero_media_id
    ? toImageData(
        media.get(page.hero_media_id),
        content.get("media_asset", page.hero_media_id, "alt") ?? title,
        HERO_W,
        HERO_H,
      )
    : null;
  let ogImage = hero;
  if (page.og_image_media_id) {
    ogImage =
      toImageData(
        media.get(page.og_image_media_id),
        content.get("media_asset", page.og_image_media_id, "alt") ?? title,
        HERO_W,
        HERO_H,
      ) ?? hero;
  }

  return {
    id,
    slug: (await loadSlugs(GUIDE_PAGE, [id], locale)).get(id) ?? pageSlug,
    template: page.template as GuideTemplate,
    title,
    intro: content.get(GUIDE_PAGE, id, "intro") ?? null,
    hero,
    city: cityRef,
    sections,
    metaTitle: content.get(GUIDE_PAGE, id, "meta_title") ?? undefined,
    metaDescription: content.get(GUIDE_PAGE, id, "meta_description") ?? undefined,
    ogImage,
    alternates,
  };
}

export function getGuidePage(
  locale: Locale,
  citySlug: string,
  pageSlug: string,
): Promise<GuidePageDetail | null> {
  return unstable_cache(
    () => _getGuidePage(locale, citySlug, pageSlug),
    ["guides:getGuidePage", locale, citySlug, pageSlug],
    { tags: [GUIDE_TAGS.list, GEO_TAGS.list] },
  )();
}

/**
 * For `generateStaticParams`: every published guide page as `{locale, city, slug}`.
 * Built from the (cache-wrapped) index per locale so city slugs resolve through the
 * geography contract — no direct cross-slice table access.
 */
export async function listGuideParams(): Promise<
  Array<{ locale: Locale; city: string; slug: string }>
> {
  const out: Array<{ locale: Locale; city: string; slug: string }> = [];
  for (const locale of LOCALES) {
    const groups = await listGuideCityGroups(locale);
    for (const g of groups) {
      for (const guide of g.guides) {
        if (guide.slug) out.push({ locale, city: g.city.slug, slug: guide.slug });
      }
    }
  }
  return out;
}
