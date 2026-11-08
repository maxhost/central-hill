import { z } from "zod";

export const NAVIGATION_CTA_LOCALES = ["en", "es", "pt", "fr"] as const;
export const NAVIGATION_CTA_KEYS = ["book", "earn"] as const;
export const NAVIGATION_CTAS_FIELD = "navigation_ctas";
export type NavigationCta = { label: string; url: string };
export type NavigationCtas = { book: NavigationCta; earn: { label: string } };
export type NavigationCtasByLocale = Record<(typeof NAVIGATION_CTA_LOCALES)[number], NavigationCtas>;

/** HTTPS destination or safe root-relative path; protocol-relative and backslash URLs are forbidden. */
export function isNavigationCtaUrl(value: string): boolean {
  if (!value || value.length > 300 || /[\\\x00-\x20\x7f]/.test(value)) return false;
  if (value.startsWith("/")) return !value.startsWith("//");
  try { return /^https:\/\//i.test(value) && new URL(value).protocol === "https:"; } catch { return false; }
}
const label = z.string().trim().min(1).max(80);
const url = z.string().trim().max(300).refine(isNavigationCtaUrl);
export const navigationCtasSchema = z.object({
  book: z.object({ label, url }).strict(),
  earn: z.object({ label }).strict(),
}).strict();
const targetLabel = z.string().trim().max(80);
const targetUrl = z.string().trim().max(300).refine((value) => !value || isNavigationCtaUrl(value));
export const navigationCtaTargetsSchema = z.object({
  book: z.object({ label: targetLabel, url: targetUrl }).strict(),
  earn: z.object({ label: targetLabel }).strict(),
}).strict();
export const navigationCtasByLocaleSchema = z.object({
  en: navigationCtasSchema, es: navigationCtaTargetsSchema,
  pt: navigationCtaTargetsSchema, fr: navigationCtaTargetsSchema,
}).strict();
export function isSettingsNavigationCtaField(type: string, field: string): boolean {
  return type === "company_settings" && field === NAVIGATION_CTAS_FIELD;
}
/** Prefix only locale-neutral internal destinations; explicit locale URLs stay exact. */
export function navigationCtaHref(url: string, locale: string): string {
  if (!url.startsWith("/") || /^\/(en|es|pt|fr)(?:[/?#]|$)/.test(url)) return url;
  return `/${locale}${url === "/" ? "" : url}`;
}
