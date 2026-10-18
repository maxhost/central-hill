import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { translatablePaths } from "@core/validation/primitives";
import { defaultGuides, guidesSchema } from "../schemas/guides";
import { overlayTranslations, collectMediaIds } from "../server/overlay";
import { orMessage } from "../ui/or-message";
import { ServicesLoopMedia } from "../ui/components/services-loop-media";
const UUID = "11111111-1111-4111-8111-111111111111";

test("existing shared aside survives index overrides and absent index remains valid", () => {
  assert.deepEqual(guidesSchema.parse(defaultGuides), defaultGuides);
  const content = guidesSchema.parse({ ...defaultGuides, hero: { headline: "Edited" }, city_filter: { enabled: false } });
  assert.deepEqual(content.guide_aside, defaultGuides.guide_aside);
  assert.equal(content.city_filter?.enabled, false);
});

test("visitor-locale messages provide every public blank-copy fallback", () => {
  for (const locale of ["en", "pt", "es", "fr"]) {
    const t = JSON.parse(readFileSync(new URL(`../../../../messages/${locale}.json`, import.meta.url), "utf8")).guides;
    for (const key of ["eyebrow", "title", "intro", "chooseCity", "cityNote", "citySoon", "citiesEyebrow", "guidesIn", "viewGuide", "empty", "recEyebrow", "recTitle", "recIntro", "ctaEyebrow", "ctaTitle", "ctaBody", "ctaButton"]) {
      assert.equal(typeof t[key], "string", `${locale}: ${key}`);
      assert.equal(orMessage("  ", t[key]), t[key]);
    }
  }
});

test("editorial copy translates while filtering, icon and media identity remain neutral", () => {
  const paths = translatablePaths(guidesSchema);
  for (const path of ["hero.headline", "catalogue.headline", "catalogue.view_label", "city_filter.soon_label", "recommendations.beach_label", "final_cta.cta_label", "guide_aside.title"]) assert.ok(paths.includes(path), path);
  assert.ok(!paths.some((path) => /enabled|icon_key|media_id/.test(path)));
  const content = { hero: { headline: "Source", video_media_id: UUID }, city_filter: { enabled: false, location_icon_key: "map-pin" } };
  const translated = overlayTranslations(content, paths, (path) => path === "hero.headline" ? "Translated" : undefined);
  assert.deepEqual(translated, { ...content, hero: { ...content.hero, headline: "Translated" } });
});

test("hero's two media references stay independently collected and cannot accept unfinished IDs", () => {
  const content = guidesSchema.parse({ ...defaultGuides, hero: { video_media_id: UUID, poster_media_id: UUID } });
  const ids: string[] = [];
  collectMediaIds(content, ids);
  assert.deepEqual(ids, [UUID, UUID]);
  assert.equal(guidesSchema.safeParse({ ...defaultGuides, hero: { video_media_id: "unfinished" } }).success, false);
});

test("the reused hero video emits a real poster and no source before motion preference is known", () => {
  const html = renderToStaticMarkup(createElement(ServicesLoopMedia, { src: "/guides-video.webm", poster: "/guides-still.jpg", eager: true }));
  assert.match(html, /poster="\/guides-still.jpg"/);
  assert.match(html, /muted=""/);
  assert.match(html, /playsInline=""/);
  assert.match(html, /preload="none"/);
  assert.doesNotMatch(html, /src=|autoPlay=/);
});
