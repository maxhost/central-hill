import "server-only";
import { loadContent } from "@core/i18n";
import type { Locale } from "@core/db/columns";
import { homeTranslationField } from "../home-content";
import type { HomeContent } from "../schemas/home";
import { translatablePathsByPage } from "../schemas";
import { overlayTranslations, type Json } from "./overlay";
export async function resolveHomeData(id: string, data: HomeContent, locale: Locale): Promise<HomeContent> {
  if (locale === "en") return data;
  const resolver = await loadContent([{ type: "page_content", id }], locale);
  return overlayTranslations(data as Json, translatablePathsByPage.home, path => resolver.get("page_content", id, homeTranslationField(data, path))) as HomeContent;
}
