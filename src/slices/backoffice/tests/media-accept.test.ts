import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptAttribute, emptyStateKey, isAcceptedType } from "../ui/media-accept";

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
