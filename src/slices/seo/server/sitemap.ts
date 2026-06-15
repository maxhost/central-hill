import type { SitemapSection, SitemapUrl } from "./urls";
import { absoluteUrl } from "../config";

/**
 * Slice `seo` (S13) — XML serializers for the sitemap index + per-section urlsets
 * (ADR 0020, docs/seo-i18n.md). Pure string builders (no IO) so they are unit-test
 * friendly; the route handlers fetch the cached sections and pass them in. Each
 * `<url>` carries `<xhtml:link rel="alternate">` for every locale plus `x-default`.
 */
const XML_DECL = '<?xml version="1.0" encoding="UTF-8"?>';
const SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";
const XHTML_NS = "http://www.w3.org/1999/xhtml";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Path of a per-section sitemap, relative to the origin. */
export function sectionPath(id: string): string {
  return `/sitemaps/${id}`;
}

/** `<sitemapindex>` listing every per-section sitemap. */
export function buildSitemapIndex(sections: SitemapSection[]): string {
  const entries = sections
    .map((s) => `  <sitemap><loc>${esc(absoluteUrl(sectionPath(s.id)))}</loc></sitemap>`)
    .join("\n");
  return `${XML_DECL}\n<sitemapindex xmlns="${SITEMAP_NS}">\n${entries}\n</sitemapindex>\n`;
}

function urlEntry(url: SitemapUrl): string {
  const alts = url.alternates
    .map(
      (a) =>
        `    <xhtml:link rel="alternate" hreflang="${esc(a.hreflang)}" href="${esc(a.href)}" />`,
    )
    .join("\n");
  return `  <url>\n    <loc>${esc(url.loc)}</loc>\n${alts}\n  </url>`;
}

/** `<urlset>` for one section's URLs (with `xhtml` alternate links). */
export function buildUrlset(urls: SitemapUrl[]): string {
  const body = urls.map(urlEntry).join("\n");
  return `${XML_DECL}\n<urlset xmlns="${SITEMAP_NS}" xmlns:xhtml="${XHTML_NS}">\n${body}\n</urlset>\n`;
}
