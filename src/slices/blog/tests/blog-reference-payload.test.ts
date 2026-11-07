import assert from "node:assert/strict";
import { test } from "node:test";
import {
  authorFormValues,
  authorLocalePayload,
  categoryFormValues,
  categoryLocalePayload,
} from "../admin/ui/reference-locale-payload";
import { authorSaveInput, blogCategorySaveInput } from "../admin/validation";

const id = "e8000000-0000-4000-8000-000000000090";

test("new/older forms keep untranslated targets blank and load authored pending text raw", () => {
  const fresh = authorFormValues(null);
  assert.equal(fresh.status, "draft");
  assert.deepEqual(fresh.translations, {
    es: { name: "", bio: "" },
    pt: { name: "", bio: "" },
    fr: { name: "", bio: "" },
  });
  const existing = authorFormValues({
    id,
    slug: "author-example",
    status: "published",
    avatar_media_id: null,
    name: "English author",
    bio: "English biography",
    translations: { es: { name: "  Nombre pendiente  ", bio: null } },
  });
  assert.deepEqual(existing.translations.es, {
    name: "  Nombre pendiente  ",
    bio: "",
  });
  assert.deepEqual(existing.translations.pt, { name: "", bio: "" });
  assert.deepEqual(existing.translations.fr, { name: "", bio: "" });
  const category = categoryFormValues({
    id,
    slug: "guides",
    color: "warm",
    position: 4,
    name: "Guides",
  });
  assert.deepEqual(category.translations, { es: "", pt: "", fr: "" });
  const partialCategory = categoryFormValues({
    id,
    slug: "guides",
    color: "warm",
    position: 4,
    name: "Guides",
    translations: { pt: " Guias pendentes " },
  });
  assert.deepEqual(partialCategory.translations, {
    es: "",
    pt: " Guias pendentes ",
    fr: "",
  });
});

test("one author payload independently clears names/bios and preserves targets when English bio is empty", () => {
  const state = authorFormValues(null);
  state.slug = " author-example ";
  state.status = "published";
  state.avatar_media_id = id;
  state.name = " English author ";
  state.bio = "   ";
  state.translations.es = { name: "   ", bio: " Biografía propia " };
  state.translations.pt = { name: " Nome próprio ", bio: "  " };
  state.translations.fr = { name: " Nom ", bio: " Texte français " };
  const before = structuredClone(state);
  const payload = authorLocalePayload(state, id);
  assert.equal(payload.id, id);
  assert.equal(payload.slug, "author-example");
  assert.equal(payload.avatar_media_id, id);
  assert.equal(payload.bio, null);
  assert.deepEqual(payload.translations, {
    es: { name: "", bio: "Biografía propia" },
    pt: { name: "Nome próprio", bio: null },
    fr: { name: "Nom", bio: "Texte français" },
  });
  assert.equal(authorSaveInput.safeParse(payload).success, true);
  assert.deepEqual(state, before);
});

test("category Save carries stable identity/shared properties and explicit blank target clears", () => {
  const state = categoryFormValues(null);
  state.slug = " city-guide ";
  state.color = " warm ";
  state.position = "8";
  state.name = " City guide ";
  state.translations = {
    es: " Guía de ciudad ",
    pt: "  ",
    fr: " Guide de ville ",
  };
  const before = structuredClone(state);
  const payload = categoryLocalePayload(state, id);
  assert.deepEqual(payload, {
    id,
    slug: "city-guide",
    color: "warm",
    position: 8,
    name: "City guide",
    translations: { es: "Guía de ciudad", pt: "", fr: "Guide de ville" },
  });
  assert.equal(blogCategorySaveInput.safeParse(payload).success, true);
  assert.deepEqual(state, before);
  state.position = "";
  assert.equal(categoryLocalePayload(state).position, 0);
});

test("localized validation allows English fallback but keeps required source names and exact field limits", () => {
  const author = authorLocalePayload({
    ...authorFormValues(null),
    slug: "example",
    name: "Author",
  });
  const category = categoryLocalePayload({
    ...categoryFormValues(null),
    slug: "guides",
    name: "Guides",
  });
  assert.equal(authorSaveInput.safeParse(author).success, true);
  assert.equal(blogCategorySaveInput.safeParse(category).success, true);
  assert.equal(
    authorSaveInput.safeParse({ ...author, name: "" }).success,
    false,
  );
  assert.equal(
    blogCategorySaveInput.safeParse({ ...category, name: "" }).success,
    false,
  );
  const badName = authorSaveInput.safeParse({
    ...author,
    translations: {
      ...author.translations,
      es: { name: "a".repeat(121), bio: null },
    },
  });
  assert.equal(badName.success, false);
  if (!badName.success)
    assert.equal(
      badName.error.issues[0]?.path.join("."),
      "translations.es.name",
    );
  const badBio = authorSaveInput.safeParse({
    ...author,
    translations: {
      ...author.translations,
      pt: { name: "", bio: "a".repeat(1001) },
    },
  });
  assert.equal(badBio.success, false);
  if (!badBio.success)
    assert.equal(badBio.error.issues[0]?.path.join("."), "translations.pt.bio");
  const badCategory = blogCategorySaveInput.safeParse({
    ...category,
    translations: { ...category.translations, fr: "a".repeat(81) },
  });
  assert.equal(badCategory.success, false);
  if (!badCategory.success)
    assert.equal(
      badCategory.error.issues[0]?.path.join("."),
      "translations.fr",
    );
});

test("older source-only clients omit translations without materializing target clears", () => {
  const author = authorSaveInput.parse({
    slug: "example",
    name: "Author",
    bio: null,
    status: "draft",
    avatar_media_id: null,
  });
  const category = blogCategorySaveInput.parse({
    slug: "guides",
    name: "Guides",
    position: 0,
    color: "warm",
  });
  assert.equal(Object.hasOwn(author, "translations"), false);
  assert.equal(Object.hasOwn(category, "translations"), false);
  assert.equal(
    authorSaveInput.safeParse({
      ...author,
      translations: {
        es: { name: "", bio: null },
        pt: { name: "", bio: null },
        fr: { name: "", bio: null },
        de: { name: "", bio: null },
      },
    }).success,
    false,
  );
});
