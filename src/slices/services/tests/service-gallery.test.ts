import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import type { MediaImageData } from "@core/media";
import { MosaicGallery } from "@core/ui/mosaic-gallery";
import { serviceGalleryView, SERVICE_MOSAIC_MAX } from "../ui/service-gallery";

const photo = (n: number): MediaImageData => ({
  url: `/photos/${n}.jpg`, width: 1200, height: 800, alt: `Photo ${n}`, blurhash: null,
});

test("services with zero to four photos show only available photos, without stock or repeated images", () => {
  assert.equal(SERVICE_MOSAIC_MAX, 4);
  for (let count = 0; count <= 4; count++) {
    const photos = Array.from({ length: count }, (_, n) => photo(n));
    const result = serviceGalleryView(photos[0] ?? null, photos.slice(1));
    assert.deepEqual(result.visible, photos);
    assert.deepEqual(result.photos, photos);
    assert.equal(result.showAll, false);
  }
  assert.deepEqual(serviceGalleryView(null, [photo(1)]).visible, [photo(1)]);
});

test("the cover and first three ordered gallery photos form the mosaic; extras stay in Show all photos", () => {
  const cover = photo(0);
  const gallery = [photo(1), photo(2), photo(3), photo(4), photo(5)];
  const before = structuredClone(gallery);
  const result = serviceGalleryView(cover, gallery);
  assert.deepEqual(result.visible, [cover, ...gallery.slice(0, 3)]);
  assert.deepEqual(result.photos, [cover, ...gallery]);
  assert.equal(result.showAll, true);
  assert.deepEqual(gallery, before, "selection never mutates saved gallery data");
  const reordered = serviceGalleryView(cover, [...gallery].reverse());
  assert.equal(reordered.visible[1]?.url, photo(5).url);
});

test("four service photos select the existing large-left/wide-top-right/two-lower layout", () => {
  const selected = serviceGalleryView(photo(0), [photo(1), photo(2), photo(3), photo(4)]);
  const html = renderToStaticMarkup(createElement(MosaicGallery, {
    adaptive: true,
    images: selected.visible.map((image) => createElement("img", { key: image.url, src: image.url, alt: image.alt })),
    overlay: selected.showAll ? createElement("button", {}, "Show all photos") : undefined,
  }));
  assert.equal((html.match(/<img\b/g) ?? []).length, 4);
  assert.ok(html.includes("grid-cols-[2fr_1fr_1fr]"));
  assert.ok(html.includes("[&amp;&gt;:nth-child(2)]:col-[2/4]"));
  assert.ok(html.includes("Show all photos"));
  assert.ok(!html.includes('src="/photos/4.jpg"'));
});

test("BO mosaic guidance names all four positions and extra-photo behavior in every locale", () => {
  for (const locale of ["en", "es", "pt", "fr"]) {
    const messages = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
    for (const key of ["mosaicHint", "mosaicCover", "mosaicGallery", "mosaicGalleryHint", ...[1, 2, 3, 4].map((i) => `mosaicPosition${i}`)])
      assert.equal(typeof messages.services.admin.fields[key], "string", `${locale}: ${key}`);
  }
});
