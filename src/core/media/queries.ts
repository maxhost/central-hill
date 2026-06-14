import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@core/db/client";
import { media_asset } from "./schema";

/**
 * Media reads (kernel — `core/media`). Content tables store a `media_asset.id`;
 * slices resolve those ids to renderable data with `loadMedia` and build a
 * `MediaImageData` via `mediaUrl`. `alt` is a **[T]** field and is resolved by the
 * caller through `core/i18n` (entity_type='media_asset', field='alt').
 */
export interface MediaAsset {
  id: string;
  r2_key: string;
  mime: string;
  width: number | null;
  height: number | null;
  blurhash: string | null;
}

export async function loadMedia(ids: string[]): Promise<Map<string, MediaAsset>> {
  const out = new Map<string, MediaAsset>();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return out;

  const rows = await db
    .select({
      id: media_asset.id,
      r2_key: media_asset.r2_key,
      mime: media_asset.mime,
      width: media_asset.width,
      height: media_asset.height,
      blurhash: media_asset.blurhash,
    })
    .from(media_asset)
    .where(inArray(media_asset.id, unique));

  for (const r of rows) out.set(r.id, r);
  return out;
}
