import "server-only";
import { pageLocaleTag } from "../editorial-registry";
import { getPublishedPageLocale } from "./editorial-publication";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import type { Locale } from "@core/db/columns";
import {
  PAGE_TAGS,
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
  type PageResult,
  type RealEstatePage,
} from "../contract";
import { page_content } from "../schema";
import { type PageKey, translatablePathsByPage } from "../schemas";
import { blogSchema, defaultBlog } from "../schemas/blog";
import { blogSourceContent, blogLocalizedContent } from "../blog-content";
import { buildingsSchema, defaultBuildings } from "../schemas/buildings";
import { defaultGuides } from "../schemas/guides";
import { servicesSchema, defaultServices } from "../schemas/services";
import { uuid } from "@core/validation/primitives";
import { guidesSourceContent, guidesLocalizedContent } from "./guides-content";
import { resolveData, resolveMedia } from "./resolve";
import { homeSchema } from "../schemas/home";
import { normalizeHome, homeIdentityErrors } from "../home-content";
import { resolveHomeData } from "./home-translations";
import { aboutSchema } from "../schemas/about";
import { normalizeAbout, aboutIdentityErrors } from "../about-content";
import { resolveAboutData } from "./about-translations";

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
  if (key === "blog") {
    if (!blogSchema.safeParse(row.data).success) return null;
    const source = blogSourceContent(row.data);
    const localized = await resolveData(row.id, source, locale, translatablePathsByPage.blog);
    const content = blogLocalizedContent(source, localized);
    const media = await resolveMedia(source, uuid.safeParse(row.og_image_media_id).success ? row.og_image_media_id : null, locale);
    return { content: content as T, ...media };
  }
  if (key === "home") {
    const parsed = homeSchema.safeParse(row.data);
    if (!parsed.success) return null;
    const source = normalizeHome(parsed.data);
    if (Object.keys(homeIdentityErrors(source)).length) return null;
    const content = await resolveHomeData(row.id, source, locale);
    const media = await resolveMedia(source, row.og_image_media_id ?? null, locale);
    return { content: content as T, ...media };
  }
  if (key === "about") {
    const parsed = aboutSchema.safeParse(row.data);
    if (!parsed.success) return null;
    const source = normalizeAbout(parsed.data);
    if (Object.keys(aboutIdentityErrors(source)).length) return null;
    const content = await resolveAboutData(row.id, source, locale);
    const media = await resolveMedia(source, uuid.safeParse(row.og_image_media_id).success ? row.og_image_media_id : null, locale);
    return { content: content as T, ...media };
  }
  // Validate before resolving UUID references: malformed legacy rows must use the fallback,
  // rather than reaching media queries with invalid IDs and failing the whole route.
  if (key === "services" && !servicesSchema.safeParse(row.data).success) return null;

  if (key === "guides") {
    const source = guidesSourceContent(row.data);
    const localized = await resolveData(row.id, source, locale, translatablePathsByPage.guides);
    const content = guidesLocalizedContent(source, localized);
    const media = await resolveMedia(content, uuid.safeParse(row.og_image_media_id).success ? row.og_image_media_id : null, locale);
    return { content: content as T, ...media };
  }

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
  unstable_cache(() => getPublishedPageLocale("home", locale), ["pages:publishedLocale:v1", "home", locale], { tags: [pageLocaleTag("home", locale)] })();

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
export async function getBlogPage(locale: Locale): Promise<BlogPage> {
  return await cached<BlogPage["content"]>("blog", locale)
    ?? { content: structuredClone(defaultBlog), media: {}, ogImage: null };
}

export async function getBlogAsideCta(locale: Locale): Promise<BlogAsideCta> {
  const page = await getBlogPage(locale);
  const a = page.content.post_aside;
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
  const page = await getGuidesPage(locale);
  const a = page.content.guide_aside;
  return {
    image: (a.image_media_id && page?.media[a.image_media_id]) || null,
    eyebrow: a.eyebrow || undefined,
    title: a.title,
    body: a.body || undefined,
    cta: { label: a.cta_label, href: `/${locale}/buildings` },
  };
}

/**
 * The Buildings listing's editable sections (`buildings` row, spec buildings-admin-editor S2):
 * the row's content parsed with `buildingsSchema`, or `defaultBuildings` (blank texts + the
 * three current figures) while no row exists or it fails the schema — never null, so the
 * listing always renders. Blank texts are resolved to i18n by the section components.
 */
export async function getBuildingsPage(locale: Locale): Promise<BuildingsPage> {
  const page = await cached<unknown>("buildings", locale);
  if (page) {
    const parsed = buildingsSchema.safeParse(page.content);
    if (parsed.success) return { content: parsed.data, media: page.media, ogImage: page.ogImage };
  }
  return { content: defaultBuildings, media: {}, ogImage: page?.ogImage ?? null };
}

/** Cached editorial overrides, with locale-message fallback for missing/invalid content. */
export async function getServicesPage(locale: Locale): Promise<ServicesPage> {
  const page = await cached<unknown>("services", locale);
  const parsed = page ? servicesSchema.safeParse(page.content) : null;
  if (parsed?.success && page) return { ...page, content: parsed.data };
  return { content: defaultServices, media: {}, ogImage: page?.ogImage ?? null };
}

/** Never null: legacy rows keep their aside, missing blocks use visitor-locale messages. */
export async function getGuidesPage(locale: Locale): Promise<GuidesPage> {
  const page = await cached<GuidesPage["content"]>("guides", locale);
  return page ?? { content: structuredClone(defaultGuides), media: {}, ogImage: null };
}
