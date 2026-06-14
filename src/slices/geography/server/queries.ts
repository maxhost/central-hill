import "server-only";
import { unstable_cache } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import {
  type ContentRef,
  type ContentResolver,
  loadContent,
  loadSlugs,
  resolveSlug,
} from "@core/i18n/content";
import { slug as slugTable } from "@core/i18n/schema";
import { type MediaAsset, type MediaImageData, loadMedia, mediaUrl } from "@core/media";
import { CITY, GEO_TAGS, NEIGHBOURHOOD } from "../contract";
import type { CityRef, NeighbourhoodRef } from "../contract";
import { city, neighbourhood } from "../schema";

/**
 * Public read functions for slice `geography` (conventions.md → reads go through
 * typed, cache-tagged `server/` functions; never the DB at request time). Each is
 * wrapped in `unstable_cache` keyed by locale and tagged `city-list` so a publish
 * busts them (see `./publish`). Translatable fields resolve via `core/i18n` with the
 * source-locale (`en`) fallback + `approved`-only gating for target locales.
 */

// ── Row shapes ───────────────────────────────────────────────────────────────
interface CityRow {
  id: string;
  slug: string;
  country: string;
  hero_media_id: string | null;
}

interface NeighbourhoodRow {
  id: string;
  city_id: string;
  slug: string;
}

const HERO_W = 1920;
const HERO_H = 1080;

function toImageData(asset: MediaAsset | undefined, alt: string): MediaImageData | null {
  if (!asset) return null;
  return {
    url: mediaUrl(asset.r2_key),
    width: asset.width ?? HERO_W,
    height: asset.height ?? HERO_H,
    alt,
    blurhash: asset.blurhash,
  };
}

// ── City ─────────────────────────────────────────────────────────────────────
interface CityCtx {
  content: ContentResolver;
  slugs: Map<string, string>;
  media: Map<string, MediaAsset>;
}

async function buildCityCtx(rows: CityRow[], locale: Locale): Promise<CityCtx> {
  const refs: ContentRef[] = [];
  const cityIds: string[] = [];
  const heroIds: string[] = [];
  for (const r of rows) {
    cityIds.push(r.id);
    refs.push({ type: CITY, id: r.id });
    if (r.hero_media_id) {
      refs.push({ type: "media_asset", id: r.hero_media_id });
      heroIds.push(r.hero_media_id);
    }
  }
  const [content, slugs, media] = await Promise.all([
    loadContent(refs, locale),
    loadSlugs(CITY, cityIds, locale),
    loadMedia(heroIds),
  ]);
  return { content, slugs, media };
}

function mapCity(row: CityRow, ctx: CityCtx): CityRef {
  const { content, slugs, media } = ctx;
  const name = content.get(CITY, row.id, "name") ?? row.slug;
  const hero = row.hero_media_id
    ? toImageData(
        media.get(row.hero_media_id),
        content.get("media_asset", row.hero_media_id, "alt") ?? name,
      )
    : null;
  return {
    id: row.id,
    slug: slugs.get(row.id) ?? row.slug,
    name,
    country: row.country,
    intro: content.get(CITY, row.id, "intro") ?? null,
    hero,
  };
}

const citySelect = {
  id: city.id,
  slug: city.slug,
  country: city.country,
  hero_media_id: city.hero_media_id,
} as const;

async function _listCities(locale: Locale): Promise<CityRef[]> {
  const rows = await db
    .select(citySelect)
    .from(city)
    .where(eq(city.status, "published"))
    .orderBy(city.position);
  const ctx = await buildCityCtx(rows, locale);
  return rows.map((r) => mapCity(r, ctx));
}

export function listCities(locale: Locale): Promise<CityRef[]> {
  return unstable_cache(() => _listCities(locale), ["geography:listCities", locale], {
    tags: [GEO_TAGS.list],
  })();
}

async function _getCityBySlug(locale: Locale, slugValue: string): Promise<CityRef | null> {
  const id = await resolveSlug(CITY, locale, slugValue);
  if (!id) return null;
  const rows = await db
    .select(citySelect)
    .from(city)
    .where(and(eq(city.id, id), eq(city.status, "published")))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const ctx = await buildCityCtx([row], locale);
  return mapCity(row, ctx);
}

