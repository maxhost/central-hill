import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { applyDefaults, describe, type FieldNode } from "../admin/form-model";
import { guidesEditorDefaults } from "../admin/guides-defaults";
import { GUIDES_CARD_IDS, OTHER_CARD_ID, resolveEditorLayout } from "../admin/layout";
import { defaultGuides, guidesSchema } from "../schemas/guides";
import { translatablePathsByPage } from "../schemas";

function at(node: FieldNode, path: string[]): FieldNode {
  for (const key of path) {
    assert.ok(node.kind === "object", key);
    const field = node.fields.find((field) => field.key === key);
    assert.ok(field, key);
    node = field.node;
  }
  return node;
}

test("Guides layout has seven ordered cards, owns every root once and hosts OG only in SEO", () => {
  const layout = resolveEditorLayout("guides", Object.keys(guidesSchema.shape));
  assert.ok(layout);
  const cards = layout.filter((item) => item.kind === "card");
  assert.deepEqual(cards.map((card) => card.id), GUIDES_CARD_IDS);
  assert.deepEqual(cards.flatMap((card) => card.paths), Object.keys(guidesSchema.shape));
  assert.deepEqual(cards.filter((card) => card.hostsOgImage).map((card) => card.id), ["seo"]);
  assert.ok(cards.find((card) => card.id === "guide_aside")?.note);
  assert.ok(cards.find((card) => card.id === "catalogue")?.note);
  assert.equal(layout.some((item) => item.note?.link?.href === "/admin/guides"), false);
  const future = resolveEditorLayout("guides", ["future_section"]);
  assert.deepEqual(future?.map((card) => card.id), ["seo", OTHER_CARD_ID]);
});

test("Guides legacy and absent no-op saves retain aside and enabled filter; explicit false survives", () => {
  const tree = describe(guidesSchema);
  for (const [raw, exists] of [[undefined, false], [defaultGuides, true]] as const) {
    const prepared = guidesEditorDefaults(raw, exists);
    const saved = guidesSchema.parse(applyDefaults(tree, prepared.data));
    assert.deepEqual(saved.guide_aside, defaultGuides.guide_aside);
    assert.equal(saved.city_filter?.enabled, true);
    assert.equal(saved.hero?.headline, "");
    assert.equal(saved.catalogue?.headline, "");
  }
  const prepared = guidesEditorDefaults({ ...defaultGuides, city_filter: { enabled: false } }, true);
  assert.equal(guidesSchema.parse(applyDefaults(tree, prepared.data)).city_filter?.enabled, false);
});

test("Guides controls offer real formats, positive checkbox and nine optional neutral icons", () => {
  const tree = describe(guidesSchema);
  assert.deepEqual(at(tree, ["hero", "video_media_id"]), {
    kind: "media", accept: "video", hint: "Optional silent MP4/WebM, landscape 1920×1080, ideally under 15 MB.",
  });
  for (const path of [["hero", "poster_media_id"], ["guide_aside", "image_media_id"]]) {
    const node = at(tree, path);
    assert.ok(node.kind === "media");
    assert.equal(node.accept, "image");
  }
  assert.equal(at(tree, ["city_filter", "enabled"]).kind, "boolean");
  const icons = at(tree, ["catalogue", "template_icons"]);
  assert.ok(icons.kind === "object");
  assert.equal(icons.fields.length, 9);
  for (const field of icons.fields) assert.deepEqual(field.node, { kind: "icon", optional: true });
  const paths = translatablePathsByPage.guides;
  for (const path of ["catalogue.headline", "hero.headline", "guide_aside.title", "recommendations.beach_label"]) assert.ok(paths.includes(path), path);
  assert.equal(paths.some((path) => /enabled|icon_key|media_id/.test(path)), false);
});

test("Guides card titles and notes exist in all four admin languages", () => {
  const layout = resolveEditorLayout("guides", Object.keys(guidesSchema.shape));
  assert.ok(layout);
  for (const locale of ["en", "pt", "es", "fr"]) {
    const messages = JSON.parse(readFileSync(new URL(`../../../../messages/${locale}.json`, import.meta.url), "utf8"));
    for (const item of layout) {
      for (const path of [item.titleKey, item.note?.textKey].filter((key): key is string => Boolean(key))) {
        const value = path.split(".").reduce((node, key) => node?.[key], messages.pages);
        assert.equal(typeof value, "string", `${locale}:${path}`);
      }
    }
    assert.equal(typeof messages.pages.admin.guidesLabels.city_filter.enabled, "string");
    assert.equal(typeof messages.pages.admin.guidesHints.catalogue.headline, "string");
  }
});
