import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_DETAIL } from "../detail";
import { serviceMediaErrors } from "../admin/service-media-validation";
test("cover, OG, gallery and hidden itinerary refs must resolve to actual images", () => {
  const input = {
    cover_media_id: "cover",
    og_image_media_id: "og",
    gallery: ["missing"],
    detail: {
      ...EMPTY_DETAIL,
      itinerary: [
        { time: "1", title: "Step", text: "Visit", media_id: "step" },
      ],
    },
  };
  const assets = new Map([
    ["cover", { mime: "image/jpeg" }],
    ["og", { mime: "video/mp4" }],
    ["step", { mime: "application/pdf" }],
  ]);
  const errors = serviceMediaErrors(input, assets);
  assert.equal(errors.cover_media_id, undefined);
  assert.ok(errors.og_image_media_id);
  assert.ok(errors["gallery.0"]);
  assert.ok(errors["detail.itinerary.0.media_id"]);
});
