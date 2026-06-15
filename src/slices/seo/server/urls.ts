import "server-only";
import { unstable_cache } from "next/cache";
import { cacheTags } from "@core/revalidate";
import { loadAllSlugs } from "@core/i18n/content";
import type { Locale } from "@core/db/columns";
import { BUILDING, listBuildingParams } from "@slices/buildings/contract";
import { BLOG_POST, listPostParams } from "@slices/blog/contract";
import { SERVICE, listServiceParams } from "@slices/services/contract";
import { GUIDE_PAGE, listGuideParams } from "@slices/guides/contract";
import { LOCALES, absoluteUrl } from "../config";

/**
 * Slice `seo` (S13) — public-URL enumeration for the sitemaps (ADR 0020). Every URL
 * is collected through other slices' **contracts** (golden rule 2): the per-entity
 * `list*Params()` (published-only) plus the fixed marketing/index routes. Per-locale
 * `<xhtml:link>` alternates are built by grouping an entity's published slugs across
 * locales via the kernel `loadAllSlugs` (the flat params lose the entity id).
 *
 * Wrapped in `unstable_cache` tagged `sitemap` with a daily fallback so the public
 * sitemap routes never hit the DB at request time (ADR 0002).
 */
export interface SitemapAlternate {
  hreflang: string;
  href: string;
}
export interface SitemapUrl {
  loc: string;
  alternates: SitemapAlternate[];
}
export interface SitemapSection {
  /** URL slug of the per-section sitemap (`/sitemaps/<id>`). */
  id: string;
  urls: SitemapUrl[];
}

/** Path stems (after the locale prefix) for fixed marketing + index routes. */
const STATIC_STEMS = [
  "",
  "/owners",
  "/real-estate",
  "/about",
  "/guests",
  "/buildings",
  "/blog",
  "/services",
  "/guides",
] as const;

function staticUrls(): SitemapUrl[] {
  const alternatesFor = (stem: string): SitemapAlternate[] => [
    ...LOCALES.map((l) => ({ hreflang: l, href: absoluteUrl(`/${l}${stem}`) })),
    { hreflang: "x-default", href: absoluteUrl(`/en${stem}`) },
  ];
  return STATIC_STEMS.flatMap((stem) =>
    LOCALES.map((locale) => ({
      loc: absoluteUrl(`/${locale}${stem}`),
      alternates: alternatesFor(stem),
    })),
  );
}

interface Param {
  locale: Locale;
  slug: string;
}

/** Group published `{locale,slug}` params by their owning entity (for alternates). */
async function groupByEntity<T extends Param>(type: string, params: T[]): Promise<T[][]> {
  const all = await loadAllSlugs(type);
  const idBySlug = new Map<string, string>();
  for (const r of all) idBySlug.set(`${r.locale}::${r.slug}`, r.entity_id);

  const groups = new Map<string, T[]>();
  for (const p of params) {
    // Fall back to a per-row unique key if a slug somehow has no row, so the URL is
    // still emitted (standalone, no alternates) rather than dropped.
    const key = idBySlug.get(`${p.locale}::${p.slug}`) ?? `@${p.locale}::${p.slug}`;
    const arr = groups.get(key);
    if (arr) arr.push(p);
    else groups.set(key, [p]);
  }
  return [...groups.values()];
}

function urlsFromGroups<T extends Param>(groups: T[][], pathFor: (p: T) => string): SitemapUrl[] {
  const out: SitemapUrl[] = [];
  for (const group of groups) {
    const alternates: SitemapAlternate[] = group.map((p) => ({
      hreflang: p.locale,
      href: absoluteUrl(pathFor(p)),
    }));
    const canonical = group.find((p) => p.locale === "en") ?? group[0]!;
    alternates.push({ hreflang: "x-default", href: absoluteUrl(pathFor(canonical)) });
    for (const p of group) {
      out.push({ loc: absoluteUrl(pathFor(p)), alternates });
    }
  }
  return out;
}

async function entitySection<T extends Param>(
  id: string,
  type: string,
  params: T[],
  pathFor: (p: T) => string,
): Promise<SitemapSection> {
  const groups = await groupByEntity(type, params);
  return { id, urls: urlsFromGroups(groups, pathFor) };
}

interface GuideParam extends Param {
  city: string;
}

async function _collectSitemap(): Promise<SitemapSection[]> {
  const [buildings, posts, services, guides] = await Promise.all([
    listBuildingParams(),
    listPostParams(),
    listServiceParams(),
    listGuideParams(),
  ]);

  const sections = await Promise.all([
    entitySection(
      "buildings",
      BUILDING,
      buildings,
      (p) => `/${p.locale}/buildings/${p.slug}`,
    ),
    entitySection("blog", BLOG_POST, posts, (p) => `/${p.locale}/blog/${p.slug}`),
    entitySection("services", SERVICE, services, (p) => `/${p.locale}/services/${p.slug}`),
    entitySection(
      "guides",
      GUIDE_PAGE,
      guides as GuideParam[],
      (p) => `/${p.locale}/guides/${p.city}/${p.slug}`,
    ),
  ]);

  return [{ id: "pages", urls: staticUrls() }, ...sections].filter((s) => s.urls.length > 0);
}

/** All sitemap sections (cached; busts on the `sitemap` tag, daily fallback). */
export const collectSitemap = unstable_cache(_collectSitemap, ["seo:collectSitemap"], {
  tags: [cacheTags.sitemap],
  revalidate: 86_400,
});
