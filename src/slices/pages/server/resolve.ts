import "server-only";
import type { Locale } from "@core/db/columns";
import { loadContent } from "@core/i18n/content";
import { type MediaImageData, loadMedia, mediaUrl } from "@core/media";
import { PAGE_CONTENT } from "../contract";
import { type Json, collectMediaIds, overlayTranslations } from "./overlay";

/**
 * Locale + media resolution for `page_content` (slice `pages`). The source-locale values
 * live inline in the row's `data` jsonb; target-locale [T] leaves live in the `translation`
 * table keyed `field='block:<dot.path>'` (data-model.md → Page content). The pure overlay /
 * path / media-collection logic lives in `overlay.ts` (unit tested); this module supplies
 * the `core/i18n` + `core/media` reads. The public reads in `queries.ts` wrap these in
 * `unstable_cache`.
 */

const SOURCE_LOCALE: Locale = "en";
const MEDIA_ASSET = "media_asset";

/**
 * Resolve a page's `data` for `locale`. Source locale returns `data` as authored; a target
 * locale returns a clone with every approved `block:<path>` overlaid.
 */
export async function resolveData(
  pageId: string,
  data: Json,
  locale: Locale,
  translatablePaths: string[],
): Promise<Json> {
  if (locale === SOURCE_LOCALE) return data;

  const resolver = await loadContent([{ type: PAGE_CONTENT, id: pageId }], locale);
  return overlayTranslations(data, translatablePaths, (path) =>
    resolver.get(PAGE_CONTENT, pageId, `block:${path}`),
  );
}

/**
 * Resolve every media reference in `data` (+ the OG override) into `MediaImageData`, with
 * [T] `alt` resolved for `locale`. Hero videos use the same map (read `.url`).
 */
export async function resolveMedia(
  data: Json,
  ogImageMediaId: string | null,
  locale: Locale,
): Promise<{ media: Record<string, MediaImageData>; ogImage: MediaImageData | null }> {
  const ids: string[] = [];
  collectMediaIds(data, ids);
  if (ogImageMediaId) ids.push(ogImageMediaId);
  const unique = Array.from(new Set(ids));

  const [assets, alts] = await Promise.all([
    loadMedia(unique),
    loadContent(
      unique.map((id) => ({ type: MEDIA_ASSET, id })),
      locale,
    ),
  ]);

  const media: Record<string, MediaImageData> = {};
  for (const id of unique) {
    const asset = assets.get(id);
    if (!asset) continue;
    media[id] = {
      url: mediaUrl(asset.r2_key),
      width: asset.width ?? 0,
      height: asset.height ?? 0,
      alt: alts.get(MEDIA_ASSET, id, "alt") ?? "",
      blurhash: asset.blurhash,
    };
  }

  const ogImage = ogImageMediaId ? (media[ogImageMediaId] ?? null) : null;
  return { media, ogImage };
}
