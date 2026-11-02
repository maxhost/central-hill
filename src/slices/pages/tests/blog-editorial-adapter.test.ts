import test from "node:test";
import assert from "node:assert/strict";
import {
  blogAsideCta,
  blogDescriptor,
  blogLocalizedContent,
  blogSourceContent,
  blogSourceFields,
} from "../blog-content";
import { blogAdapter } from "../adapters/blog";
import { defaultBlog } from "../schemas/blog";
import { captureLegacyPending, prepareTargetEnvelope } from "../editorial-content";
import type { PageEnvelope } from "../editorial-types";
import { descriptorMediaIds, isEditableFieldPath } from "../admin/home-contextual";
import { validatePageLivePreview } from "../admin/live-preview-validation";
import { blogSchema } from "../schemas/blog";

test("Blog keeps blank inherited overrides and suppresses stale published targets while preserving pending copy", () => {
  const content = blogAdapter.defaultContent();
  assert.equal(blogAdapter.publishSchema.safeParse(content).success, true);
  assert.equal(content.hero?.headline, "");
  assert.equal(content.newsletter?.title, "");
  assert.deepEqual(content.post_aside, defaultBlog.post_aside);
  assert.deepEqual(blogSourceContent(undefined), defaultBlog);
  const source = blogAdapter.normalize({ ...defaultBlog, hero: { headline: "", intro: "Source intro" } });
  const oldTarget = { ...source, hero: { ...source.hero, headline: "Titular antiguo", intro: "Introducción" } };
  const localized = blogLocalizedContent(source, oldTarget);
  assert.equal(localized.hero?.headline, "", "Cleared EN never revives a stale public override");
  assert.equal(localized.hero?.intro, "Introducción");
  assert.equal(blogSourceFields(source)["block:hero.headline"], undefined);
  const published: PageEnvelope<"blog"> = { schemaVersion: 1, content: localized, ogImageMediaId: null };
  const pending = captureLegacyPending(published, [{ field: "block:hero.headline", value: "Borrador pendiente" }], blogDescriptor);
  assert.equal(pending?.content.hero?.headline, "Borrador pendiente");
  assert.equal(published.content.hero?.headline, "");
  const target = structuredClone(published);
  target.content.seo = { meta_title: "SEO español", meta_description: "" };
  const prepared = prepareTargetEnvelope(published, target, blogDescriptor);
  assert.equal(prepared.content.seo?.meta_title, "SEO español", "Adopted target JSON may author SEO independently of empty EN");
});

test("Blog shares article copy and preserves a post button with image-only media and layout publication", () => {
  const content = blogAdapter.defaultContent();
  content.post_aside.title = "Shared title";
  content.newsletter!.title = "Shared newsletter";
  const globalAside = blogAsideCta(content, "es");
  assert.equal(globalAside.title, "Shared title");
  assert.deepEqual(globalAside.cta, { label: content.post_aside.cta_label, href: "/es/owners" });
  const own = blogAsideCta(content, "es", { label: "Post action", url: "https://example.test/post" });
  assert.deepEqual(own, { ...globalAside, cta: { label: "Post action", href: "https://example.test/post" } });
  assert.equal(content.newsletter!.title, "Shared newsletter");
  assert.equal(blogAdapter.publicationScope, "layout");
  assert.deepEqual(blogDescriptor.sectionPreviews, { post_aside: "shared_aside" });
  assert.deepEqual(blogDescriptor.listPaths, []);
  assert.deepEqual(blogDescriptor.mediaSlots, [{ path: "hero.image_media_id", kind: "image" }]);
  assert.equal(blogDescriptor.maxLocalMedia, 2);
  const og = "00000000-0000-4000-8000-000000000001";
  assert.deepEqual(blogAdapter.collectMediaReferences(content, og), [{ path: "og_image_media_id", id: og, kind: "image" }]);
  assert.deepEqual(blogAdapter.mediaErrors(content, og, new Map([[og, { mime: "image/png" }]])), {});
  assert.ok(blogAdapter.mediaErrors(content, og, new Map([[og, { mime: "video/mp4" }]])).og_image_media_id);
  assert.deepEqual(blogAdapter.collectMediaReferences(content, null), []);
});

test("Blog hero picker and all four text controls survive locale preparation with independent copy", () => {
  const content = blogAdapter.defaultContent();
  assert.equal(blogSchema.safeParse(defaultBlog).success, true, "Legacy snapshots need no image");
  assert.equal(content.hero?.image_media_id, "");
  const fields = ["headline", "intro", "search_placeholder", "search_label"] as const;
  for (const field of ["image_media_id", ...fields]) {
    assert.ok(isEditableFieldPath(blogDescriptor.rootNode, `hero.${field}`));
  }
  const imageId = "00000000-0000-4000-8000-000000000003";
  content.hero!.image_media_id = imageId;
  for (const field of fields) content.hero![field] = `EN ${field}`;
  const template: PageEnvelope<"blog"> = { schemaVersion: 1, content, ogImageMediaId: null };
  for (const locale of ["es", "pt", "fr"]) {
    const target = structuredClone(template);
    for (const field of fields) target.content.hero![field] = `${locale} ${field}`;
    target.content.hero!.image_media_id = "";
    const prepared = prepareTargetEnvelope(template, target, blogDescriptor);
    assert.equal(prepared.content.hero!.image_media_id, imageId);
    for (const field of fields) assert.equal(prepared.content.hero![field], `${locale} ${field}`);
    assert.equal(target.content.hero!.image_media_id, "", "Existing target is not mutated");
  }
  assert.equal(blogSourceFields(content)["block:hero.image_media_id"], undefined);
  assert.deepEqual(descriptorMediaIds(content, null, blogDescriptor), [imageId]);
  const origin = "http://localhost:3071";
  const ogId = "00000000-0000-4000-8000-000000000004";
  template.ogImageMediaId = ogId;
  const localMedia = Object.fromEntries([imageId, ogId].map(id => [id, {
    id, url: `blob:${origin}/${id}`, width: 1920, height: 1080, mime: "image/jpeg",
  }]));
  const payload = { envelope: template, localMedia };
  assert.ok(validatePageLivePreview("blog", payload, origin), "Both queued images work before upload");
  localMedia[imageId]!.mime = "video/mp4";
  assert.equal(validatePageLivePreview("blog", payload, origin), null);
});
