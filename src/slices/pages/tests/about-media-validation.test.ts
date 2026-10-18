import { test } from "node:test";
import assert from "node:assert/strict";
import { aboutMediaErrors } from "../admin/about-media-validation";
import { defaultAbout } from "../schemas/about";
const id = "5b9e5930-34db-436e-a2a1-b1655d8b6643";
test("mixed slots accept supported media; image slots and OG reject video/missing assets", () => {
  for (const section of ["story", "organisation", "community"] as const) for (const mime of ["image/webp", "video/mp4", "video/webm", "application/json", "application/zip+dotlottie"]) {
    const c = structuredClone(defaultAbout); c[section].image_media_id = id;
    assert.deepEqual(aboutMediaErrors(c, null, new Map([[id, { mime }]])), {});
    assert.ok(aboutMediaErrors(c, null, new Map())[`${section}.image_media_id`]);
  }
  const c = structuredClone(defaultAbout); c.hero.image_media_id = id;
  assert.ok(aboutMediaErrors(c, id, new Map([[id, { mime: "video/mp4" }]])).og_image_media_id);
  assert.ok(aboutMediaErrors(c, null, new Map([[id, { mime: "video/mp4" }]]))["hero.image_media_id"]);
});
