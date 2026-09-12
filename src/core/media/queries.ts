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

  // A Stream-backed asset (ADR 0026) has no `r2_key` and cannot be rendered by the
  // image path at all — it is `MediaVideo`'s to resolve. Dropping it here keeps
  // `MediaAsset.r2_key` non-null, so none of the 18 call sites across the slices has
  // to null-check a case that could never produce an `<img>`.
  for (const r of rows) if (r.r2_key) out.set(r.id, { ...r, r2_key: r.r2_key });
  return out;
}
