import { inflateRawSync } from "node:zlib";

/**
 * Pure byte/metadata inspectors for the upload pipeline (kernel — `core/media`, spec
 * home-admin-editor S6). Kept free of `server-only`, the DB and R2 so they are unit
 * testable; `ingest.ts` is the only production caller.
 */

// ── Animated images ──────────────────────────────────────────────────────────

/** The subset of `sharp`'s metadata the frame logic reads. */
export interface FrameMetadata {
  width?: number | undefined;
  height?: number | undefined;
  pages?: number | undefined;
  pageHeight?: number | undefined;
}

/** More than one frame — an animated WebP (or PNG). Such a master is never re-encoded. */
export function isAnimatedImage(meta: FrameMetadata): boolean {
  return (meta.pages ?? 1) > 1;
}

/**
 * Dimensions of **one frame**. Read with `{ animated: true }`, sharp reports `height` as
 * the whole frame strip (frames × frame height) and `pageHeight` as one frame; read
 * without it, `height` is already one frame. Preferring `pageHeight` is right either way.
 */
export function frameDimensions(meta: FrameMetadata): { width: number | null; height: number | null } {
  return {
    width: meta.width ?? null,
    height: (isAnimatedImage(meta) ? (meta.pageHeight ?? meta.height) : meta.height) ?? null,
  };
}

// ── Lottie ───────────────────────────────────────────────────────────────────

export const MAX_LOTTIE_BYTES = 10 * 1024 * 1024; // 10 MB — vector animations, not footage.

/** What a validated Lottie yields: its canvas size, when it could be read. */
export interface LottieInfo {
  width: number | null;
  height: number | null;
}

function positive(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

/**
 * Validate a Lottie JSON animation and read its canvas size. A Lottie is an object with
 * a version `v`, a canvas `w` × `h` and a `layers` array — anything else (an arbitrary
 * JSON file picked by mistake) is rejected.
 */
export function inspectLottieJson(bytes: Uint8Array): LottieInfo {
  let doc: unknown;
  try {
    doc = JSON.parse(Buffer.from(bytes).toString("utf8"));
  } catch {
    throw new Error("Not a Lottie animation: the file is not valid JSON.");
  }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    throw new Error("Not a Lottie animation: expected a JSON object.");
  }
  const { v, w, h, layers } = doc as Record<string, unknown>;
  if (typeof v !== "string" || !positive(w) || !positive(h) || !Array.isArray(layers)) {
    throw new Error("Not a Lottie animation: missing version, size (w/h) or layers.");
  }
  return { width: Math.round(w), height: Math.round(h) };
}

const ZIP_LOCAL = 0x04034b50;
const ZIP_CENTRAL = 0x02014b50;
const ZIP_EOCD = 0x06054b50;
const MAX_INFLATED = 50 * 1024 * 1024;

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  localOffset: number;
}

/**
 * List a zip's entries from its central directory — just enough of the format to check a
 * `.lottie` without a zip dependency. Returns `null` when the bytes are not a readable zip.
 */
function zipEntries(buf: Buffer): ZipEntry[] | null {
  if (buf.length < 22 || buf.readUInt32LE(0) !== ZIP_LOCAL) return null;
  // The end-of-central-directory record sits in the last 22 bytes + an optional comment.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === ZIP_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries: ZipEntry[] = [];
  for (let n = 0; n < count; n++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== ZIP_CENTRAL) return null;
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    if (p + 46 + nameLen > buf.length) return null;
    entries.push({
      name: buf.toString("utf8", p + 46, p + 46 + nameLen),
      method: buf.readUInt16LE(p + 10),
      compressedSize: buf.readUInt32LE(p + 20),
      localOffset: buf.readUInt32LE(p + 42),
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/** Bytes of one zip entry (stored or deflated), or `null` if unreadable. */
function zipEntryBytes(buf: Buffer, e: ZipEntry): Buffer | null {
  const at = e.localOffset;
  if (at + 30 > buf.length || buf.readUInt32LE(at) !== ZIP_LOCAL) return null;
  const start = at + 30 + buf.readUInt16LE(at + 26) + buf.readUInt16LE(at + 28);
  const end = start + e.compressedSize;
  if (end > buf.length) return null;
  const raw = buf.subarray(start, end);
  try {
    if (e.method === 0) return raw;
    if (e.method === 8) return inflateRawSync(raw, { maxOutputLength: MAX_INFLATED });
  } catch {
    return null;
  }
  return null;
}

/**
 * Validate a dotLottie (`.lottie`): a zip with a `manifest.json` at its root. The canvas
 * size is read best-effort from the first animation (`a/*.json` in dotLottie v2,
 * `animations/*.json` in v1); a file whose animation cannot be read still passes with
 * null dimensions — the public frame is a fixed 4:5 and does not need them.
 */
export function inspectDotLottie(bytes: Uint8Array): LottieInfo {
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries = zipEntries(buf);
  if (!entries) throw new Error("Not a .lottie file: it is not a zip archive.");
  if (!entries.some((e) => e.name === "manifest.json")) {
    throw new Error("Not a .lottie file: manifest.json is missing.");
  }
  const animation = entries.find((e) => /^(a|animations)\/[^/]+\.json$/.test(e.name));
  const json = animation ? zipEntryBytes(buf, animation) : null;
  if (!json) return { width: null, height: null };
  try {
    return inspectLottieJson(json);
  } catch {
    return { width: null, height: null };
  }
}
