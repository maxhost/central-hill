import "server-only";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import {
  PAGE_TAGS,
  type AboutPage,
  type BlogAsideCta,
  type GuestPage,
  type GuideAsideCta,
  type HomePage,
  type OwnersPage,
  type PageResult,
  type RealEstatePage,
} from "../contract";
import { page_content } from "../schema";
import { type PageKey, translatablePathsByPage } from "../schemas";
import { blogSchema, defaultBlog } from "../schemas/blog";
import { defaultGuides, guidesSchema } from "../schemas/guides";
import { resolveData, resolveMedia } from "./resolve";

/**
 * Public read model for the five editable fixed pages (slice `pages`, S9). Each read
 * returns the page's fixed-schema `content` with [T] blocks resolved for `locale`, the
 * resolved media map, and the optional OG override — or `null` when the page has not
 * been authored. Reads are `unstable_cache`-wrapped and tagged `page:<key>`; the embedded
 * slice data (buildings/testimonials/faq/settings) is fetched by the page-section
 * components through those slices' own cached+tagged queries.
 */

async function _loadPage<T>(locale: Locale, key: PageKey): Promise<PageResult<T> | null> {
  const [row] = await db
    .select()
    .from(page_content)
    .where(eq(page_content.key, key))
    .limit(1);
  if (!row) return null;

  const [content, { media, ogImage }] = await Promise.all([
    resolveData(row.id, row.data, locale, translatablePathsByPage[key]),
    resolveMedia(row.data, row.og_image_media_id ?? null, locale),
  ]);

  return { content: content as T, media, ogImage };
}

const cached = <T>(key: PageKey, locale: Locale): Promise<PageResult<T> | null> =>
  unstable_cache(() => _loadPage<T>(locale, key), [`pages:getPage`, key, locale], {
    tags: [PAGE_TAGS.page(key)],
  })();

export const getHomePage = (locale: Locale): Promise<HomePage | null> =>
  cached<HomePage["content"]>("home", locale);

export const getOwnersPage = (locale: Locale): Promise<OwnersPage | null> =>
  cached<OwnersPage["content"]>("owners", locale);

export const getGuestPage = (locale: Locale): Promise<GuestPage | null> =>
  cached<GuestPage["content"]>("guest", locale);

export const getRealEstatePage = (locale: Locale): Promise<RealEstatePage | null> =>
  cached<RealEstatePage["content"]>("real_estate", locale);

export const getAboutPage = (locale: Locale): Promise<AboutPage | null> =>
  cached<AboutPage["content"]>("about", locale);

/**
 * The CTA closing every post's sticky aside, from the `blog` row (`defaultBlog` while no row
 * exists or it fails the schema). The button always goes to the visitor's locale `/owners`.
 */
export async function getBlogAsideCta(locale: Locale): Promise<BlogAsideCta> {
  const page = await cached<unknown>("blog", locale);
  const parsed = page ? blogSchema.safeParse(page.content) : null;
  const a = parsed?.success ? parsed.data.post_aside : defaultBlog.post_aside;
  return {
    eyebrow: a.eyebrow || undefined,
    title: a.title,
    body: a.body || undefined,
    cta: { label: a.cta_label, href: `/${locale}/owners` },
  };
}

/**
 * The accommodation CTA closing every guide's sticky aside, from the `guides` row
 * (`defaultGuides` while no row exists or it fails the schema). The button always goes to the
 * visitor's locale `/buildings`; `image` is null while no photo is picked (show
 * `GUIDE_ASIDE_FALLBACK_IMAGE`).
 */
export async function getGuideAsideCta(locale: Locale): Promise<GuideAsideCta> {
  const page = await cached<unknown>("guides", locale);
  const parsed = page ? guidesSchema.safeParse(page.content) : null;
  const a = parsed?.success ? parsed.data.guide_aside : defaultGuides.guide_aside;
  return {
    image: (a.image_media_id && page?.media[a.image_media_id]) || null,
    eyebrow: a.eyebrow || undefined,
    title: a.title,
    body: a.body || undefined,
    cta: { label: a.cta_label, href: `/${locale}/buildings` },
  };
}
