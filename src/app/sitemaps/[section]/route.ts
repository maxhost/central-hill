import { buildUrlset, collectSitemap } from "@slices/seo/contract";

/**
 * Per-section sitemap (`/sitemaps/<section>`, S13 / ADR 0020) — one `<urlset>` per
 * entity type with `<xhtml:link>` locale alternates. Only the known section ids are
 * prerendered; anything else 404s (`dynamicParams = false`).
 */
export const revalidate = 86_400;
export const dynamicParams = false;

export async function generateStaticParams() {
  const sections = await collectSitemap();
  return sections.map((s) => ({ section: s.id }));
}

export async function GET(_req: Request, ctx: { params: Promise<{ section: string }> }) {
  const { section } = await ctx.params;
  const sections = await collectSitemap();
  const match = sections.find((s) => s.id === section);
  if (!match) return new Response("Not found", { status: 404 });
  return new Response(buildUrlset(match.urls), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
