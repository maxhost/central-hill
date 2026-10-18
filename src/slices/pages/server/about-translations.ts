import "server-only";
import { loadContent } from "@core/i18n";
import type { Locale } from "@core/db/columns";
import { aboutTranslationField } from "../about-content";
import type { AboutContent } from "../schemas/about";
import { translatablePathsByPage } from "../schemas";
import { overlayTranslations, type Json } from "./overlay";
export async function resolveAboutData(id: string, data: AboutContent, locale: Locale): Promise<AboutContent> {
  if (locale === "en") return data;
  const resolver = await loadContent([{ type: "page_content", id }], locale);
  return overlayTranslations(data as Json, translatablePathsByPage.about, path => resolver.get("page_content", id, aboutTranslationField(data, path))) as AboutContent;
}