export function getCityBySlug(locale: Locale, slugValue: string): Promise<CityRef | null> {
  return unstable_cache(
    () => _getCityBySlug(locale, slugValue),
    ["geography:getCityBySlug", locale, slugValue],
    { tags: [GEO_TAGS.list] },
  )();
}

// ── Neighbourhood ──────────────────────────────────────────────────────────────
// Neighbourhoods have no status of their own; they are public iff their city is
// published. Every read joins `city` and filters `city.status = 'published'`.
function mapNeighbourhood(
  row: NeighbourhoodRow,
  content: ContentResolver,
  slugs: Map<string, string>,
): NeighbourhoodRef {
  return {
    id: row.id,
    cityId: row.city_id,
    slug: slugs.get(row.id) ?? row.slug,
    name: content.get(NEIGHBOURHOOD, row.id, "name") ?? row.slug,
  };
}

const neighbourhoodSelect = {
  id: neighbourhood.id,
  city_id: neighbourhood.city_id,
  slug: neighbourhood.slug,
} as const;

async function _listNeighbourhoods(
  locale: Locale,
  cityId?: string,
): Promise<NeighbourhoodRef[]> {
  const where = cityId
    ? and(eq(city.status, "published"), eq(neighbourhood.city_id, cityId))
    : eq(city.status, "published");
  const rows = await db
    .select(neighbourhoodSelect)
    .from(neighbourhood)
    .innerJoin(city, eq(neighbourhood.city_id, city.id))
    .where(where)
    .orderBy(neighbourhood.position);

  const ids = rows.map((r) => r.id);
  const [content, slugs] = await Promise.all([
    loadContent(
      rows.map((r) => ({ type: NEIGHBOURHOOD, id: r.id })),
      locale,
    ),
    loadSlugs(NEIGHBOURHOOD, ids, locale),
  ]);
  return rows.map((r) => mapNeighbourhood(r, content, slugs));
}

export function listNeighbourhoods(locale: Locale, cityId?: string): Promise<NeighbourhoodRef[]> {
  return unstable_cache(
    () => _listNeighbourhoods(locale, cityId),
    ["geography:listNeighbourhoods", locale, cityId ?? "all"],
    { tags: [GEO_TAGS.list] },
  )();
}

async function _getNeighbourhoodBySlug(
  locale: Locale,
  slugValue: string,
): Promise<NeighbourhoodRef | null> {
  const id = await resolveSlug(NEIGHBOURHOOD, locale, slugValue);
  if (!id) return null;
  const rows = await db
    .select(neighbourhoodSelect)
    .from(neighbourhood)
    .innerJoin(city, eq(neighbourhood.city_id, city.id))
    .where(and(eq(neighbourhood.id, id), eq(city.status, "published")))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const [content, slugs] = await Promise.all([
    loadContent([{ type: NEIGHBOURHOOD, id }], locale),
    loadSlugs(NEIGHBOURHOOD, [id], locale),
  ]);
  return mapNeighbourhood(row, content, slugs);
}

export function getNeighbourhoodBySlug(
  locale: Locale,
  slugValue: string,
): Promise<NeighbourhoodRef | null> {
  return unstable_cache(
    () => _getNeighbourhoodBySlug(locale, slugValue),
    ["geography:getNeighbourhoodBySlug", locale, slugValue],
    { tags: [GEO_TAGS.list] },
  )();
}

/** For downstream `generateStaticParams` (e.g. guides): every published city's slug, per locale. */
export async function listCityParams(): Promise<Array<{ locale: Locale; slug: string }>> {
  const rows = await db
    .select({ locale: slugTable.locale, slug: slugTable.slug })
    .from(slugTable)
    .innerJoin(city, eq(slugTable.entity_id, city.id))
    .where(and(eq(slugTable.entity_type, CITY), eq(city.status, "published")));
  return rows.map((r) => ({ locale: r.locale, slug: r.slug }));
}
