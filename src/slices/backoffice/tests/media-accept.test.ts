import assert from "node:assert/strict";
import { test } from "node:test";
import { DOTLOTTIE_MIME, LOTTIE_JSON_MIME } from "@core/media/mime";
import {
  acceptAttribute,
  emptyStateKey,
  isAcceptedType,
  pickedFileType,
  previewLabelKey,
} from "../ui/media-accept";

/**
 * What each `MediaField` `accept` lets staff pick (pure, no React). Run:
 *   npx tsx --test src/slices/backoffice/tests/media-accept.test.ts
 */

test("video takes MP4 / WebM only", () => {
  assert.equal(acceptAttribute("video"), "video/mp4,video/webm");
  assert.equal(isAcceptedType("video", "video/mp4"), true);
  assert.equal(isAcceptedType("video", "video/webm"), true);
  assert.equal(isAcceptedType("video", "image/jpeg"), false);
  assert.equal(isAcceptedType("video", "video/quicktime"), false);
});

test("image takes still images, never video", () => {
  assert.equal(acceptAttribute("image"), "image/jpeg,image/png,image/webp,image/avif");
  assert.equal(isAcceptedType("image", "image/webp"), true);
  assert.equal(isAcceptedType("image", "video/mp4"), false);
  assert.equal(isAcceptedType("image", ""), false);
});

test("media takes both", () => {
  assert.equal(isAcceptedType("media", "image/png"), true);
  assert.equal(isAcceptedType("media", "video/webm"), true);
  assert.equal(isAcceptedType("media", "application/pdf"), false);
});

test("the empty tile says 'No video' only for video-only fields", () => {
  assert.equal(emptyStateKey("video"), "media.emptyVideo");
  assert.equal(emptyStateKey("image"), "media.empty");
  assert.equal(emptyStateKey("media"), "media.empty");
});

// ── S6: the guests-pitch `animated` field ────────────────────────────────────

test("animated takes photos, animated WebP, MP4/WebM and both Lottie formats", () => {
  for (const ok of ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm"]) {
    assert.equal(isAcceptedType("animated", ok), true, ok);
  }
  assert.equal(isAcceptedType("animated", pickedFileType({ name: "anim.json", type: "application/json" })), true);
  assert.equal(isAcceptedType("animated", pickedFileType({ name: "hero.lottie", type: "" })), true);
  for (const no of ["image/gif", "video/quicktime", "application/pdf", "image/svg+xml", "application/zip", ""]) {
    assert.equal(isAcceptedType("animated", no), false, no);
  }
  // The dialog must offer `.lottie` by extension (it has no type the OS knows).
  assert.match(acceptAttribute("animated"), /\.lottie/);
});

test("image and video fields still refuse Lottie (and image refuses video)", () => {
  const lottie = pickedFileType({ name: "hero.lottie", type: "" });
  const json = pickedFileType({ name: "anim.json", type: "application/json" });
  for (const accept of ["image", "video", "media"] as const) {
    assert.equal(isAcceptedType(accept, lottie), false, accept);
    assert.equal(isAcceptedType(accept, json), false, accept);
  }
  assert.equal(isAcceptedType("image", "video/webm"), false);
  assert.equal(acceptAttribute("image").includes(".lottie"), false);
});

test("picked-file type: Lottie by extension, everything else as reported", () => {
  assert.equal(pickedFileType({ name: "hero.lottie", type: "" }), DOTLOTTIE_MIME);
  assert.equal(pickedFileType({ name: "Hero.LOTTIE", type: "application/zip" }), DOTLOTTIE_MIME);
  assert.equal(pickedFileType({ name: "anim.json", type: "" }), LOTTIE_JSON_MIME);
  assert.equal(pickedFileType({ name: "photo.webp", type: "image/webp" }), "image/webp");
  assert.equal(pickedFileType({ name: "clip.mov", type: "video/quicktime" }), "video/quicktime");
});

test("non-image previews are labelled Lottie or Video", () => {
  assert.equal(previewLabelKey(DOTLOTTIE_MIME), "media.lottie");
  assert.equal(previewLabelKey(LOTTIE_JSON_MIME), "media.lottie");
  assert.equal(previewLabelKey("video/mp4"), "media.video");
});
