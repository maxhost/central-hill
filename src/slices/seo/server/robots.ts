import { absoluteUrl, siteUrl } from "../config";

/**
 * Slice `seo` (S13) — `robots.txt` (ADR 0020, docs/seo-i18n.md). Allows the public
 * surface, disallows the backoffice (`/admin`, ADR 0017) and internal APIs, and
 * points crawlers at the sitemap index. Pure string builder.
 */
export function buildRobots(): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    `# ${siteUrl()}`,
    "",
  ].join("\n");
}
