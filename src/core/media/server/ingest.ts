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
 * Upload-time normalisation budget (ADR 0025, amends 0018's "only the original lands
 * in R2"). A photographer's 6000×4000 12 MB export is re-read *in full* by the
 * optimizer for every single (width, format) it serves, so the master is capped once
 * at upload instead. 3000px is comfortably above the largest width we ever request.
 */
const NORMALISE_MAX_EDGE = 3000;

/**
 * Re-encoders for a master that had to be resized, keyed by mime. The format is
 * **preserved** — the r2 key's extension and the row's `mime` must keep describing the
 * bytes. Quality is deliberately higher than delivery quality: this is the source the
 * optimizer re-encodes from, so its artefacts would compound.
 */
type SharpPipeline = ReturnType<Awaited<ReturnType<typeof loadSharp>>>;

const MASTER_ENCODERS: Record<string, (t: SharpPipeline) => SharpPipeline> = {
  "image/jpeg": (t) => t.jpeg({ quality: 82, mozjpeg: true }),
  "image/png": (t) => t.png({ compressionLevel: 9 }),
  "image/webp": (t) => t.webp({ quality: 82 }),
  "image/avif": (t) => t.avif({ quality: 70, effort: 3 }),
};

/**
 * Cache directive signed into every upload (ADR 0024). `r2_key` is `${uuid}/${filename}`,
 * so a key is **immutable by construction** — replacing a photo mints a new uuid and
 * therefore a new key. A one-year immutable cache is not a bet, it is a fact about the
 * naming scheme. Objects previously served with no directive at all.
 *
 * ⚠️ Setting it on the command alone does **nothing**. By default the presigner signs only
 * `host` and neither hoists `Content-Type`/`CacheControl` into the query string nor requires
 * them — verified against the real bucket, where a PUT with no headers at all returned 200
 * and stored the object with no cache directive. The directive is whatever the **browser**
 * sends, so `signableHeaders` below puts both headers into the signature: now an upload that
 * omits or alters either is rejected with a 403 instead of silently landing uncacheable.
 * That makes the bucket's CORS `AllowedHeaders` load-bearing — it must list `content-type`
 * **and** `cache-control`, or the browser blocks the request at preflight.
 */
const UPLOAD_CACHE_CONTROL = "public, max-age=31536000, immutable";

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
  /** Ditto — signed, so the PUT is rejected unless the browser echoes it exactly. */
  cacheControl: string;
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
    new PutObjectCommand({
      Bucket: r2Bucket(),
      Key: r2Key,
      ContentType: input.contentType,
      CacheControl: UPLOAD_CACHE_CONTROL,
    }),
    {
      expiresIn: PRESIGN_TTL_SECONDS,
      signableHeaders: new Set(["content-type", "cache-control"]),
    },
  );
  return {
    id,
    r2Key,
    uploadUrl,
    contentType: input.contentType,
    cacheControl: UPLOAD_CACHE_CONTROL,
    expiresInSeconds: PRESIGN_TTL_SECONDS,
  };
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
      // `.rotate()` applies any EXIF orientation first. Without it a phone-shot
      // portrait yields a sideways placeholder that visibly snaps upright on load.
      .rotate()
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: "inside" })
      .toBuffer({ resolveWithObject: true });
    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  } catch {
    return null; // A missing placeholder must never block a successful upload.
  }
}

/** What we ended up storing for an image, after the normalisation pass. */
interface ImageMaster {
  /** Visual dimensions — i.e. after EXIF orientation, not the raw pixel buffer's. */
  width: number | null;
  height: number | null;
  /** Size of the object now in R2. */
  bytes: number;
  /** The bytes now stored, for blurhash encoding. */
  buffer: Buffer;
}

