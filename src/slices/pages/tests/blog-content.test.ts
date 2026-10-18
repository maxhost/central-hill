import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { BLOG_FALLBACK_KEYS, blogLocalizedContent, blogSourceContent, blogSourceFields } from "../blog-content";
import { blogSchema, defaultBlog } from "../schemas/blog";
import { seoMetadataInput } from "../server/metadata-input";

test("legacy Blog aside survives new optional groups and missing rows retain defaults", () => {
  assert.deepEqual(blogSchema.parse(defaultBlog), defaultBlog);
  assert.deepEqual(blogSourceContent(undefined), defaultBlog);
  const legacy = { post_aside: { ...defaultBlog.post_aside, title: "Existing source" } };
  assert.deepEqual(blogSourceContent(legacy), legacy);
  assert.deepEqual(blogSourceFields(legacy)["block:post_aside.title"], "Existing source");
});

test("all screenshot copy and SEO have translation paths and four-locale defaults", () => {
  const paths = translatablePaths(blogSchema);
  for (const path of Object.keys(BLOG_FALLBACK_KEYS)) assert.ok(paths.includes(path), path);
  for (const locale of ["en", "pt", "es", "fr"]) {
    const messages = JSON.parse(readFileSync(new URL(`../../../../messages/${locale}.json`, import.meta.url), "utf8")).blog;
    for (const key of Object.values(BLOG_FALLBACK_KEYS)) {
      let value = messages;
      for (const segment of key.split(".")) value = value[segment];
      assert.equal(typeof value, "string", `${locale}:${key}`);
      assert.ok(value.trim(), `${locale}:${key}`);
    }
  }
  assert.ok(!paths.some(path => path.includes("media_id")));
});

test("only authored text creates source rows; cleared overrides cannot revive stale targets", () => {
  const source = blogSchema.parse({ ...defaultBlog, hero: { headline: "Source headline", intro: "  " }, journal: { title: "" } });
  const fields = blogSourceFields(source);
  assert.equal(fields["block:hero.headline"], "Source headline");
  assert.equal(fields["block:hero.intro"], undefined);
  assert.equal(fields["block:journal.title"], undefined);
  const target = { ...source, hero: { headline: "Titular aprobado", intro: "Stale intro" }, journal: { title: "Stale journal" } };
  const localized = blogLocalizedContent(source, target);
  assert.equal(localized.hero?.headline, "Titular aprobado");
  assert.equal(localized.hero?.intro, "  ");
  assert.equal(localized.journal?.title, "");
  assert.equal(source.hero?.headline, "Source headline");
  assert.equal(blogLocalizedContent(source, { ...source, hero: { headline: "" } }).hero?.headline, "Source headline");
});

test("Blog SEO overrides, OG and canonical/alternates resolve for every locale", () => {
  const image = { url: "https://example.test/social.jpg", width: 1200, height: 630, alt: "Social", blurhash: null };
  for (const locale of ["en", "pt", "es", "fr"] as const) {
    const input = seoMetadataInput({ locale, path: "/blog", seo: { meta_title: "Edited SEO", meta_description: " " }, ogImage: image, fallbackTitle: "Default", fallbackDescription: "Localized description" });
    assert.equal(input.title, "Edited SEO");
    assert.equal(input.description, "Localized description");
    assert.equal(input.canonicalPath, `/${locale}/blog`);
    assert.deepEqual(input.languages, { "x-default": "/blog", en: "/en/blog", pt: "/pt/blog", es: "/es/blog", fr: "/fr/blog" });
    assert.deepEqual(input.images, [{ url: image.url, width: 1200, height: 630, alt: "Social" }]);
  }
});
