import assert from "node:assert/strict";
import { test } from "node:test";
import { blogEditorDefaults, blogInheritedValues } from "../admin/blog-defaults";
import { applyDefaults, describe } from "../admin/form-model";
import { BLOG_CARD_IDS, resolveEditorLayout } from "../admin/layout";
import { blogSourceFields } from "../blog-content";
import { blogSchema, defaultBlog } from "../schemas/blog";

test("Blog six cards cover every group exactly once and host social image with SEO", () => {
  const layout = resolveEditorLayout("blog", Object.keys(blogSchema.shape));
  assert.ok(layout);
  const cards = layout.filter(item => item.kind === "card");
  assert.deepEqual(cards.map(card => card.id), BLOG_CARD_IDS);
  assert.deepEqual(cards.flatMap(card => card.paths), Object.keys(blogSchema.shape));
  assert.deepEqual(cards.filter(card => card.hostsOgImage).map(card => card.id), ["seo"]);
  assert.ok(cards.some(card => card.note?.link?.href === "/admin/posts"));
});

test("Absent and legacy Blog retain aside while listing overrides remain blank through repeated save", () => {
  const node = describe(blogSchema);
  for (const exists of [false, true]) {
    const prepared = blogEditorDefaults(exists ? defaultBlog : undefined, exists);
    assert.equal(prepared.sourceInvalid, false);
    let saved = blogSchema.parse(applyDefaults(node, prepared.data));
    assert.deepEqual(saved.post_aside, defaultBlog.post_aside);
    assert.equal(saved.hero?.headline, "");
    assert.equal(saved.newsletter?.title, "");
    saved = blogSchema.parse(applyDefaults(node, blogEditorDefaults(saved, true).data));
    assert.deepEqual(blogSourceFields(saved), blogSourceFields(defaultBlog));
  }
});

test("Invalid persisted Blog is blocked, valid authored overrides and legacy aside are preserved", () => {
  assert.equal(blogEditorDefaults({ post_aside: {} }, true).sourceInvalid, true);
  const raw = { ...defaultBlog, hero: { headline: "A source headline" } };
  const prepared = blogEditorDefaults(raw, true);
  assert.deepEqual(prepared.data, blogSchema.parse(raw));
  const placeholders = blogInheritedValues(key => `EN:${key}`);
  assert.equal(placeholders["hero.headline"], "EN:title");
  assert.equal(placeholders["seo.meta_title"], "EN:metaTitle");
  assert.equal(placeholders["post_aside.title"], undefined);
  assert.deepEqual(prepared.data, blogSchema.parse(raw));
});
