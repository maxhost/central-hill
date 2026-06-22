import "server-only";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import {
  PAGE_TAGS,
  type AboutPage,
  type GuestPage,
  type HomePage,
  type OwnersPage,
  type PageResult,
  type RealEstatePage,
} from "../contract";
import { page_content } from "../schema";
import { type PageKey, translatablePathsByPage } from "../schemas";
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
