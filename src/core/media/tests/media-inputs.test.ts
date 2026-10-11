import assert from "node:assert/strict";
import { test } from "node:test";
import { deflateRawSync } from "node:zlib";
import sharp from "sharp";
import { DOTLOTTIE_MIME, LOTTIE_JSON_MIME, canonicalMediaMime } from "../mime";
import {
  frameDimensions,
  inspectDotLottie,
  inspectLottieJson,
  isAnimatedImage,
} from "../server/inspect";

/**
 * `core/media` upload inputs (spec home-admin-editor S6): canonical mimes, the Lottie
 * validators and the animated-WebP frame logic. Pure — no R2, no DB. Run:
 *   npx tsx --test src/core/media/tests/media-inputs.test.ts
 */

const LOTTIE = { v: "5.7.4", fr: 30, ip: 0, op: 60, w: 1200, h: 1500, layers: [] };
const bytes = (o: unknown) => Buffer.from(JSON.stringify(o));

/** A minimal zip (deflated entries) — enough for the central-directory reader. */
function zip(files: Record<string, string>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const nameBuf = Buffer.from(name);
    const data = deflateRawSync(Buffer.from(text));
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(text.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(text.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, nameBuf, data);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(Object.keys(files).length, 8);
  eocd.writeUInt16LE(Object.keys(files).length, 10);
  eocd.writeUInt32LE(cd.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, eocd]);
}

test("extension → canonical mime (a .lottie usually reports no type at all)", () => {
  assert.equal(canonicalMediaMime("hero.lottie", ""), DOTLOTTIE_MIME);
  assert.equal(canonicalMediaMime("hero.lottie", "application/octet-stream"), DOTLOTTIE_MIME);
  assert.equal(canonicalMediaMime("anim.json", "application/json"), LOTTIE_JSON_MIME);
  assert.equal(canonicalMediaMime("photo.jpg", "image/jpeg"), "image/jpeg");
  assert.equal(canonicalMediaMime("noext", ""), "");
});

test("Lottie JSON: a minimal valid animation passes and yields its canvas", () => {
  assert.deepEqual(inspectLottieJson(bytes(LOTTIE)), { width: 1200, height: 1500 });
});

test("Lottie JSON: missing layers, not an object or not JSON is rejected", () => {
  const noLayers: Partial<typeof LOTTIE> = { ...LOTTIE };
  delete noLayers.layers;
  assert.throws(() => inspectLottieJson(bytes(noLayers)), /Not a Lottie/);
  assert.throws(() => inspectLottieJson(bytes({ ...LOTTIE, w: 0 })), /Not a Lottie/);
  assert.throws(() => inspectLottieJson(bytes([LOTTIE])), /Not a Lottie/);
  assert.throws(() => inspectLottieJson(Buffer.from("{nope")), /not valid JSON/);
});

test("dotLottie: zip + manifest.json passes; dimensions read from the animation", () => {
  const v2 = zip({ "manifest.json": '{"version":"2"}', "a/main.json": JSON.stringify(LOTTIE) });
  assert.deepEqual(inspectDotLottie(v2), { width: 1200, height: 1500 });
  const v1 = zip({ "manifest.json": "{}", "animations/x.json": JSON.stringify({ ...LOTTIE, w: 800, h: 1000 }) });
  assert.deepEqual(inspectDotLottie(v1), { width: 800, height: 1000 });
  // A manifest but no readable animation still passes (the public frame is a fixed 4:5).
  assert.deepEqual(inspectDotLottie(zip({ "manifest.json": "{}" })), { width: null, height: null });
});

test("dotLottie: random bytes, a JSON file or a zip without manifest.json is rejected", () => {
  assert.throws(() => inspectDotLottie(Buffer.from("not a zip at all, just text")), /not a zip/);
  assert.throws(() => inspectDotLottie(bytes(LOTTIE)), /not a zip/);
  assert.throws(() => inspectDotLottie(zip({ "a/main.json": JSON.stringify(LOTTIE) })), /manifest\.json/);
});

test("animated WebP: detected, and its height is one frame, not the strip", async () => {
  const [w, h, frames] = [8, 10, 3];
  // Distinct frames — identical ones would be merged by the encoder into a still.
  const raw = Buffer.alloc(w * h * frames * 4);
  for (let i = 0; i < raw.length; i += 4) {
    const frame = Math.floor(i / 4 / (w * h));
    raw.set([frame * 100, 50, 200 - frame * 60, 255], i);
  }
  const anim = await sharp(raw, { raw: { width: w, height: h * frames, channels: 4, pageHeight: h } })
    .webp({ loop: 0, delay: [80, 80, 80] })
    .toBuffer();
  for (const meta of [await sharp(anim).metadata(), await sharp(anim, { animated: true }).metadata()]) {
    assert.equal(isAnimatedImage(meta), true);
    assert.deepEqual(frameDimensions(meta), { width: w, height: h });
  }
  const still = await sharp({ create: { width: w, height: h, channels: 3, background: "red" } }).webp().toBuffer();
  const meta = await sharp(still).metadata();
  assert.equal(isAnimatedImage(meta), false);
  assert.deepEqual(frameDimensions(meta), { width: w, height: h });
});
