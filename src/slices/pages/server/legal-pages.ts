import "server-only";
import type { Metadata } from "next";
import type { Locale } from "@core/db/columns";
import { LOCALES } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { unstable_cache } from "next/cache";
import type { PageResult } from "../contract";
import { LEGAL_PAGE_KEYS, legalPagePaths, type LegalPageContent, type LegalPageKey } from "../legal-page-content";
import { pageLocaleTag } from "../editorial-registry";
import { getPublishedPageLocale } from "./editorial-publication";

export function getLegalPage(key: LegalPageKey, locale: Locale): Promise<PageResult<LegalPageContent> | null> {
  return unstable_cache(() => getPublishedPageLocale(key, locale), ["pages:legal:v1", key, locale], {
    tags: [pageLocaleTag(key, locale), pageLocaleTag(key, "en")],
  })();
}
export async function listAvailableLegalPages(locale: Locale): Promise<LegalPageKey[]> {
  const pages = await Promise.all(LEGAL_PAGE_KEYS.map(key => getLegalPage(key, locale)));
  return LEGAL_PAGE_KEYS.filter((_key, index) => pages[index] !== null);
}
export async function buildLegalPageMetadata(key: LegalPageKey, locale: Locale): Promise<Metadata> {
  const page = await getLegalPage(key, locale);
  if (!page) return { robots: { index: false, follow: false } };
  const available = await Promise.all(LOCALES.map(async language => (await getLegalPage(key, language)) ? language : null));
  const languages = Object.fromEntries(available.filter((value): value is Locale => value !== null).map(language => [language, `/${language}${legalPagePaths[key]}`]));
  if (available.includes("en")) languages["x-default"] = `/en${legalPagePaths[key]}`;
  return buildMetadata({
    title: page.content.seo.meta_title.trim() || page.content.title,
    description: page.content.seo.meta_description.trim() || undefined,
    canonicalPath: `/${locale}${legalPagePaths[key]}`,
    languages,
    images: page.ogImage ? [{ url: page.ogImage.url, width: page.ogImage.width, height: page.ogImage.height, alt: page.ogImage.alt }] : undefined,
  });
}
