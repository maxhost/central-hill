import assert from "node:assert/strict";
import { test } from "node:test";
import {
  authorSaveInput,
  blogCategorySaveInput,
  blogPostSaveInput,
} from "../admin/validation";

/**
 * Slice `blog` backoffice (S12) — the admin **save** schemas (category, author, post
 * with portable-JSON body + related). Pure (Zod, no DB). Run:
 * `npx tsx --test src/slices/blog/tests/blog-admin.test.ts`.
 */

const CAT = "11111111-1111-4111-8111-111111111111";
const AUTHOR = "22222222-2222-4222-8222-222222222222";
const COVER = "33333333-3333-4333-8333-333333333333";
const REL1 = "44444444-4444-4444-8444-444444444444";
const REL2 = "55555555-5555-4555-8555-555555555555";
const MEDIA = "66666666-6666-4666-8666-666666666666";

function validPost(overrides: Record<string, unknown> = {}) {
  return {
    slug: "lisbon-rooftops",
    status: "draft",
    category_id: CAT,
    author_id: AUTHOR,
    cover_media_id: COVER,
    og_image_media_id: null,
    published_at: null,
    reading_minutes: 6,
    is_featured: false,
    cta_label: null,
    cta_url: null,
    title: "The best Lisbon rooftops",
    excerpt: "Where to catch the sunset.",
    body: [
      { type: "heading", level: 2, text: "Introduction" },
      { type: "paragraph", text: "Lisbon glows at golden hour." },
      { type: "list", ordered: false, items: ["Park", "Bar"] },
      { type: "image", media_id: MEDIA, caption: "View" },
      { type: "divider" },
    ],
    meta_title: null,
    meta_description: null,
    related_ids: [REL1, REL2],
    ...overrides,
  };
}

test("accepts a valid category / author", () => {
  assert.equal(
    blogCategorySaveInput.safeParse({ slug: "city-guide", color: "#aa3322", position: 0, name: "City guide" })
      .success,
    true,
  );
  assert.equal(
    authorSaveInput.safeParse({ slug: "ana", status: "published", avatar_media_id: null, name: "Ana", bio: null })
      .success,
    true,
  );
});

test("accepts a complete, valid post with a block body", () => {
  assert.equal(blogPostSaveInput.safeParse(validPost()).success, true);
});

test("post requires a cover image and a category/author", () => {
  assert.equal(blogPostSaveInput.safeParse(validPost({ cover_media_id: null })).success, false);
  assert.equal(blogPostSaveInput.safeParse(validPost({ category_id: "nope" })).success, false);
});

test("reading_minutes must be a positive integer ≤120", () => {
  assert.equal(blogPostSaveInput.safeParse(validPost({ reading_minutes: 0 })).success, false);
  assert.equal(blogPostSaveInput.safeParse(validPost({ reading_minutes: 200 })).success, false);
});

test("body rejects an unknown block type", () => {
  assert.equal(
    blogPostSaveInput.safeParse(validPost({ body: [{ type: "embed", url: "x" }] })).success,
    false,
  );
});

test("related_ids capped at 3", () => {
  assert.equal(
    blogPostSaveInput.safeParse(validPost({ related_ids: [REL1, REL2, COVER, CAT] })).success,
    false,
  );
  assert.equal(blogPostSaveInput.safeParse(validPost({ related_ids: [] })).success, true);
});

test("published_at accepts null, empty, or an ISO datetime", () => {
  assert.equal(blogPostSaveInput.safeParse(validPost({ published_at: null })).success, true);
  assert.equal(blogPostSaveInput.safeParse(validPost({ published_at: "" })).success, true);
  assert.equal(
    blogPostSaveInput.safeParse(validPost({ published_at: "2026-06-14T10:30" })).success,
    true,
  );
  assert.equal(blogPostSaveInput.safeParse(validPost({ published_at: "not-a-date" })).success, false);
});

test("rejects blank required [T] title/excerpt", () => {
  assert.equal(blogPostSaveInput.safeParse(validPost({ title: "" })).success, false);
  assert.equal(blogPostSaveInput.safeParse(validPost({ excerpt: "" })).success, false);
});