/**
 * Normalise an uploaded image in place (ADR 0025): cap the longest edge at
 * `NORMALISE_MAX_EDGE`, bake in EXIF orientation and drop the EXIF block, keep the
 * colour profile, and re-encode in the same format. The result replaces the object at
 * the same key.
 *
 * Two things are deliberately *not* done:
 * - **An image already within budget is left byte-for-byte alone**, so a hand-tuned
 *   export is never recompressed. Its orientation-corrected dimensions are still
 *   recorded, because `next/image` rotates at optimize time and storing the raw
 *   pre-rotation `width`/`height` would hand the browser a transposed aspect ratio —
 *   layout shift on exactly the portrait photos the correction is for.
 * - **A re-encode that comes out larger than the original is discarded.** Normalising
 *   must never make a file worse.
 *
 * Overwriting a key looks like it fights ADR 0024's immutable cache directive. It does
 * not: this runs inside finalize, and the asset's public URL is only ever constructed
 * *from a finalized row*, so no cache anywhere can hold the pre-normalisation bytes.
 */
async function normaliseImageMaster(
  r2Key: string,
  original: Buffer,
  mime: string,
): Promise<ImageMaster> {
  const sharp = await loadSharp();
  const meta = await sharp(original).metadata();

  // EXIF orientations 5–8 transpose the image, so the visual axes are swapped.
  const transposed = (meta.orientation ?? 1) >= 5;
  const visualWidth = (transposed ? meta.height : meta.width) ?? null;
  const visualHeight = (transposed ? meta.width : meta.height) ?? null;
  const asStored: ImageMaster = {
    width: visualWidth,
    height: visualHeight,
    bytes: original.length,
    buffer: original,
  };

  const encode = MASTER_ENCODERS[mime];
  const longestEdge = Math.max(visualWidth ?? 0, visualHeight ?? 0);
  if (!encode || longestEdge <= NORMALISE_MAX_EDGE) return asStored;

  const { data, info } = await encode(
    sharp(original)
      .rotate() // apply EXIF orientation, then let sharp drop the metadata block
      .resize({
        width: NORMALISE_MAX_EDGE,
        height: NORMALISE_MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .keepIccProfile(), // colours must survive; the orientation tag must not
  ).toBuffer({ resolveWithObject: true });

  if (data.length >= original.length) return asStored;

  await r2Client().send(
    new PutObjectCommand({
      Bucket: r2Bucket(),
      Key: r2Key, // same key: normalisation replaces the master, it does not add one
      Body: data,
      ContentType: mime,
      CacheControl: UPLOAD_CACHE_CONTROL,
    }),
  );
  return { width: info.width, height: info.height, bytes: data.length, buffer: data };
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

  // 2. Normalise the master, then compute correctness-critical metadata server-side
  //    (never trust the client) from the bytes we actually ended up storing.
  let width: number | null = null;
  let height: number | null = null;
  let blurhash: string | null = null;
  let bytes = size;
  if (kind === "image") {
    const master = await normaliseImageMaster(input.r2Key, await r2GetBytes(input.r2Key), mime);
    width = master.width;
    height = master.height;
    bytes = master.bytes;
    blurhash = await encodeBlurhash(master.buffer);
  }

  // 3. Insert the row (idempotent: a retried finalize returns the existing asset).
  const inserted = await db
    .insert(media_asset)
    .values({
      id: input.id,
      storage: "r2",
      r2_key: input.r2Key,
      mime,
      width,
      height,
      bytes,
      blurhash,
      credit: input.credit ?? null,
    })
    .onConflictDoNothing({ target: media_asset.id })
    .returning(ASSET_COLUMNS);

  const row =
    inserted[0] ??
    (
      await db.select(ASSET_COLUMNS).from(media_asset).where(eq(media_asset.id, input.id)).limit(1)
    )[0];
  if (!row) throw new Error(`finalizeUpload: could not persist media_asset ${input.id}.`);
  // `r2_key` is column-nullable for Stream assets (ADR 0026); this path only ever
  // writes an R2 row, so narrowing it back here is a fact, not an assumption.
  return { ...row, r2_key: input.r2Key };
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
  // Null for a Stream-backed asset (ADR 0026), which owns no object of ours. Deleting
  // the remote Stream video is that vendor path's job, once it exists.
  if (row.r2_key) await r2Delete(row.r2_key);
  await db.delete(media_asset).where(eq(media_asset.id, id));
}
