import assert from "node:assert/strict";
import { test } from "node:test";
import { guidesMediaErrors, guidesMediaReferences } from "../admin/guides-media-validation";
import { defaultGuides } from "../schemas/guides";
const id = "11111111-1111-4111-8111-111111111111";
const videoId = "22222222-2222-4222-8222-222222222222";
const content = {
  ...defaultGuides,
  hero: { video_media_id: videoId, poster_media_id: id },
  guide_aside: { ...defaultGuides.guide_aside, image_media_id: id },
};

test("Guides guard validates all four surfaces and accepts separate real video and image assets", () => {
  assert.deepEqual(guidesMediaReferences(defaultGuides, null), []);
  assert.deepEqual(guidesMediaReferences(content, id).map((ref) => ref.path), [
    "og_image_media_id", "hero.video_media_id", "hero.poster_media_id", "guide_aside.image_media_id",
  ]);
  for (const imageMime of ["image/jpeg", "image/png", "image/webp", "image/avif"]) {
    for (const videoMime of ["video/mp4", "video/webm"]) {
      assert.deepEqual(guidesMediaErrors(content, id, new Map([[id, { mime: imageMime }], [videoId, { mime: videoMime }]])), {});
    }
  }
});

test("Guides guard rejects missing, invalid and wrong-MIME references before persistence", () => {
  assert.equal(Object.keys(guidesMediaErrors(content, id, new Map())).length, 4);
  assert.ok(guidesMediaErrors(defaultGuides, "not-a-uuid", new Map([["not-a-uuid", { mime: "image/jpeg" }]])).og_image_media_id);
  for (const mime of ["video/mp4", "application/pdf", "application/json"]) {
    const errors = guidesMediaErrors(content, id, new Map([[id, { mime }], [videoId, { mime: "video/mp4" }]]));
    for (const path of ["og_image_media_id", "hero.poster_media_id", "guide_aside.image_media_id"]) assert.ok(errors[path], `${mime}:${path}`);
  }
  for (const mime of ["image/jpeg", "application/pdf", "application/json"]) {
    assert.ok(guidesMediaErrors(content, id, new Map([[id, { mime: "image/jpeg" }], [videoId, { mime }]]))["hero.video_media_id"]);
  }
});
