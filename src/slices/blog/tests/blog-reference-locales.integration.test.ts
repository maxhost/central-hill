import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import {
  deleteContent,
  deleteSlugs,
  loadContent,
  loadTranslationRows,
  setSlugs,
  setSourceContent,
  setTargetTranslation,
} from "@core/i18n";
import {
  author,
  blog_category,
  blog_post,
  blog_post_locale_content,
} from "../schema";
import { BLOG_REFERENCE_LOCALES } from "../reference-locale-types";
import type { BlogPostEnvelopeV1 } from "../editorial-types";
import { emptyBlogEnvelope } from "../server/post-locale-model";
import {
  saveAuthorLabels,
  saveBlogCategoryLabels,
} from "../server/reference-locales";
import {
  getAuthorForEdit,
  getBlogCategoryForEdit,
  listAuthorOptions,
  listBlogCategoryOptions,
} from "../admin/queries";
import {
  getPostBySlug,
  listPosts,
  listCategories,
  resolvePostDocument,
} from "../server/queries";

const id = (n: number) =>
  `e8000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const CAT = id(1),
  AUTHOR = id(2),
  POST = id(3),
  RELATED = id(4),
  KERNEL = id(5);
const OWN = [CAT, AUTHOR, POST, RELATED, KERNEL];
const PHOTO = "d3000000-0000-4000-8000-000000000001";
const actor = "blog-reference-locales-backend";
const categoryTargets = {
  es: "Categoría ES",
  pt: "Categoria PT",
  fr: "Catégorie FR",
};
const authorTargets = {
  es: { name: "Autor ES", bio: "Biografía ES" },
  pt: { name: "Autor PT", bio: "Biografia PT" },
  fr: { name: "Auteur FR", bio: "Biographie FR" },
};
let verified = false;

const rows = () =>
  db
    .select()
    .from(blog_post_locale_content)
    .where(inArray(blog_post_locale_content.post_id, [POST, RELATED]));
const ownAuthorRows = () => loadTranslationRows({ type: "author", id: AUTHOR });
const ownCategoryRows = () =>
  loadTranslationRows({ type: "blog_category", id: CAT });
function envelope(locale: string, related: boolean): BlogPostEnvelopeV1 {
  const value = emptyBlogEnvelope({ author_id: AUTHOR, category_id: CAT });
  Object.assign(value.content, {
    title: `${locale} ${related ? "Related" : "Article"} public`,
    excerpt: `${locale} Public excerpt`,
    body: [{ type: "paragraph", text: `${locale} Public body` }],
    cover_media_id: PHOTO,
    meta_title: `${locale} SEO unchanged`,
    meta_description: `${locale} Meta unchanged`,
    related_ids: related ? [] : [RELATED],
  });
  return value;
}
before(async () => {
  assert.equal(
    new URL(process.env.DATABASE_URL ?? "http://invalid.test").hostname,
    "propertylocalesqa.local",
  );
  const who = await db.execute(
    sql`select current_database() as database,current_user as role`,
  );
  assert.deepEqual(who.rows[0], {
    database: "propertylocalesqa",
    role: "propertylocalesqa",
  });
  const existing = await Promise.all([
    db.select({ id: author.id }).from(author).where(inArray(author.id, OWN)),
    db
      .select({ id: blog_category.id })
      .from(blog_category)
      .where(inArray(blog_category.id, OWN)),
    db
      .select({ id: blog_post.id })
      .from(blog_post)
      .where(inArray(blog_post.id, OWN)),
  ]);
  assert.equal(
    existing.flat().length,
    0,
    "Test fixture identities must be new/previously cleaned.",
  );
  verified = true;
  Object.assign(globalThis, {
    __incrementalCache: {
      generateCacheKey: async (key: string) => key,
      get: async () => null,
      set: async () => undefined,
    },
  });
  await db.insert(blog_category).values({
    id: CAT,
    slug: "blog-reference-backend-category",
    color: "warm",
    position: 9999,
  });
  await db.insert(author).values([
    {
      id: AUTHOR,
      slug: "blog-reference-backend-author",
      status: "published",
      avatar_media_id: null,
    },
    { id: KERNEL, slug: "blog-reference-kernel-clear", status: "draft" },
  ]);
  await saveBlogCategoryLabels(CAT, { name: "Category EN" }, actor);
  await saveAuthorLabels(
    AUTHOR,
    { name: "Author EN", bio: "Biography EN" },
    actor,
  );
  for (const postId of [POST, RELATED]) {
    const slug =
      postId === POST
        ? "blog-reference-backend-article"
        : "blog-reference-backend-related";
    await db.insert(blog_post).values({
      id: postId,
      slug,
      status: "published",
      category_id: CAT,
      author_id: AUTHOR,
      cover_media_id: PHOTO,
    });
    await setSlugs(
      "blog_post",
      postId,
      Object.fromEntries(
        BLOG_REFERENCE_LOCALES.map((locale) => [locale, slug]),
      ),
    );
    await db.insert(blog_post_locale_content).values(
      BLOG_REFERENCE_LOCALES.map((locale) => {
        const published = envelope(locale, postId === RELATED),
          draft = structuredClone(published);
        draft.content.title = `${locale} Draft must stay private`;
        return { post_id: postId, locale, revision: 7, published, draft };
      }),
    );
  }
});
after(async () => {
  if (!verified) return;
  await db.delete(blog_post).where(inArray(blog_post.id, [POST, RELATED]));
  await db.delete(author).where(inArray(author.id, [AUTHOR, KERNEL]));
  await db.delete(blog_category).where(eq(blog_category.id, CAT));
  for (const [type, ref] of [
    ["author", AUTHOR],
    ["author", KERNEL],
    ["blog_category", CAT],
    ["blog_post", POST],
    ["blog_post", RELATED],
  ] as const) {
    await deleteContent(type, ref);
    await deleteSlugs(type, ref);
  }
});

test("raw edit reads keep pending targets private and absent inputs blank without writes", async () => {
  await setTargetTranslation(
    "author",
    AUTHOR,
    "name",
    "es",
    "Nombre pendiente",
    { sourceValue: "Author EN", state: "needs_review", updatedBy: actor },
  );
  await setTargetTranslation(
    "author",
    AUTHOR,
    "bio",
    "pt",
    "Biografia pendente",
    { sourceValue: "Biography EN", state: "needs_review", updatedBy: actor },
  );
  await setTargetTranslation(
    "blog_category",
    CAT,
    "name",
    "fr",
    "Catégorie en attente",
    { sourceValue: "Category EN", state: "needs_review", updatedBy: actor },
  );
  const beforeAuthor = await ownAuthorRows(),
    beforeCategory = await ownCategoryRows();
  const edit = await getAuthorForEdit(AUTHOR),
    category = await getBlogCategoryForEdit(CAT);
  assert.deepEqual(edit?.data.translations, {
    es: { name: "Nombre pendiente", bio: null },
    pt: { name: "", bio: "Biografia pendente" },
    fr: { name: "", bio: null },
  });
  assert.deepEqual(category?.translations, {
    es: "",
    pt: "",
    fr: "Catégorie en attente",
  });
  assert.equal(
    (await listAuthorOptions()).find((o) => o.id === AUTHOR)?.labels?.es,
    "Author EN",
  );
  assert.equal(
    (await listBlogCategoryOptions()).find((o) => o.id === CAT)?.labels?.fr,
    "Category EN",
  );
  assert.deepEqual(await ownAuthorRows(), beforeAuthor);
  assert.deepEqual(await ownCategoryRows(), beforeCategory);
});

test("manual Save approves every field; public listing/detail/related and preview use post locale with stable post snapshots", async () => {
  const before = await rows();
  await saveBlogCategoryLabels(
    CAT,
    { name: "Category EN", translations: categoryTargets },
    actor,
  );
  await saveAuthorLabels(
    AUTHOR,
    { name: "Author EN", bio: "Biography EN", translations: authorTargets },
    actor,
  );
  assert.ok(
    (await ownAuthorRows())
      .filter((row) => row.locale !== "en")
      .every((row) => row.state === "approved"),
  );
  assert.ok(
    (await ownCategoryRows())
      .filter((row) => row.locale !== "en")
      .every((row) => row.state === "approved"),
  );
  const options = (await listAuthorOptions()).find((row) => row.id === AUTHOR),
    categories = (await listBlogCategoryOptions()).find(
      (row) => row.id === CAT,
    );
  assert.deepEqual(options?.labels, {
    en: "Author EN",
    es: "Autor ES",
    pt: "Autor PT",
    fr: "Auteur FR",
  });
  assert.deepEqual(categories?.labels, {
    en: "Category EN",
    ...categoryTargets,
  });
  for (const locale of BLOG_REFERENCE_LOCALES) {
    const expectedAuthor =
      locale === "en"
        ? { name: "Author EN", bio: "Biography EN" }
        : authorTargets[locale];
    const expectedCategory =
      locale === "en" ? "Category EN" : categoryTargets[locale];
    const detail = await getPostBySlug(
      locale,
      "blog-reference-backend-article",
    );
    assert.ok(detail);
    assert.equal(detail.author.id, AUTHOR);
    assert.equal(detail.category.id, CAT);
    assert.equal(detail.author.name, expectedAuthor.name);
    assert.equal(detail.author.bio, expectedAuthor.bio);
    assert.equal(detail.category.name, expectedCategory);
    assert.equal(detail.title, `${locale} Article public`);
    assert.equal(detail.metaTitle, `${locale} SEO unchanged`);
    assert.equal(
      detail.related.find((row) => row.id === RELATED)?.author.name,
      expectedAuthor.name,
    );
    assert.equal(
      (await listPosts(locale)).find((row) => row.id === POST)?.category.name,
      expectedCategory,
    );
    assert.equal(
      (await listCategories(locale)).find((row) => row.id === CAT)?.name,
      expectedCategory,
    );
    const preview = await resolvePostDocument(
      POST,
      envelope(locale, false),
      locale,
      "private-sample",
    );
    assert.equal(preview?.author.bio, expectedAuthor.bio);
    assert.equal(preview?.category.name, expectedCategory);
  }
  assert.deepEqual(await rows(), before);
});

test("later EN-only clients preserve independent targets; blank targets clear one field for English fallback", async () => {
  const before = await rows();
  const authored = (await ownAuthorRows()).filter((row) => row.locale !== "en"),
    category = (await ownCategoryRows()).filter((row) => row.locale !== "en");
  await saveAuthorLabels(
    AUTHOR,
    { name: "Author EN renamed", bio: "Biography EN renamed" },
    actor,
  );
  await saveBlogCategoryLabels(CAT, { name: "Category EN renamed" }, actor);
  assert.deepEqual(
    (await ownAuthorRows()).filter((row) => row.locale !== "en"),
    authored,
  );
  assert.deepEqual(
    (await ownCategoryRows()).filter((row) => row.locale !== "en"),
    category,
  );
  await saveAuthorLabels(
    AUTHOR,
    {
      name: "Author EN renamed",
      bio: "Biography EN renamed",
      translations: {
        ...authorTargets,
        es: { name: "", bio: authorTargets.es.bio },
        pt: { name: authorTargets.pt.name, bio: null },
      },
    },
    actor,
  );
  await saveBlogCategoryLabels(
    CAT,
    {
      name: "Category EN renamed",
      translations: { ...categoryTargets, es: "  " },
    },
    actor,
  );
  const es = await getPostBySlug("es", "blog-reference-backend-article"),
    pt = await getPostBySlug("pt", "blog-reference-backend-article");
  assert.equal(es?.author.name, "Author EN renamed");
  assert.equal(es?.author.bio, "Biografía ES");
  assert.equal(es?.category.name, "Category EN renamed");
  assert.equal(pt?.author.name, "Autor PT");
  assert.equal(pt?.author.bio, "Biography EN renamed");
  assert.equal(pt?.category.name, "Categoria PT");
  assert.equal(
    (await getAuthorForEdit(AUTHOR))?.data.translations?.es.name,
    "",
  );
  assert.equal(
    (await getAuthorForEdit(AUTHOR))?.data.translations?.pt.bio,
    null,
  );
  assert.equal((await getBlogCategoryForEdit(CAT))?.translations?.es, "");
  assert.deepEqual(await rows(), before);
});

test("clearing EN bio preserves approved and pending target bios even when translations are omitted", async () => {
  const before = await rows();
  await setTargetTranslation(
    "author",
    AUTHOR,
    "bio",
    "pt",
    "PT Pending must survive",
    {
      sourceValue: "Biography EN renamed",
      state: "needs_review",
      updatedBy: actor,
    },
  );
  const targetRows = (await ownAuthorRows()).filter(
    (row) => row.locale !== "en",
  );
  await saveAuthorLabels(
    AUTHOR,
    { name: "Author EN renamed", bio: null },
    actor,
  );
  assert.deepEqual(
    (await ownAuthorRows()).filter((row) => row.locale !== "en"),
    targetRows,
  );
  assert.equal((await getAuthorForEdit(AUTHOR))?.data.bio, null);
  assert.equal(
    (await getAuthorForEdit(AUTHOR))?.data.translations?.pt.bio,
    "PT Pending must survive",
  );
  assert.equal(
    (await getPostBySlug("es", "blog-reference-backend-article"))?.author.bio,
    "Biografía ES",
  );
  assert.equal(
    (await getPostBySlug("pt", "blog-reference-backend-article"))?.author.bio,
    undefined,
  );
  const fresh = {
    ...authorTargets,
    es: { name: "", bio: "ES Independent without English" },
  };
  await saveAuthorLabels(
    AUTHOR,
    { name: "Author EN renamed", bio: null, translations: fresh },
    actor,
  );
  assert.equal(
    (await getPostBySlug("es", "blog-reference-backend-article"))?.author.bio,
    "ES Independent without English",
  );
  assert.equal(
    (await getPostBySlug("en", "blog-reference-backend-article"))?.author.bio,
    undefined,
  );
  assert.deepEqual(await rows(), before);
});

test("kernel default clear still removes all locales; explicit source-only clear retains target values and states", async () => {
  await setSourceContent(
    "author",
    KERNEL,
    { bio: "Original EN" },
    { updatedBy: actor },
  );
  await setTargetTranslation("author", KERNEL, "bio", "es", "Custom ES", {
    sourceValue: "Original EN",
    state: "approved",
    updatedBy: actor,
  });
  await setSourceContent("author", KERNEL, { bio: null }, { updatedBy: actor });
  assert.deepEqual(
    await loadTranslationRows({ type: "author", id: KERNEL }),
    [],
  );
  await setSourceContent(
    "author",
    KERNEL,
    { bio: "Another EN" },
    { updatedBy: actor },
  );
  await setTargetTranslation("author", KERNEL, "bio", "fr", "FR Pending", {
    sourceValue: "Another EN",
    state: "needs_review",
    updatedBy: actor,
  });
  const targets = (
    await loadTranslationRows({ type: "author", id: KERNEL })
  ).filter((row) => row.locale === "fr");
  await setSourceContent(
    "author",
    KERNEL,
    { bio: "  " },
    { updatedBy: actor, preserveTargetsOnClear: true },
  );
  assert.deepEqual(
    await loadTranslationRows({ type: "author", id: KERNEL }),
    targets,
  );
  assert.equal(
    (await loadContent([{ type: "author", id: KERNEL }], "fr")).get(
      "author",
      KERNEL,
      "bio",
    ),
    undefined,
  );
});
