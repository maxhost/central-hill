"use server";

import { requireStaff } from "@core/auth";
import {
  finalizeUpload,
  loadMedia,
  mediaUrl,
  type PresignInput,
  type PresignResult,
  presignUpload,
} from "@core/media";

/**
 * Backoffice media-upload server actions (S12 + ADR 0018). The kernel's
 * `core/media` ingest functions are `server-only` and deliberately **not**
 * auth-gated — these thin `requireStaff`-gated wrappers are the admin entry point
 * the `MediaField` / `MediaGalleryField` client islands call. Bytes never transit
 * a function: the browser PUTs straight to R2 against the presigned URL, then
 * `finalizeAdminUpload` verifies + records the asset and hands back a preview.
 *
 * ADR 0018 places the media admin UI in the S12 backoffice; this is its server seam.
 */

/** A resolved, render-ready view of a `media_asset` for admin previews. */
export interface AdminMediaPreview {
  id: string;
  /** Public R2 URL (or dev fallback) for the asset. */
  url: string;
  /** Intrinsic dimensions (null for video / unknown). */
  width: number | null;
  height: number | null;
  mime: string;
}

/** Phase 1 — mint an id + short-lived presigned PUT URL (validates type/size). */
export async function presignAdminUpload(input: PresignInput): Promise<PresignResult> {
  await requireStaff();
  return presignUpload(input);
}

/** Phase 2 — verify the uploaded object, record metadata, return a preview. */
export async function finalizeAdminUpload(input: {
  id: string;
  r2Key: string;
}): Promise<AdminMediaPreview> {
  await requireStaff();
  const asset = await finalizeUpload({ id: input.id, r2Key: input.r2Key });
  return {
    id: asset.id,
    url: mediaUrl(asset.r2_key),
    width: asset.width,
    height: asset.height,
    mime: asset.mime,
  };
}

/**
 * Resolve previews for already-persisted assets (editing an existing record).
 * Returns a `{ id → preview }` map; ids with no asset are simply omitted.
 */
export async function resolveMediaPreviews(
  ids: string[],
): Promise<Record<string, AdminMediaPreview>> {
  await requireStaff();
  const clean = ids.filter(Boolean);
  if (clean.length === 0) return {};
  const assets = await loadMedia(clean);
  const out: Record<string, AdminMediaPreview> = {};
  for (const [id, asset] of assets) {
    out[id] = {
      id,
      url: mediaUrl(asset.r2_key),
      width: asset.width,
      height: asset.height,
      mime: asset.mime,
    };
  }
  return out;
}
