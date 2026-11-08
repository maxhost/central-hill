import "server-only";
import { pageLocaleTag } from "../editorial-registry";
import { getPublishedPageLocale } from "./editorial-publication";
import { unstable_cache } from "next/cache";
import type { Locale } from "@core/db/columns";
import {
  type AboutPage,
  type BlogAsideCta,
  type BlogPage,
  type BuildingsPage,
  type ServicesPage,
  type GuidesPage,
  type GuestPage,
  type GuideAsideCta,
  type HomePage,
  type OwnersPage,
  type RealEstatePage,
} from "../contract";
import { defaultBlog } from "../schemas/blog";
import { guidesAsideCta } from "../guides-content";
import { blogAsideCta } from "../blog-content";
import { defaultBuildings } from "../schemas/buildings";
import { defaultGuides } from "../schemas/guides";
import { servicesSchema, defaultServices } from "../schemas/services";

/**
 * Public read model for the five editable fixed pages (slice `pages`, S9). Each read
 * returns the page's fixed-schema `content` with [T] blocks resolved for `locale`, the
 * resolved media map, and the optional OG override — or `null` when the page has not
 * been authored. Reads are `unstable_cache`-wrapped and tagged `page:<key>`; the embedded
 * slice data (buildings/testimonials/faq/settings) is fetched by the page-section
 * components through those slices' own cached+tagged queries.
 */

const published = <K extends import("../editorial-types").EditorialPageKey>(key: K, locale: Locale) =>
  unstable_cache(() => getPublishedPageLocale(key, locale), ["pages:publishedLocale:v2-alt", key, locale], { tags: [pageLocaleTag(key, locale)] })();

export const getHomePage = (locale: Locale): Promise<HomePage | null> =>
  unstable_cache(() => getPublishedPageLocale("home", locale), ["pages:publishedLocale:v2-alt", "home", locale], { tags: [pageLocaleTag("home", locale)] })();

export const getOwnersPage = (locale: Locale): Promise<OwnersPage | null> =>
  published("owners", locale);

export const getGuestPage = (locale: Locale): Promise<GuestPage | null> =>
  published("guest", locale);

export const getRealEstatePage = (locale: Locale): Promise<RealEstatePage | null> =>
  published("real_estate", locale);

export const getAboutPage = (locale: Locale): Promise<AboutPage | null> =>
  published("about", locale);

/**
 * The CTA closing every post's sticky aside, from the `blog` row (`defaultBlog` while no row
 * exists or it fails the schema). The button always goes to the visitor's locale `/owners`.
 */
export async function getBlogPage(locale: Locale): Promise<BlogPage> {
  return await published("blog", locale)
    ?? { content: structuredClone(defaultBlog), media: {}, ogImage: null };
}

export async function getBlogAsideCta(locale: Locale): Promise<BlogAsideCta> {
  const page = await getBlogPage(locale);
  return blogAsideCta(page.content, locale);
}

/**
 * The accommodation CTA closing every guide's sticky aside, from the `guides` row
 * (`defaultGuides` while no row exists or it fails the schema). The button always goes to the
 * visitor's locale `/buildings`; `image` is null while no photo is picked (show
 * `GUIDE_ASIDE_FALLBACK_IMAGE`).
 */
export async function getGuideAsideCta(locale: Locale): Promise<GuideAsideCta> {
  const page = await getGuidesPage(locale);
  return guidesAsideCta(page, locale);
}

/**
 * The Buildings listing's editable sections (`buildings` row, spec buildings-admin-editor S2):
 * the row's content parsed with `buildingsSchema`, or `defaultBuildings` (blank texts + the
 * three current figures) while no row exists or it fails the schema — never null, so the
 * listing always renders. Blank texts are resolved to i18n by the section components.
 */
export async function getBuildingsPage(locale: Locale): Promise<BuildingsPage> {
  return await published("buildings", locale) ?? { content: structuredClone(defaultBuildings), media: {}, ogImage: null };
}

/** Cached editorial overrides, with locale-message fallback for missing/invalid content. */
export async function getServicesPage(locale: Locale): Promise<ServicesPage> {
  const page = await published("services", locale);
  const parsed = page ? servicesSchema.safeParse(page.content) : null;
  if (parsed?.success && page) return { ...page, content: parsed.data };
  return { content: defaultServices, media: {}, ogImage: page?.ogImage ?? null };
}

/** Never null: legacy rows keep their aside, missing blocks use visitor-locale messages. */
export async function getGuidesPage(locale: Locale): Promise<GuidesPage> {
  const page = await published("guides", locale);
  return page ?? { content: structuredClone(defaultGuides), media: {}, ogImage: null };
}
