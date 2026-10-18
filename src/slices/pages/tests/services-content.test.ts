import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { translatablePaths } from "@core/validation/primitives";
import { defaultServices, servicesSchema } from "../schemas/services";
import { collectMediaIds, overlayTranslations } from "../server/overlay";
import { orMessage } from "../ui/or-message";
import { ServicesLoopMedia } from "../ui/components/services-loop-media";

const UUID = "11111111-1111-4111-8111-111111111111";

test("legacy and blank Services overrides retain locale messages", () => {
  assert.deepEqual(servicesSchema.parse(defaultServices), {});
  assert.equal(
    servicesSchema.safeParse({ hero: { headline: "", media_media_id: "" } })
      .success,
    true,
  );
  for (const locale of ["en", "pt", "es", "fr"]) {
    const messages = JSON.parse(
      readFileSync(
        new URL(`../../../../messages/${locale}.json`, import.meta.url),
        "utf8",
      ),
    ).services;
    for (const key of [
      "eyebrow",
      "title",
      "intro",
      "gridEyebrow",
      "gridTitle",
      "gridIntro",
      "howEyebrow",
      "howTitle",
      "ctaEyebrow",
      "ctaTitle",
      "ctaIntro",
      "ctaButton",
      "ctaNote",
    ]) {
      assert.equal(typeof messages[key], "string", `${locale}: ${key}`);
      assert.equal(orMessage("  ", messages[key]), messages[key]);
      assert.equal(orMessage("Custom copy", messages[key]), "Custom copy");
    }
  }
});

test("three Services steps stay fixed and media references are UUIDs", () => {
  const item = { icon_key: "", title: "", body: "" };
  assert.equal(
    servicesSchema.safeParse({ how_it_works: { items: [item, item, item] } })
      .success,
    true,
  );
  for (const items of [[item], [item, item], [item, item, item, item]]) {
    assert.equal(
      servicesSchema.safeParse({ how_it_works: { items } }).success,
      false,
    );
  }
  assert.equal(
    servicesSchema.safeParse({ hero: { media_media_id: "unfinished-upload" } })
      .success,
    false,
  );
  const data = servicesSchema.parse({
    hero: { media_media_id: UUID, poster_media_id: UUID },
  });
  const ids: string[] = [];
  collectMediaIds(data, ids);
  assert.deepEqual(ids, [UUID, UUID]);
});

test("Services copy and informative alt are translated; media and icons remain references", () => {
  const paths = translatablePaths(servicesSchema);
  for (const path of [
    "hero.headline",
    "intro.body",
    "how_it_works.items[].title",
    "final_cta.media_alt",
    "final_cta.contact_note",
    "final_cta.cta_label",
  ]) {
    assert.ok(paths.includes(path), path);
  }
  assert.ok(
    !paths.some(
      (path) => path.endsWith("icon_key") || path.endsWith("media_id"),
    ),
  );
  const source = {
    final_cta: {
      headline: "Source",
      media_alt: "Source alt",
      media_media_id: UUID,
    },
  };
  const result = overlayTranslations(source, paths, (key) =>
    key === "final_cta.headline" ? "Translated" : undefined,
  );
  assert.equal(
    (result.final_cta as typeof source.final_cta).headline,
    "Translated",
  );
  assert.equal(
    (result.final_cta as typeof source.final_cta).media_alt,
    "Source alt",
  );
  assert.equal(
    (result.final_cta as typeof source.final_cta).media_media_id,
    UUID,
  );
});

test("video initially renders its real poster without starting playback before motion preference is known", () => {
  const html = renderToStaticMarkup(
    createElement(ServicesLoopMedia, {
      src: "/loop.mp4",
      poster: "/still.jpg",
    }),
  );
  assert.match(html, /poster="\/still.jpg"/);
  assert.match(html, /muted=""/);
  assert.match(html, /loop=""/);
  assert.match(html, /playsInline=""/);
  assert.match(html, /aria-hidden="true"/);
  assert.doesNotMatch(html, /src=|autoPlay=/);
});
