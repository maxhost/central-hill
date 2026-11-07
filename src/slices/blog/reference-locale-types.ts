import type { Locale } from "@core/db/columns";

export const BLOG_REFERENCE_LOCALES = ["en", "es", "pt", "fr"] as const;
export const BLOG_REFERENCE_TARGET_LOCALES = ["es", "pt", "fr"] as const;
export type BlogReferenceTargetLocale =
  (typeof BLOG_REFERENCE_TARGET_LOCALES)[number];
export type BlogCategoryTranslations = Record<
  BlogReferenceTargetLocale,
  string
>;
export type AuthorTranslations = Record<
  BlogReferenceTargetLocale,
  { name: string; bio: string | null }
>;
export interface BlogReferenceOption {
  id: string;
  /** English name retained for older callers. */
  name: string;
  labels?: Record<Locale, string>;
}
