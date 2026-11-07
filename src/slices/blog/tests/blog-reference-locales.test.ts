import assert from "node:assert/strict";
import { test } from "node:test";
import { authorSaveInput, blogCategorySaveInput } from "../admin/validation";
import {
  rawAuthorTranslations,
  rawBlogCategoryTranslations,
} from "../server/reference-locales";
import {
  getBlogEditorialRedirect,
  isBlogEditorialEntity,
} from "../server/editorial-translation-policy";

const category = {
  slug: "qa-category",
  color: "warm",
  position: 0,
  name: "Category EN",
};
const author = {
  slug: "qa-author",
  status: "published",
  avatar_media_id: null,
  name: "Author EN",
  bio: null,
};

test("older category/author clients may omit translations without materializing clears", () => {
  assert.equal(blogCategorySaveInput.parse(category).translations, undefined);
  assert.equal(authorSaveInput.parse(author).translations, undefined);
});

test("manual locale inputs trim text, accept empty fallback fields and nullable author bios", () => {
  const labels = blogCategorySaveInput.parse({
    ...category,
    translations: { es: "  Categoría  ", pt: " ", fr: "Catégorie" },
  });
  assert.deepEqual(labels.translations, {
    es: "Categoría",
    pt: "",
    fr: "Catégorie",
  });
  const authored = authorSaveInput.parse({
    ...author,
    translations: {
      es: { name: "  Autor  ", bio: "  Biografía  " },
      pt: { name: "", bio: null },
      fr: { name: "Auteur", bio: " " },
    },
  });
  assert.deepEqual(authored.translations, {
    es: { name: "Autor", bio: "Biografía" },
    pt: { name: "", bio: null },
    fr: { name: "Auteur", bio: "" },
  });
});

test("limits and complete target shape report the localized field, retaining EN requirements", () => {
  assert.equal(
    blogCategorySaveInput.safeParse({ ...category, name: "   " }).success,
    false,
  );
  assert.equal(
    authorSaveInput.safeParse({ ...author, name: " \t " }).success,
    false,
  );
  assert.equal(
    blogCategorySaveInput.parse({ ...category, name: "  Category EN  " }).name,
    "Category EN",
  );
  assert.equal(
    authorSaveInput.parse({ ...author, name: "  Author EN  " }).name,
    "Author EN",
  );
  assert.equal(
    blogCategorySaveInput.safeParse({ ...category, name: "" }).success,
    false,
  );
  assert.equal(
    authorSaveInput.safeParse({ ...author, name: "" }).success,
    false,
  );
  const badName = blogCategorySaveInput.safeParse({
    ...category,
    translations: { es: "x".repeat(81), pt: "", fr: "" },
  });
  assert.equal(badName.success, false);
  if (!badName.success)
    assert.deepEqual(badName.error.issues[0]?.path, ["translations", "es"]);
  const badBio = authorSaveInput.safeParse({
    ...author,
    translations: {
      es: { name: "", bio: "x".repeat(1001) },
      pt: { name: "", bio: null },
      fr: { name: "", bio: null },
    },
  });
  assert.equal(badBio.success, false);
  if (!badBio.success)
    assert.deepEqual(badBio.error.issues[0]?.path, [
      "translations",
      "es",
      "bio",
    ]);
  assert.equal(
    authorSaveInput.safeParse({
      ...author,
      translations: { es: { name: "x", bio: null } },
    }).success,
    false,
  );
  assert.equal(
    blogCategorySaveInput.safeParse({
      ...category,
      translations: { en: "wrong", es: "", pt: "", fr: "" },
    }).success,
    false,
  );
});

test("raw authored target extraction preserves pending values and missing fields stay blank", () => {
  const rows = [
    { locale: "en" as const, field: "name", value: "English" },
    { locale: "en" as const, field: "bio", value: "English biography" },
    { locale: "es" as const, field: "name", value: "Pending Spanish" },
    { locale: "pt" as const, field: "bio", value: "Portuguese bio" },
  ];
  assert.deepEqual(rawBlogCategoryTranslations(rows), {
    es: "Pending Spanish",
    pt: "",
    fr: "",
  });
  assert.deepEqual(rawAuthorTranslations(rows), {
    es: { name: "Pending Spanish", bio: null },
    pt: { name: "", bio: "Portuguese bio" },
    fr: { name: "", bio: null },
  });
});

test("legacy Blog reference reviews redirect to their single forms while posts retain locale tabs", () => {
  const id = "e8000000-0000-4000-8000-000000000001";
  assert.equal(isBlogEditorialEntity("author"), true);
  assert.equal(isBlogEditorialEntity("blog_category"), true);
  assert.equal(
    getBlogEditorialRedirect("author", id, "es"),
    `/admin/authors/${id}`,
  );
  assert.equal(
    getBlogEditorialRedirect("blog_category", id, "fr"),
    `/admin/blog-categories/${id}`,
  );
  assert.equal(
    getBlogEditorialRedirect("blog_post", id, "pt"),
    `/admin/posts/${id}?locale=pt`,
  );
  assert.equal(getBlogEditorialRedirect("author", "bad", "es"), null);
  assert.equal(isBlogEditorialEntity("city"), false);
});
