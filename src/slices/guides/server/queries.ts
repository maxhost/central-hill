import "server-only";
import { resolveMediaAlt } from "@core/media/alt";
import { unstable_cache } from "next/cache";
import { and, asc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import {
  type ContentRef,
  loadAlternateSlugs,
  loadContent,
  loadSlugs,
  resolveSlug,
} from "@core/i18n/content";
import {
  type MediaAsset,
  type MediaImageData,
  loadMedia,
  mediaUrl,
} from "@core/media";
import {
  CITY,
  GEO_TAGS,
  getCityBySlug,
  listCities,
} from "@slices/geography/contract";
import {
  GUIDE_PAGE,
  GUIDE_PLACE,
  GUIDE_SECTION,
  GUIDE_TAGS,
  RECOMMENDATION_TYPES,
  type GuideCityGroup,
  type GuideCityRef,
  type GuideLayout,
  type GuidePageDetail,
  type GuidePageSummary,
  type GuidePlace,
  type GuidePriceTier,
  type GuideRecommendation,
  type GuideRecommendationType,
  type GuideSection,
  type GuideTemplate,
} from "../contract";
import { loadGuidePublications } from "./locale-public";
import { guideRecommendationType } from "../locale-content";
import {
  normalizedRecommendationScope,
  recommendationScopeKey,
  type GuideRecommendationScope,
} from "./recommendation-scope";
import { guide_page, guide_place, guide_section } from "../schema";
import {
  applyGuideSectionPresentation,
  isGuideModuleVisible,
} from "../presentation";
import { safeGuideHttpUrl } from "../ui/format";

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
    .orderBy(asc(guide_page.position), asc(guide_page.id));
  if (rows.length === 0) return [];

  // Cities come from geography's contract (only published cities are returned).
  const cities = await listCities(locale);
  const cityById = new Map(cities.map((c) => [c.id, c]));

  // Drop guides whose city is unpublished/absent.
  const publications = await loadGuidePublications(
    rows.map((r) => r.id),
    locale,
  );
  const visible = rows.filter(
    (r) => cityById.has(r.city_id) && publications.get(r.id) !== null,
  );
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
    const cityRef: GuideCityRef = {
      id: city.id,
      slug: city.slug,
      name: city.name,
    };
    const publication = publications.get(r.id)?.envelope.content;
    const title =
      publication?.title ?? content.get(GUIDE_PAGE, r.id, "title") ?? "";
    return {
      id: r.id,
      slug: slugs.get(r.id) ?? "",
      template: r.template,
      title,
      intro: publication
        ? publication.intro
        : (content.get(GUIDE_PAGE, r.id, "intro") ?? null),
      hero: r.hero_media_id
        ? toImageData(
            media.get(r.hero_media_id),
            resolveMediaAlt(publication?.media_alts, r.hero_media_id, content.get("media_asset", r.hero_media_id, "alt") ?? title),
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
    groups.push({
      city: { id: city.id, slug: city.slug, name: city.name },
      guides,
    });
  }
  return groups;
}

export function listGuideCityGroups(locale: Locale): Promise<GuideCityGroup[]> {
  return unstable_cache(
    () => _listGuideCityGroups(locale),
    ["guides:v3:listGuideCityGroups", locale],
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
  let sectionRows = await db
    .select({
      id: guide_section.id,
      layout: guide_section.layout,
      header_media_id: guide_section.header_media_id,
      cta_url: guide_section.cta_url,
      presentation: guide_section.presentation,
    })
    .from(guide_section)
    .where(eq(guide_section.guide_page_id, id))
    .orderBy(asc(guide_section.position), asc(guide_section.id));

  const sectionIds = sectionRows.map((s) => s.id);
  let placeRows = sectionIds.length
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
        .orderBy(asc(guide_place.position), asc(guide_place.id))
    : [];

  const publication = (await loadGuidePublications([id], locale)).get(id);
  if (publication === null) return null;
  if (publication) {
    const tree = publication.envelope.content;
    sectionRows = tree.sections.map((s) => ({
      id: s.id,
      layout: s.layout,
      header_media_id: s.header_media_id,
      cta_url: s.cta_url,
      presentation: s.presentation,
    }));
    placeRows = tree.sections.flatMap((s) =>
      s.places.map((p) => ({
        id: p.id,
        guide_section_id: s.id,
        category: p.category,
        address: p.address,
        phone: p.phone,
        price_tier: p.price_tier,
        opening_hours: p.opening_hours,
        latitude: p.latitude,
        longitude: p.longitude,
        website_url: p.website_url,
        booking_url: p.booking_url,
        media_id: p.media_id,
      })),
    );
  }

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

  // Publications are independent, even when their text originally inherited EN.
  const alternatePublications = await Promise.all(
    LOCALES.map(
      async (l) => [l, (await loadGuidePublications([id], l)).get(id)] as const,
    ),
  );
  const publicationByLocale = new Map(alternatePublications);
  const localized = (
    type: string,
    entityId: string,
    field: string,
  ): string | null | undefined => {
    if (!publication) return content.get(type, entityId, field);
    const tree = publication.envelope.content;
    const node =
      type === GUIDE_PAGE
        ? tree
        : type === GUIDE_SECTION
          ? tree.sections.find((s) => s.id === entityId)
          : tree.sections
              .flatMap((s) => s.places)
              .find((p) => p.id === entityId);
    return node
      ? (node as unknown as Record<string, string | null>)[field]
      : null;
  };
  // hreflang alternates: only locales where both the city and page slug exist.
  const alternates: GuidePageDetail["alternates"] = {};
  for (const l of LOCALES) {
    const cSlug = cityAlts[l];
    const pSlug = pageAlts[l];
    if (cSlug && pSlug && publicationByLocale.get(l) !== null)
      alternates[l] = { city: cSlug, slug: pSlug };
  }

  const title = localized(GUIDE_PAGE, id, "title") ?? "";

  const placesBySection = new Map<string, GuidePlace[]>();
  for (const p of placeRows) {
    const name = localized(GUIDE_PLACE, p.id, "name") ?? "";
    const place: GuidePlace = {
      id: p.id,
      name,
      description: localized(GUIDE_PLACE, p.id, "description") ?? null,
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
            resolveMediaAlt(publication?.envelope.content.media_alts, p.media_id, content.get("media_asset", p.media_id, "alt") ?? name),
            TILE_W,
            TILE_H,
          )
        : null,
    };
    const list = placesBySection.get(p.guide_section_id) ?? [];
    list.push(place);
    placesBySection.set(p.guide_section_id, list);
  }

  // Filter here so every public consumer (including gallery, TOC and counts) sees the same tree.
  // Admin reads use their own unfiltered query and retain hidden content.
  const sections: GuideSection[] = sectionRows.flatMap((s) => {
    const ctaLabel = localized(GUIDE_SECTION, s.id, "cta_label") ?? undefined;
    const sTitle = localized(GUIDE_SECTION, s.id, "title") ?? "";
    const ctaUrl = safeGuideHttpUrl(s.cta_url);
    const section = applyGuideSectionPresentation(
      {
        id: s.id,
        layout: s.layout as GuideLayout,
        title: sTitle,
        body: localized(GUIDE_SECTION, s.id, "body") ?? null,
        localTip: localized(GUIDE_SECTION, s.id, "local_tip") ?? null,
        headerImage: s.header_media_id
          ? toImageData(
              media.get(s.header_media_id),
              resolveMediaAlt(publication?.envelope.content.media_alts, s.header_media_id, content.get("media_asset", s.header_media_id, "alt") ?? sTitle),
              TILE_W,
              TILE_H,
            )
          : null,
        cta: ctaLabel && ctaUrl ? { label: ctaLabel, url: ctaUrl } : null,
        places: placesBySection.get(s.id) ?? [],
      },
      s.presentation,
    );
    return section ? [section] : [];
  });

  const cityRef: GuideCityRef = {
    id: city.id,
    slug: city.slug,
    name: city.name,
  };
  const hero = page.hero_media_id
    ? toImageData(
        media.get(page.hero_media_id),
        resolveMediaAlt(publication?.envelope.content.media_alts, page.hero_media_id, content.get("media_asset", page.hero_media_id, "alt") ?? title),
        HERO_W,
        HERO_H,
      )
    : null;
  let ogImage = hero;
  if (page.og_image_media_id) {
    ogImage =
      toImageData(
        media.get(page.og_image_media_id),
        resolveMediaAlt(publication?.envelope.content.media_alts, page.og_image_media_id, content.get("media_asset", page.og_image_media_id, "alt") ?? title),
        HERO_W,
        HERO_H,
      ) ?? hero;
  }

  return {
    id,
    slug: (await loadSlugs(GUIDE_PAGE, [id], locale)).get(id) ?? pageSlug,
    template: page.template as GuideTemplate,
    title,
    intro: localized(GUIDE_PAGE, id, "intro") ?? null,
    hero,
    city: cityRef,
    sections,
    metaTitle: localized(GUIDE_PAGE, id, "meta_title") ?? undefined,
    metaDescription: localized(GUIDE_PAGE, id, "meta_description") ?? undefined,
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
    ["guides:v3:getGuidePage", locale, citySlug, pageSlug],
    { tags: [GUIDE_TAGS.list, GEO_TAGS.list] },
  )();
}

// ── Index: "Top Recommendations" (one featured place per type) ───────────────
/**
 * Selection rule (deterministic, no featured flag in the schema — uses existing data only):
 *
 * 1. Candidates are `guide_place` rows in a **published** guide page of a **published**
 *    city (via geography's `listCities`) that have an image (`media_id` resolving to an
 *    asset), a `category` and a non-blank `address` — i.e. everything the card shows.
 * 2. The category must equal one of `RECOMMENDATION_TYPES` (case-insensitive, trimmed).
 * 3. Candidates are walked in reading order — guide `position`, then section `position`,
 *    then place `position` (ID breaks ties at each level) — and the **first** match per type wins.
 *    Hidden sections and disabled places modules never participate.
 * 4. Output follows `RECOMMENDATION_TYPES` order (Restaurant, Viewpoint, Beach); a type with
 *    no candidate is skipped (so the result may be shorter than `limit`, or empty).
 */
async function _listTopRecommendations(
  locale: Locale,
  limit: number,
  cityIds?: readonly string[],
): Promise<GuideRecommendation[]> {
  if (limit <= 0 || cityIds?.length === 0) return [];
  const legacyRows = await db
    .select({
      id: guide_place.id,
      category: guide_place.category,
      address: guide_place.address,
      media_id: guide_place.media_id,
      page_id: guide_page.id,
      presentation: guide_section.presentation,
      city_id: guide_page.city_id,
    })
    .from(guide_place)
    .innerJoin(
      guide_section,
      eq(guide_place.guide_section_id, guide_section.id),
    )
    .innerJoin(guide_page, eq(guide_section.guide_page_id, guide_page.id))
    .where(
      and(
        eq(guide_page.status, "published"),
        cityIds ? inArray(guide_page.city_id, [...cityIds]) : undefined,
        isNotNull(guide_place.media_id),
        isNotNull(guide_place.address),
        inArray(sql<string>`lower(trim(${guide_place.category}))`, [
          ...RECOMMENDATION_TYPES,
        ]),
      ),
    )
    .orderBy(
      asc(guide_page.position),
      asc(guide_page.id),
      asc(guide_section.position),
      asc(guide_section.id),
      asc(guide_place.position),
      asc(guide_place.id),
    );
  const publishedGuides = await db
    .select({
      id: guide_page.id,
      city_id: guide_page.city_id,
      position: guide_page.position,
    })
    .from(guide_page)
    .where(eq(guide_page.status, "published"))
    .orderBy(asc(guide_page.position), asc(guide_page.id));
  const publications = await loadGuidePublications(
    publishedGuides.map((g) => g.id),
    locale,
  );
  const rows = legacyRows.filter((r) => !publications.has(r.page_id));
  const cities = await listCities(locale);
  const cityById = new Map(cities.map((c) => [c.id, c]));

  const localizedPlaces = new Map<
    string,
    { name: string; description: string | null; category: string | null }
  >();
  for (const guide of publishedGuides) {
    const publication = publications.get(guide.id);
    if (!publication || (cityIds && !cityIds.includes(guide.city_id))) continue;
    for (const section of publication.envelope.content.sections)
      for (const place of section.places) {
        const type =
          publication.shared.places[place.id]?.recommendation_type ?? null;
        if (!type || !place.media_id || !place.address) continue;
        rows.push({
          id: place.id,
          category: type,
          address: place.address,
          media_id: place.media_id,
          page_id: guide.id,
          presentation: section.presentation,
          city_id: guide.city_id,
        });
        localizedPlaces.set(place.id, {
          name: place.name,
          description: place.description,
          category: place.category,
        });
      }
  }
  const guideOrder = new Map(publishedGuides.map((g, i) => [g.id, i]));
  rows.sort(
    (a, b) =>
      (guideOrder.get(a.page_id) ?? 0) - (guideOrder.get(b.page_id) ?? 0),
  );
  // Candidates per type in reading order (several per type, in case an asset is missing).
  const byType = new Map<GuideRecommendationType, typeof rows>();
  for (const r of rows) {
    if (
      !cityById.has(r.city_id) ||
      !r.address?.trim() ||
      !isGuideModuleVisible(r.presentation, "places")
    )
      continue;
    const type = guideRecommendationType(r.category)!;
    const list = byType.get(type) ?? [];
    list.push(r);
    byType.set(type, list);
  }
  const candidates = [...byType.values()].flat();
  if (candidates.length === 0) return [];

  const refs: ContentRef[] = [];
  const pageIds = [...new Set(candidates.map((r) => r.page_id))];
  for (const r of candidates) {
    refs.push(
      { type: GUIDE_PLACE, id: r.id },
      { type: "media_asset", id: r.media_id! },
    );
  }
  const [content, media, slugs] = await Promise.all([
    loadContent(refs, locale),
    loadMedia(candidates.map((r) => r.media_id!)),
    loadSlugs(GUIDE_PAGE, pageIds, locale),
  ]);

  const out: GuideRecommendation[] = [];
  for (const type of RECOMMENDATION_TYPES) {
    if (out.length >= limit) break;
    for (const r of byType.get(type) ?? []) {
      const guideSlug = slugs.get(r.page_id);
      const own = localizedPlaces.get(r.id);
      const name = own
        ? own.name
        : (content.get(GUIDE_PLACE, r.id, "name") ?? "");
      const image = toImageData(
        media.get(r.media_id!),
        resolveMediaAlt(publications.get(r.page_id)?.envelope.content.media_alts, r.media_id, content.get("media_asset", r.media_id!, "alt") ?? name),
        TILE_W,
        TILE_H,
      );
      if (!guideSlug || !name || !image) continue; // incomplete in this locale → next candidate
      out.push({
        id: r.id,
        type,
        name,
        description: own
          ? own.description
          : (content.get(GUIDE_PLACE, r.id, "description") ?? null),
        category: own?.category?.trim() ?? r.category!.trim(),
        address: r.address!.trim(),
        image,
        guide: { citySlug: cityById.get(r.city_id)!.slug, slug: guideSlug },
      });
      break;
    }
  }
  return out;
}

export function listTopRecommendations(
  locale: Locale,
  limit = 3,
  scope?: GuideRecommendationScope,
): Promise<GuideRecommendation[]> {
  return unstable_cache(
    () =>
      _listTopRecommendations(
        locale,
        limit,
        normalizedRecommendationScope(scope),
      ),
    [
      "guides:v3:listTopRecommendations",
      locale,
      String(limit),
      recommendationScopeKey(scope),
    ],
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
        if (guide.slug)
          out.push({ locale, city: g.city.slug, slug: guide.slug });
      }
    }
  }
  return out;
}
