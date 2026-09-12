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

/**
 * Upload actions return a result union rather than throwing.
 *
 * **Next masks every error thrown from a Server Action in production** — the client
 * only ever receives "An error occurred in the Server Components render", with the
 * cause reachable solely by correlating a digest against the platform logs. That makes
 * a failed upload undiagnosable from the backoffice, which is where it is observed.
 * Returning the message as a *value* is the only way it survives the boundary, so
 * staff see "File too large" or "the image processor is unavailable" instead of a
 * digest. The full error, with stack, is still logged server-side.
 */
export type AdminUploadResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Native image processing is the one dependency that can be missing at runtime. */
function describeFailure(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  if (/libvips|ERR_DLOPEN_FAILED|Could not load the "sharp" module/i.test(raw)) {
    return "The image processor is unavailable on the server (sharp/libvips failed to load). This is a deployment problem, not a problem with your file — see ADR 0029.";
  }
  return raw;
}

/** Log with a greppable prefix so the cause is one `vercel logs | grep` away. */
function logFailure(phase: string, input: unknown, e: unknown): void {
  console.error(`[media:${phase}] upload failed`, { input, error: e });
}

/** Phase 1 — mint an id + short-lived presigned PUT URL (validates type/size). */
export async function presignAdminUpload(
  input: PresignInput,
): Promise<AdminUploadResult<PresignResult>> {
  await requireStaff();
  try {
    return { ok: true, data: await presignUpload(input) };
  } catch (e) {
    logFailure("presign", input, e);
    return { ok: false, error: describeFailure(e) };
  }
}

/** Phase 2 — verify the uploaded object, record metadata, return a preview. */
export async function finalizeAdminUpload(input: {
  id: string;
  r2Key: string;
}): Promise<AdminUploadResult<AdminMediaPreview>> {
  await requireStaff();
  try {
    const asset = await finalizeUpload({ id: input.id, r2Key: input.r2Key });
    return {
      ok: true,
      data: {
        id: asset.id,
        url: mediaUrl(asset.r2_key),
        width: asset.width,
        height: asset.height,
        mime: asset.mime,
      },
    };
  } catch (e) {
    logFailure("finalize", input, e);
    return { ok: false, error: describeFailure(e) };
  }
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
