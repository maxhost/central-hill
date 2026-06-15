import { LOCALES, type Locale } from "@core/db/columns";

/**
 * Slice `seo` (S13) — origin + URL helpers. The absolute site origin feeds
 * sitemaps, `robots.txt`, `llms.txt` and the site-wide JSON-LD (ADR 0020). It comes
 * from `SITE_URL` (server) / `NEXT_PUBLIC_SITE_URL` (fallback), defaulting to the
 * production domain so a missing env never yields broken absolute URLs.
 */
export const SITE_NAME = "Central Hill" as const;
const DEFAULT_ORIGIN = "https://centralhill.pt";

/** Absolute site origin, no trailing slash. */
export function siteUrl(): string {
  const raw = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_ORIGIN;
  return raw.replace(/\/+$/, "");
}

/** Make a root-relative path absolute against the site origin. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export { LOCALES };
export type { Locale };
