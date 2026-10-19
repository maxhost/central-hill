import assert from "node:assert/strict";
import test from "node:test";
import { guidesAdapter } from "../adapters/guides";
import {
  guidesDescriptor,
  normalizeGuides,
  guidesAsideCta,
} from "../guides-content";
import { defaultGuides, guidesSchema } from "../schemas/guides";
import {
  guidesSourceContent,
  guidesLocalizedContent,
} from "../server/guides-content";
import { guidesEditorDefaults } from "../admin/guides-defaults";
import { descriptorMediaIds, pageSections } from "../admin/home-contextual";
import { captureLegacyPending, sharedEnvelope } from "../editorial-content";
import type { PageEnvelope } from "../editorial-types";

test("Guides keeps saved source blocks, validates translated {city} leaves and defaults the omitted filter to enabled", () => {
  const source = guidesSourceContent({
    ...defaultGuides,
    hero: { headline: "Saved hero" },
    catalogue: { headline: "Explore {city}", view_label: "Open guide" },
    final_cta: { headline: 42 },
  });
  assert.equal(source.hero?.headline, "Saved hero");
  assert.equal(
    source.final_cta,
    undefined,
    "Invalid source blocks retain the existing salvage policy",
  );
  assert.deepEqual(source.guide_aside, defaultGuides.guide_aside);
  assert.equal(
    guidesEditorDefaults(
      { ...defaultGuides, catalogue: { headline: "Explore {country}" } },
      true,
    ).sourceInvalid,
    true,
  );
  assert.equal(guidesEditorDefaults(undefined, false).sourceInvalid, false);
  const localized = guidesLocalizedContent(source, {
    ...source,
    hero: { headline: "Guías guardadas" },
    catalogue: { headline: "Explora {country}", view_label: "Ver guía" },
  });
  assert.equal(localized.catalogue?.headline, "Explore {city}");
  assert.equal(localized.catalogue?.view_label, "Ver guía");
  assert.equal(localized.hero?.headline, "Guías guardadas");
  assert.equal(
    guidesLocalizedContent(source, {
      ...source,
      catalogue: { headline: "Explora {city}" },
    }).catalogue?.headline,
    "Explora {city}",
  );
  const content = normalizeGuides(localized);
  assert.equal(content.city_filter?.enabled, true);
  assert.equal(
    content.city_filter?.label,
    "",
    "Visitor-locale fallback remains an empty override",
  );
  assert.ok(guidesAdapter.publishSchema.safeParse(content).success);
  assert.equal(
    guidesAdapter.publishSchema.safeParse({
      ...content,
      catalogue: { headline: "No city token" },
    }).success,
    false,
  );
  content.city_filter = {
    ...content.city_filter,
    enabled: false,
    note: "Keep this note",
  };
  const collapsed = pageSections(guidesDescriptor, (key) => key, content).find(
    (section) => section.id === "city_filter",
  )!;
  assert.deepEqual(
    collapsed.bindings.map((binding) => binding.id),
    ["city_filter.enabled"],
  );
  content.city_filter.enabled = true;
  assert.ok(
    pageSections(guidesDescriptor, (key) => key, content)
      .find((section) => section.id === "city_filter")!
      .bindings.some((binding) => binding.id === "city_filter.note"),
  );
  assert.equal(content.city_filter.note, "Keep this note");
  assert.equal(
    normalizeGuides({ ...localized, city_filter: { enabled: false } })
      .city_filter?.enabled,
    false,
  );
});

test("Guides shared aside resolves the complete local snapshot, four media refs and layout publication without capturing catalogue entities", () => {
  const ids = [
    "11111111-1111-4111-8111-111111111110",
    "11111111-1111-4111-8111-111111111111",
    "11111111-1111-4111-8111-111111111112",
    "11111111-1111-4111-8111-111111111113",
  ];
  const content = normalizeGuides(
    guidesSchema.parse({
      ...defaultGuides,
      hero: { video_media_id: ids[0], poster_media_id: ids[1] },
      guide_aside: { ...defaultGuides.guide_aside, image_media_id: ids[2] },
      guides: [{ id: "catalogue-is-owned-by-guides" }],
    }),
  );
  assert.ok(!("guides" in content));
  assert.deepEqual(guidesDescriptor.listPaths, []);
  assert.equal(guidesAdapter.publicationScope, "layout");
  assert.deepEqual(guidesDescriptor.sectionPreviews, {
    guide_aside: "shared_aside",
  });
  assert.equal(guidesDescriptor.maxLocalMedia, 4);
  const image = {
    url: "/qa-apartment.jpg",
    alt: "QA apartment",
    width: 760,
    height: 475,
    blurhash: null,
  };
  const published: PageEnvelope<"guides"> = {
    schemaVersion: 1,
    content,
    ogImageMediaId: ids[3]!,
  };
  const draft = captureLegacyPending(
    published,
    [{ field: "block:guide_aside.title", value: "Base privada" }],
    guidesDescriptor,
  )!;
  const aside = guidesAsideCta(
    { content: draft.content, media: { [ids[2]!]: image }, ogImage: null },
    "es",
  );
  assert.equal(aside.title, "Base privada");
  assert.equal(aside.cta.href, "/es/buildings");
  assert.deepEqual(aside.image, image);
  assert.equal(
    published.content.guide_aside.title,
    defaultGuides.guide_aside.title,
  );
  assert.equal(
    sharedEnvelope(published, guidesDescriptor),
    sharedEnvelope(draft, guidesDescriptor),
    "Aside copy remains locale-owned; media/structure stay shared",
  );
  assert.deepEqual(
    new Set(descriptorMediaIds(content, ids[3]!, guidesDescriptor)),
    new Set(ids),
  );
  assert.equal(
    guidesAdapter.collectMediaReferences(content, ids[3]!).length,
    4,
  );
  const assets = new Map([
    [ids[0]!, { mime: "video/mp4" }],
    [ids[1]!, { mime: "image/webp" }],
    [ids[2]!, { mime: "image/jpeg" }],
    [ids[3]!, { mime: "image/png" }],
  ]);
  assert.deepEqual(guidesAdapter.mediaErrors(content, ids[3]!, assets), {});
  assets.set(ids[1]!, { mime: "video/mp4" });
  assert.deepEqual(
    Object.keys(guidesAdapter.mediaErrors(content, ids[3]!, assets)),
    ["hero.poster_media_id"],
  );
});
