import { decode } from "blurhash";

/**
 * Blurhash → `blurDataURL` (kernel — `core/media`, ADR 0027). `finalizeUpload` encodes a
 * 4×4-component blurhash for every uploaded image; this turns it back into the tiny raster
 * `next/image` wants for `placeholder="blur"`, so the visitor sees the photo's colours
 * instead of a blank box while the real bytes load.
 *
 * Why a hand-rolled PNG encoder rather than `sharp`: this runs on the **render** path, and
 * `sharp` is (a) native, (b) async, (c) deliberately lazy-loaded everywhere else in this
 * kernel because its `dlopen` crashed the serverless runtime (see `server/ingest.ts`).
 * `MediaImage` is a synchronous component used by every slice; keeping the decode pure JS
 * and synchronous means no component has to become async and nothing is pulled into a
 * client bundle that cannot run there. The encoder emits an **uncompressed** (stored-block)
 * PNG — at 12×12 the deflate would save a couple of hundred bytes and cost a dependency.
 *
 * Public pages are ISR, so this executes at build/revalidate time, not per request; the
 * module-level cache below just avoids repeating it for a photo that appears twice on a page.
 */

/** Longest side of the decoded raster. The blurhash carries 4×4 components — anything
 *  bigger is invented detail, and `next/image` gaussian-blurs the result anyway. */
const RASTER_MAX = 12;

const cache = new Map<string, string>();
const CACHE_LIMIT = 512;

let crcTable: Uint32Array | null = null;

function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  const table = crcTable;
  let c = 0xffffffff;
  for (const byte of bytes) c = (table[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (const byte of bytes) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function u32be(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

/** One PNG chunk: length, type, data, CRC over type+data. */
function chunk(type: string, data: number[]): number[] {
  const typed = [...type].map((ch) => ch.charCodeAt(0));
  const body = new Uint8Array([...typed, ...data]);
  return [...u32be(data.length), ...body, ...u32be(crc32(body))];
}

/** zlib stream wrapping `raw` in deflate *stored* blocks (BTYPE=00). */
function zlibStored(raw: Uint8Array): number[] {
  const out: number[] = [0x78, 0x01]; // CM=deflate, CINFO=7, FCHECK ok, no dict, fastest
  const MAX = 0xffff;
  for (let offset = 0; offset < raw.length || offset === 0; offset += MAX) {
    const len = Math.min(MAX, raw.length - offset);
    const final = offset + len >= raw.length ? 1 : 0;
    out.push(final, len & 0xff, (len >>> 8) & 0xff, ~len & 0xff, (~len >>> 8) & 0xff);
    for (let i = 0; i < len; i++) out.push(raw[offset + i] ?? 0);
  }
  out.push(...u32be(adler32(raw)));
  return out;
}

/** Truecolor (RGB, 8-bit) PNG from RGBA pixel data, no filtering, no compression. */
function encodePng(rgba: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const raw = new Uint8Array(height * (1 + width * 3));
  let p = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0; // filter type: None
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      raw[p++] = rgba[i] ?? 0;
      raw[p++] = rgba[i + 1] ?? 0;
      raw[p++] = rgba[i + 2] ?? 0;
    }
  }
  const ihdr = [...u32be(width), ...u32be(height), 8, 2, 0, 0, 0];
  return new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ...chunk("IHDR", ihdr),
    ...chunk("IDAT", zlibStored(raw)),
    ...chunk("IEND", []),
  ]);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Raster size for the placeholder, preserving the photo's aspect ratio. */
function rasterSize(width: number | null, height: number | null): [number, number] {
  if (!width || !height || width <= 0 || height <= 0) return [RASTER_MAX, RASTER_MAX];
  const ratio = width / height;
  return ratio >= 1
    ? [RASTER_MAX, Math.max(1, Math.round(RASTER_MAX / ratio))]
    : [Math.max(1, Math.round(RASTER_MAX * ratio)), RASTER_MAX];
}

/**
 * Decode a blurhash into a `data:image/png;base64,…` URI for `next/image`'s
 * `blurDataURL`. Returns `null` when there is no hash or it fails to decode — a broken
 * placeholder must never break the image.
 */
export function blurDataUrl(
  blurhash: string | null | undefined,
  width: number | null,
  height: number | null,
): string | null {
  if (!blurhash) return null;
  const [w, h] = rasterSize(width, height);
  const key = `${blurhash}|${w}x${h}`;
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const uri = `data:image/png;base64,${toBase64(encodePng(decode(blurhash, w, h), w, h))}`;
    if (cache.size >= CACHE_LIMIT) cache.clear();
    cache.set(key, uri);
    return uri;
  } catch {
    return null;
  }
}
