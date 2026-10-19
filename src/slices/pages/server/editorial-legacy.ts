import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { loadContent, loadTranslationRows } from "@core/i18n";
import { page_content } from "../schema";
import { getEditorialAdapter } from "./editorial-adapters";
import { homeSet } from "../home-content";
import { captureLegacyPending } from "../editorial-content";
import type { EditorialPageKey, PageEnvelope } from "../editorial-types";
import type { EditorialRow } from "../admin/editorial-store";
import { guidesEditorDefaults } from "../admin/guides-defaults";
import { aboutEditorDefaults } from "../admin/about-defaults";
import { blogEditorDefaults } from "../admin/blog-defaults";
import { guidesSourceContent, guidesLocalizedContent } from "./guides-content";
import { uuid } from "@core/validation/primitives";
import { blogLocalizedContent } from "../blog-content";
const editorialLocales = ["en", "es", "pt", "fr"] as const;
/** Per-adapter legacy policy. Public salvage never authorizes adopting corrupt source. */
export function legacySource(key: EditorialPageKey, raw: unknown, exists: boolean): { content: unknown; invalid: boolean } {
  if (key === "services") { const parsed = getEditorialAdapter(key).publishSchema.safeParse(raw); return { content: parsed.success ? parsed.data : {}, invalid: exists && !parsed.success }; }
  if (key === "guides") { const value = guidesEditorDefaults(raw, exists); return { content: guidesSourceContent(exists ? raw : value.data), invalid: value.sourceInvalid }; }
  if (key === "about") { const value = aboutEditorDefaults(raw, exists); return { content: value.data, invalid: value.sourceInvalid }; }
  if (key === "blog") { const value = blogEditorDefaults(raw, exists); return { content: value.data, invalid: value.sourceInvalid }; }
  return { content: raw, invalid: false };
}
export async function legacyEditorialRows<K extends EditorialPageKey = "home">(
  key: K = "home" as K,
  publicFallback = false,
): Promise<EditorialRow<K>[]> {
  const [source] = await db
    .select()
    .from(page_content)
    .where(eq(page_content.key, key))
    .limit(1);
  const adapter = getEditorialAdapter(key);
  const snapshot = legacySource(key, source?.data, Boolean(source));
  if (snapshot.invalid && !publicFallback) throw new Error("Invalid legacy page content");
  const parsed = adapter.publishSchema.safeParse(snapshot.content);
  if ((!parsed.success || snapshot.invalid) && !publicFallback && source) throw new Error("Invalid legacy page content");
  if (!parsed.success && key !== "buildings") {
    if (source) throw new Error("Invalid legacy page content");
    return [];
  }
  const content = adapter.normalize(
    parsed.success ? parsed.data : adapter.defaultContent(),
  );
  if (Object.keys(adapter.identityErrors(content)).length)
    throw new Error("Invalid legacy page identities");
  const translations =
    source && parsed.success
      ? await loadTranslationRows({ type: "page_content", id: source.id })
      : [];
  return Promise.all(
    editorialLocales.map(async (locale) => {
      const localized = structuredClone(key === "services" && parsed.success ? parsed.data : content);
      if (source && parsed.success && locale !== "en") {
        const resolver = await loadContent(
          [{ type: "page_content", id: source.id }],
          locale,
        );
        for (const path of adapter.textPaths(localized)) {
          const value = resolver.get(
            "page_content",
            source.id,
            adapter.translationField(content, path),
          );
          if (value !== undefined) homeSet(localized, path, value);
        }
      }
      const effective = key === "guides" ? guidesLocalizedContent(content as never, localized) : key === "blog" ? blogLocalizedContent(content as never, localized) : localized;
      const published: PageEnvelope<K> = {
        schemaVersion: 1,
        content: adapter.normalize(effective as typeof content),
        ogImageMediaId: uuid.safeParse(source?.og_image_media_id).success ? source!.og_image_media_id : null,
      };
      const pending = translations.filter(
        (row) =>
          row.locale === locale &&
          row.state !== "approved" &&
          row.field.startsWith("block:"),
      );
      const draft =
        locale === "en"
          ? null
          : captureLegacyPending(published, pending, adapter.descriptor);
      return {
        id: source?.id ?? "",
        page_key: key,
        locale,
        published,
        draft,
        revision: 0,
        published_at: source?.updated_at ?? new Date(),
        draft_saved_at: draft ? (source?.updated_at ?? new Date()) : null,
        updated_by: null,
        created_at: source?.created_at ?? new Date(),
        updated_at: source?.updated_at ?? new Date(),
      };
    }),
  );
}
