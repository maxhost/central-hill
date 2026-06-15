/**
 * Public contract of slice `seo` / `seo-geo` (S13). This slice owns **no tables**
 * and renders **no page routes**; it produces the cross-cutting SEO/GEO artefacts the
 * thin app shell composes: the site-wide JSON-LD component, the sitemap index +
 * per-section urlsets, `robots.txt` and `llms.txt`/`llms-full.txt` builders (ADR
 * 0020, docs/seo-i18n.md). The new root routes under `src/app/{sitemap.xml,
 * sitemaps,robots.txt,llms.txt,llms-full.txt}` import only from here.
 *
 * Page-level metadata (canonical + hreflang + OG) and per-entity JSON-LD are built
 * directly by each public slice via the kernel `core/seo` (`buildMetadata`, the
 * JSON-LD builders) — not re-exported here.
 */

export { siteUrl, absoluteUrl, SITE_NAME } from "./config";

export { SiteJsonLd } from "./ui/site-json-ld";

export type { SitemapSection, SitemapUrl, SitemapAlternate } from "./server/urls";
export { collectSitemap } from "./server/urls";
export { buildSitemapIndex, buildUrlset, sectionPath } from "./server/sitemap";
export { buildRobots } from "./server/robots";
export { buildLlmsTxt, buildLlmsFullTxt } from "./server/llms";
