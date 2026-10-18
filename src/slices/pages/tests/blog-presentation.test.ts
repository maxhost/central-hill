import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import { createTranslator } from "next-intl";
import ts from "typescript";
import type { BlogContent } from "../schemas/blog";
import { defaultBlog } from "../schemas/blog";

type Node = { type?: unknown; props?: Record<string, unknown> };
const post = (id: string) => ({ id, slug: id, title: id, excerpt: "Excerpt", category: { slug: "news", name: "News" }, author: { name: "Author" }, body: [], related: [], publishedAt: null });

/** Exercise the real async compositions without loading DB/server-only dependencies. */
function composition(file: "blog-listing" | "blog-post", locale: "en" | "pt" | "es" | "fr", content: BlogContent, posts = [post("featured"), post("journal")]) {
  const messages = JSON.parse(readFileSync(new URL(`../../../../messages/${locale}.json`, import.meta.url), "utf8"));
  const t = createTranslator({ locale, messages, namespace: "blog" });
  const calls: string[] = [];
  const components = (...names: string[]) => Object.fromEntries(names.map(name => [name, name]));
  const dependencies: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    "next-intl/server": { getTranslations: async () => t, setRequestLocale: () => {} },
    "next/navigation": { notFound: () => { throw new Error("Not found"); } },
    "@core/ui": components("PageHead", "PageHeadSearch", "SectionHead", "AsideCta", "DetailLayout", "DetailTitle", "MosaicGallery", "StickyAside", "TocList"),
    "@core/ui/icon": components("Icon"),
    "@core/media": components("MediaImage"),
    "@core/seo": { ...components("JsonLd"), blogPostingLd: () => ({}), breadcrumbLd: () => ({}) },
    "@slices/settings/contract": { getGlobals: async () => null, SITE_ICON_DEFAULTS: {} },
    "@slices/pages/contract": {
      getBlogPage: async (requested: string) => { calls.push(requested); return { content, media: {}, ogImage: null }; },
      getBlogAsideCta: async () => ({ title: "Existing aside", cta: { label: "Owners", href: `/${locale}/owners` } }),
    },
    "../contract": { listCategories: async () => [], getFeaturedPost: async () => posts[0] ?? null, listPosts: async () => posts, getPostBySlug: async () => posts[0] },
    "./components/category-tabs": components("CategoryFilterItem", "CategoryFilterProvider", "CategoryLoadMore", "CategoryTabs"),
    "./components/featured-post": components("FeaturedPost"),
    "./components/journal-card": components("JournalCard"),
    "./components/newsletter-signup": components("NewsletterSignup"),
    "./components/body-renderer": components("BodyRenderer"),
    "./components/headings": { headingIds: () => [], tocItems: () => [] },
  };
  const compiled = { exports: {} };
  const source = ts.transpileModule(readFileSync(new URL(`../../blog/ui/${file}.tsx`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(source, { module: compiled, exports: compiled.exports, Intl, require: (name: string) => {
    assert.ok(name in dependencies, `Unexpected presentation dependency ${name}`);
    return dependencies[name];
  } });
  const component = Object.values(compiled.exports)[0] as (props: { locale: string; slug: string }) => Promise<Node>;
  return { render: () => component({ locale, slug: "featured" }), t, calls };
}

function elements(node: unknown, type: string): Record<string, unknown>[] {
  if (Array.isArray(node)) return node.flatMap(child => elements(child, type));
  if (!node || typeof node !== "object") return [];
  const element = node as Node;
  if (!element.props) return [];
  return [...(element.type === type ? [element.props] : []), ...elements(element.props.children, type)];
}

const authored: BlogContent = {
  ...defaultBlog,
  hero: { eyebrow: "Our journal", headline: "Edited headline", intro: "Edited intro", search_placeholder: "Find a story", search_label: "Search stories" },
  featured: { eyebrow: "Editor’s pick" },
  journal: { eyebrow: "Recent stories", title: "Edited journal" },
  newsletter: { eyebrow: "Updates", title: "Edited newsletter", description: "Edited subscription introduction" },
};

test("listing consumes all four editable sections without changing dynamic cards or pagination", async () => {
  const subject = composition("blog-listing", "es", authored);
  const tree = await subject.render();
  assert.deepEqual(subject.calls, ["es"]);
  assert.equal(elements(tree, "PageHead")[0]?.eyebrow, "Our journal");
  assert.equal(elements(tree, "PageHead")[0]?.headline, "Edited headline");
  assert.equal(elements(tree, "PageHead")[0]?.intro, "Edited intro");
  assert.equal(elements(tree, "PageHeadSearch")[0]?.placeholder, "Find a story");
  assert.equal(elements(tree, "PageHeadSearch")[0]?.label, "Search stories");
  assert.equal(elements(tree, "SectionHead")[0]?.eyebrow, "Editor’s pick");
  assert.equal(elements(tree, "SectionHead")[1]?.eyebrow, "Recent stories");
  assert.equal(elements(tree, "SectionHead")[1]?.headline, "Edited journal");
  assert.equal(elements(tree, "NewsletterSignup")[0]?.title, "Edited newsletter");
  assert.equal(elements(tree, "NewsletterSignup")[0]?.description, "Edited subscription introduction");
  assert.equal(elements(tree, "FeaturedPost").length, 1);
  assert.equal((elements(tree, "JournalCard")[0]?.post as { id: string }).id, "journal");
  assert.equal(elements(tree, "CategoryLoadMore")[0]?.total, 1);
  assert.equal(elements(tree, "CategoryFilterProvider")[0]?.pageSize, 9);
});

test("legacy and individually blank fields retain each visitor locale’s messages", async () => {
  for (const locale of ["en", "pt", "es", "fr"] as const) {
    const subject = composition("blog-listing", locale, { ...defaultBlog, hero: { headline: "  ", intro: " Source intro " }, newsletter: { title: " " } });
    const tree = await subject.render();
    assert.equal(elements(tree, "PageHead")[0]?.headline, subject.t("title"));
    assert.equal(elements(tree, "PageHead")[0]?.eyebrow, subject.t("eyebrow"));
    assert.equal(elements(tree, "PageHead")[0]?.intro, "Source intro");
    assert.equal(elements(tree, "PageHeadSearch")[0]?.placeholder, subject.t("searchPlaceholder"));
    assert.equal(elements(tree, "PageHeadSearch")[0]?.label, subject.t("searchLabel"));
    assert.equal(elements(tree, "SectionHead")[0]?.eyebrow, subject.t("featured"));
    assert.equal(elements(tree, "SectionHead")[1]?.headline, subject.t("latestTitle"));
    assert.equal(elements(tree, "NewsletterSignup")[0]?.title, subject.t("newsletter.title"));
  }
});

test("empty catalog still omits featured and journal headings", async () => {
  const tree = await composition("blog-listing", "en", authored, []).render();
  assert.equal(elements(tree, "SectionHead").length, 0);
  assert.equal(elements(tree, "NewsletterSignup").length, 1);
});

test("post shares all three newsletter fields while article title and aside stay independent", async () => {
  const subject = composition("blog-post", "es", authored);
  const tree = await subject.render();
  assert.deepEqual(subject.calls, ["es"]);
  const newsletter = elements(tree, "NewsletterSignup")[0]!;
  assert.equal(newsletter.eyebrow, authored.newsletter?.eyebrow);
  assert.equal(newsletter.title, authored.newsletter?.title);
  assert.equal(newsletter.description, authored.newsletter?.description);
  assert.equal(newsletter.source, "blog");
  assert.equal(elements(tree, "DetailTitle")[0]?.title, "featured");
  const aside = elements(tree, "DetailLayout")[0]?.aside;
  assert.equal(elements(aside, "AsideCta")[0]?.title, "Existing aside");
});

test("legacy post newsletter inherits localized copy", async () => {
  const subject = composition("blog-post", "fr", defaultBlog);
  const newsletter = elements(await subject.render(), "NewsletterSignup")[0]!;
  for (const field of ["eyebrow", "title", "description"] as const) assert.equal(newsletter[field], subject.t(`newsletter.${field}`));
});
