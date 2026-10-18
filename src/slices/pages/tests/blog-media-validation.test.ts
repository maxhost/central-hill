import assert from "node:assert/strict";
import { test } from "node:test";
import { blogMediaErrors, blogMediaReferences } from "../admin/blog-media-validation";
const id = "5b9e5930-34db-436e-a2a1-b1655d8b6643";

test("Blog OG accepts supported images and an empty override", () => {
  assert.deepEqual(blogMediaReferences(null), []);
  assert.deepEqual(blogMediaErrors(null, new Map()), {});
  for (const mime of ["image/jpeg", "image/png", "image/webp"]) {
    assert.deepEqual(blogMediaErrors(id, new Map([[id, { mime }]])), {});
  }
});

test("Blog OG rejects video, missing references and malformed UUIDs", () => {
  for (const mime of ["video/mp4", "video/webm", "application/json"]) {
    assert.ok(blogMediaErrors(id, new Map([[id, { mime }]])).og_image_media_id);
  }
  assert.ok(blogMediaErrors(id, new Map()).og_image_media_id);
  assert.ok(blogMediaErrors("invalid", new Map([["invalid", { mime: "image/jpeg" }]])).og_image_media_id);
});
