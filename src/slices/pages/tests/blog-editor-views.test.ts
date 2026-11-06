import test from "node:test";
import assert from "node:assert/strict";
import { blogDescriptor } from "../blog-content";
import { blogAdapter } from "../adapters/blog";
import { aboutDescriptor } from "../about-content";
import { editorViewSections, BLOG_ARTICLE_EDITOR_URL } from "../admin/editorial-views";
import { pageSections } from "../admin/home-contextual";
import { prepareTargetEnvelope, sharedEnvelope } from "../editorial-content";
import type { PageEnvelope } from "../editorial-types";

test("Blog listing and article editors expose disjoint fields without mutating complete snapshots", () => {
  const content = blogAdapter.defaultContent();
  content.hero!.headline = "Listing title";
  content.post_aside.title = "Article CTA";
  const original = structuredClone(content);
  const listing = editorViewSections(blogDescriptor, key => key, content, "page");
  const article = editorViewSections(blogDescriptor, key => key, content, "blog_article");
  assert.deepEqual(listing.map(section => section.id), ["hero", "journal", "newsletter", "seo"]);
  assert.deepEqual(article.map(section => section.id), ["post_aside"]);
  assert.equal(article[0]!.label, "article_sidebar");
  assert.deepEqual(article[0]!.bindings.map(binding => binding.id), ["post_aside.eyebrow", "post_aside.title", "post_aside.body", "post_aside.cta_label"]);
  assert.ok(article[0]!.selectAsGroup);
  assert.deepEqual(content, original);
  assert.equal(blogAdapter.draftSchema.safeParse(content).success, true);
  assert.equal(BLOG_ARTICLE_EDITOR_URL, "/admin/pages/blog/article-sidebar");
});

test("Article sidebar copy stays locale-owned while hidden listing content remains in the draft", () => {
  const source: PageEnvelope<"blog"> = { schemaVersion: 1, content: blogAdapter.defaultContent(), ogImageMediaId: null };
  source.content.hero!.headline = "Published listing";
  for (const locale of ["en", "es", "pt", "fr"]) {
    const target = structuredClone(source);
    target.content.post_aside.title = `Article CTA ${locale}`;
    target.content.newsletter!.title = `Newsletter ${locale}`;
    const prepared = prepareTargetEnvelope(source, target, blogDescriptor);
    assert.equal(prepared.content.post_aside.title, `Article CTA ${locale}`);
    assert.equal(prepared.content.newsletter!.title, `Newsletter ${locale}`);
    assert.equal(prepared.content.hero!.headline, "Published listing");
    assert.equal(sharedEnvelope(source, blogDescriptor), sharedEnvelope(prepared, blogDescriptor));
  }
});

test("Other Pages keep their established sections and preview policy", () => {
  for (const view of ["page", "blog_article"] as const)
    assert.deepEqual(editorViewSections(aboutDescriptor, key => key, {}, view), pageSections(aboutDescriptor, key => key, {}));
  assert.deepEqual(blogDescriptor.sectionPreviews, { post_aside: "shared_aside" });
});
