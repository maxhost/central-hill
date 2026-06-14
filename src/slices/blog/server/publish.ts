import "server-only";
import type { Locale } from "@core/db/columns";
import { cacheTags, revalidatePath, updateTag } from "@core/revalidate";
import { BLOG_TAGS } from "../contract";

/**
 * Single place that busts blog ISR caches on publish (conventions.md → "don't
 * scatter revalidateTag calls"). Blog admin actions (S12) call these after a
 * successful persist + translation enqueue. Listing/category reads are tagged
 * `blog_post-list`; per-post reads also get a `blog_post:<id>` tag.
 */
const LOCALES: Locale[] = ["en", "pt", "es", "fr"];

/** Bust the listing, category and featured reads + the blog index path. */
export function revalidateBlogList(): void {
  updateTag(BLOG_TAGS.list);
  updateTag(cacheTags.sitemap);
  for (const locale of LOCALES) revalidatePath(`/${locale}/blog`);
}

/**
 * Bust a single post + the listing. Pass the per-locale slugs so each localized
 * detail path is revalidated too.
 */
export function revalidatePost(id: string, slugByLocale: Partial<Record<Locale, string>>): void {
  updateTag(BLOG_TAGS.post(id));
  revalidateBlogList();
  for (const locale of LOCALES) {
    const slug = slugByLocale[locale];
    if (slug) revalidatePath(`/${locale}/blog/${slug}`);
  }
}
