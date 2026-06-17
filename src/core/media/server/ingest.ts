import "server-only";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { encode } from "blurhash";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import type { MediaAsset } from "../queries";
import { media_asset } from "../schema";
import { r2Bucket, r2Client, r2Delete, r2GetBytes } from "./r2";

/**
 * Media upload pipeline (kernel — `core/media`, ADR 0018). Two-phase, presigned
 * direct-to-R2 upload: `presignUpload` mints an id + a short-lived PUT URL the admin
 * browser uploads to directly (bytes never transit our functions — large video heroes
 * work); `finalizeUpload` then HEADs the object, computes image `width`/`height` +
 * `blurhash` server-side (never trusting the client), and inserts the `media_asset`
 * row. `deleteMedia` removes the row and its object.
 *
 * These functions are NOT auth-gated themselves: callers are the `requireStaff`-gated
 * admin server actions (ADR 0009/0017) that wrap them. Server-only; never on the
 * public render path. No derivative ladder is stored — responsive resizing is delegated
 * to Next/Image at request time (ADR 0018).
 */

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO_MIME = new Set(["video/mp4", "video/webm"]);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB — premium hero JPEGs sit well under this.
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB — hero loops, not feature films.
const PRESIGN_TTL_SECONDS = 600; // 10 min to start the PUT.

/**
 * Lazy-load the native `sharp` binary only when an image is actually processed. A
 * top-level `import sharp` triggers sharp's native dlopen at module-load time — which
 * fails on the Netlify linux-x64 serverless runtime (ERR_DLOPEN_FAILED: libvips) — and
 * since this module is reachable from the admin shell's contract imports, that crashed
 * the whole backoffice (500). Deferring the import keeps the admin renderable; sharp
 * only loads on the upload-finalize path (which staff trigger, not page render).
 */
async function loadSharp() {
  return (await import("sharp")).default;
}

type MediaKind = "image" | "video";

function mediaKind(mime: string): MediaKind {
  if (IMAGE_MIME.has(mime)) return "image";
  if (VIDEO_MIME.has(mime)) return "video";
  throw new Error(`Unsupported media type: ${mime || "(none)"}`);
}

function maxBytesFor(kind: MediaKind): number {
  return kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

/** Lowercase, slug-ish filename so R2 keys stay clean and URL-safe. */
function safeFilename(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return cleaned || "file";
}

const ASSET_COLUMNS = {
  id: media_asset.id,
  r2_key: media_asset.r2_key,
  mime: media_asset.mime,
  width: media_asset.width,
  height: media_asset.height,
  blurhash: media_asset.blurhash,
} as const;

export interface PresignInput {
  filename: string;
  contentType: string;
  /** Declared size (bytes) — a soft gate; the real limit is enforced on finalize. */
  size: number;
}

export interface PresignResult {
  /** The id the row will get — pass it back to `finalizeUpload`. */
  id: string;
  r2Key: string;
  uploadUrl: string;
  /** Header the browser MUST send on the PUT (must match what we signed). */
  contentType: string;
  expiresInSeconds: number;
}

export async function presignUpload(input: PresignInput): Promise<PresignResult> {
  const kind = mediaKind(input.contentType);
  if (input.size > maxBytesFor(kind)) {
    throw new Error(`File too large for ${kind}: ${input.size} bytes.`);
  }
  const id = crypto.randomUUID();
  const r2Key = `${id}/${safeFilename(input.filename)}`;
  const uploadUrl = await getSignedUrl(
    r2Client(),
    new PutObjectCommand({ Bucket: r2Bucket(), Key: r2Key, ContentType: input.contentType }),
    { expiresIn: PRESIGN_TTL_SECONDS },
  );
  return { id, r2Key, uploadUrl, contentType: input.contentType, expiresInSeconds: PRESIGN_TTL_SECONDS };
}

export interface FinalizeInput {
  /** The id returned by `presignUpload`. */
  id: string;
  r2Key: string;
  credit?: string | null;
}

/** Downscale to a tiny raster and encode a 4×4-component blurhash (LCP placeholder). */
async function encodeBlurhash(bytes: Buffer): Promise<string | null> {
  try {
    const sharp = await loadSharp();
    const { data, info } = await sharp(bytes)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: "inside" })
      .toBuffer({ resolveWithObject: true });
    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  } catch {
    return null; // A missing placeholder must never block a successful upload.
  }
}

export async function finalizeUpload(input: FinalizeInput): Promise<MediaAsset> {
  // 1. Verify the object actually landed and read its real type/size.
  const head = await r2Client().send(
    new HeadObjectCommand({ Bucket: r2Bucket(), Key: input.r2Key }),
  );
  const mime = head.ContentType ?? "application/octet-stream";
  const size = head.ContentLength ?? 0;
  const kind = mediaKind(mime);
  if (size > maxBytesFor(kind)) {
    await r2Delete(input.r2Key); // reject oversize uploads; don't leave bytes behind.
    throw new Error(`Uploaded ${kind} exceeds the size limit (${size} bytes).`);
  }

  // 2. Compute correctness-critical metadata server-side (never trust the client).
  let width: number | null = null;
  let height: number | null = null;
  let blurhash: string | null = null;
  if (kind === "image") {
    const sharp = await loadSharp();
    const bytes = await r2GetBytes(input.r2Key);
    const meta = await sharp(bytes).metadata();
    width = meta.width ?? null;
    height = meta.height ?? null;
    blurhash = await encodeBlurhash(bytes);
  }

  // 3. Insert the row (idempotent: a retried finalize returns the existing asset).
  const inserted = await db
    .insert(media_asset)
    .values({ id: input.id, r2_key: input.r2Key, mime, width, height, blurhash, credit: input.credit ?? null })
    .onConflictDoNothing({ target: media_asset.id })
    .returning(ASSET_COLUMNS);

  const row =
    inserted[0] ??
    (
      await db.select(ASSET_COLUMNS).from(media_asset).where(eq(media_asset.id, input.id)).limit(1)
    )[0];
  if (!row) throw new Error(`finalizeUpload: could not persist media_asset ${input.id}.`);
  return row;
}

/**
 * Delete an asset: removes the R2 object then the row. Translation rows for the
 * `alt` field (owned by `core/i18n`) and reference-safety checks are the caller's
 * concern (ADR 0018 defers refcount GC to the admin slices).
 */
export async function deleteMedia(id: string): Promise<void> {
  const [row] = await db
    .select({ r2_key: media_asset.r2_key })
    .from(media_asset)
    .where(eq(media_asset.id, id))
    .limit(1);
  if (!row) return;
  await r2Delete(row.r2_key);
  await db.delete(media_asset).where(eq(media_asset.id, id));
}
