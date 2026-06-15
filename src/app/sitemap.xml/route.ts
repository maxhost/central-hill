import { buildSitemapIndex, collectSitemap } from "@slices/seo/contract";

/**
 * Sitemap index (`/sitemap.xml`, S13 / ADR 0020) — lists the per-section sitemaps.
 * Static + ISR: the underlying enumeration is cached and busts on the `sitemap` tag
 * (daily fallback), so this never hits the DB at request time (ADR 0002).
 */
export const revalidate = 86_400;

export async function GET() {
  const sections = await collectSitemap();
  return new Response(buildSitemapIndex(sections), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
