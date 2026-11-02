import assert from "node:assert/strict";
import { test } from "node:test";
import { blogMediaErrors, blogMediaReferences } from "../admin/blog-media-validation";
import { defaultBlog } from "../schemas/blog";
const id = "5b9e5930-34db-436e-a2a1-b1655d8b6643";

test("Blog OG accepts supported images and an empty override", () => {
  assert.deepEqual(blogMediaReferences(defaultBlog, null), []);
  assert.deepEqual(blogMediaErrors(defaultBlog, null, new Map()), {});
  for (const mime of ["image/jpeg", "image/png", "image/webp"]) {
    assert.deepEqual(blogMediaErrors(defaultBlog, id, new Map([[id, { mime }]])), {});
  }
});

test("Blog OG rejects video, missing references and malformed UUIDs", () => {
  for (const mime of ["video/mp4", "video/webm", "application/json"]) {
    assert.ok(blogMediaErrors(defaultBlog, id, new Map([[id, { mime }]])).og_image_media_id);
  }
  assert.ok(blogMediaErrors(defaultBlog, id, new Map()).og_image_media_id);
  assert.ok(blogMediaErrors(defaultBlog, "invalid", new Map([["invalid", { mime: "image/jpeg" }]])).og_image_media_id);
});

test("Blog hero and OG are independent image references with field-specific validation", () => {
  const og = "00000000-0000-4000-8000-000000000002";
  const content = { ...defaultBlog, hero: { image_media_id: id } };
  assert.deepEqual(blogMediaReferences(content, og), [
    { path: "og_image_media_id", id: og, kind: "image" },
    { path: "hero.image_media_id", id, kind: "image" },
  ]);
  const assets = new Map([[og, { mime: "image/png" }], [id, { mime: "image/avif" }]]);
  assert.deepEqual(blogMediaErrors(content, og, assets), {});
  for (const mime of ["video/mp4", "application/pdf", "image/svg+xml"]) {
    assets.set(id, { mime });
    assert.deepEqual(Object.keys(blogMediaErrors(content, og, assets)), ["hero.image_media_id"]);
  }
  assets.delete(id);
  assert.deepEqual(Object.keys(blogMediaErrors(content, og, assets)), ["hero.image_media_id"]);
  assert.ok(blogMediaErrors({ ...content, hero: { image_media_id: "invalid" } }, null, new Map([["invalid", { mime: "image/jpeg" }]]))["hero.image_media_id"]);
});
