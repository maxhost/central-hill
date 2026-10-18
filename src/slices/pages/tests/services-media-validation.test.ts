import assert from "node:assert/strict";
import { test } from "node:test";
import { servicesMediaErrors } from "../admin/services-media-validation";
const id = "11111111-1111-4111-8111-111111111111";
test("Services rejects missing assets and forged video OG/poster references", () => {
 const video = new Map([[id,{mime:"video/mp4"}]]);
 assert.deepEqual(servicesMediaErrors({hero:{media_media_id:id}},null,video),{});
 assert.ok(servicesMediaErrors({},id,video).og_image_media_id);
 assert.ok(servicesMediaErrors({hero:{poster_media_id:id}},null,video)["hero.poster_media_id"]);
 assert.ok(servicesMediaErrors({final_cta:{media_media_id:id}},null,new Map())["final_cta.media_media_id"]);
 assert.ok(servicesMediaErrors({},"invalid",new Map()).og_image_media_id);
});
test("Services accepts images for OG/posters and animation in either visual slot", () => {
 for (const mime of ["image/jpeg","image/png","image/avif","image/webp"]) {
  const assets = new Map([[id,{mime}]]);
  assert.deepEqual(servicesMediaErrors({hero:{poster_media_id:id},final_cta:{media_media_id:id}},id,assets),{});
 }
 assert.ok(servicesMediaErrors({hero:{media_media_id:id}},null,new Map([[id,{mime:"application/pdf"}]]))["hero.media_media_id"]);
});
