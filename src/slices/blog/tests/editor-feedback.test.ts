import test from "node:test";
import assert from "node:assert/strict";
import {
  changePostField,
  type PostWorkspace,
  emptyPostEnvelope,
} from "../admin/ui/post-editor-state";
import { checkBlogEnvelope } from "../server/post-locale-validation";
import {
  retainPostErrors,
  postFeedbackLabel,
} from "../admin/ui/feedback-model";
const category = "eef20000-0000-4000-8000-000000000001",
  author = "eef20000-0000-4000-8000-000000000002";
test("Blog CTA missing label and URL report the actual missing field independently", () => {
  const d = emptyPostEnvelope(category, author);
  d.content.cta_url = "https://example.test";
  assert.ok(checkBlogEnvelope(d, true).errors.cta_label);
  assert.equal(checkBlogEnvelope(d, true).errors.cta_url, undefined);
  d.content.cta_url = null;
  d.content.cta_label = "Read";
  assert.ok(checkBlogEnvelope(d, true).errors.cta_url);
});
test("Blog correction preserves unchanged server-only references and remaining errors after incomplete Save", () => {
  const before = emptyPostEnvelope(category, author);
  before.content.cover_media_id = "eef20000-0000-4000-8000-000000000003";
  const after = structuredClone(before);
  after.content.title = "Fixed";
  const errors = {
    title: "Title required",
    excerpt: "Excerpt required",
    cover_media_id: "Select an uploaded image.",
  };
  const retained = retainPostErrors(errors, after, before);
  assert.equal(retained.title, undefined);
  assert.ok(retained.excerpt);
  assert.equal(retained.cover_media_id, "Select an uploaded image.");
  assert.ok(retainPostErrors(errors, after, undefined, true).excerpt);
});
test("Blog body destinations are human-readable", () => {
  assert.deepEqual(postFeedbackLabel("body.2.text"), {
    section: "Article body",
    label: "Block 3 → Text",
  });
});

test("Blog feedback breadcrumbs name each section once and distinguish list items from blocks", () => {
  const cases = [
    ["body", "Article body", "Content"],
    ["body.0.body", "Article body", "Block 1 → Text"],
    [
      "payload.content.body.2.items.1",
      "Article body",
      "Block 3 → List items → Item 2",
    ],
    ["content.meta_title", "SEO", "Title"],
    ["meta_description", "SEO", "Description"],
    ["cta_url", "Button", "URL"],
  ] as const;
  for (const [path, section, label] of cases)
    assert.deepEqual(postFeedbackLabel(path), { section, label });
});

test("clearing the optional Blog CTA pair removes only its locally resolved error", () => {
  const before = emptyPostEnvelope(category, author);
  before.content.cta_label = "Read";
  before.content.cover_media_id = "eef20000-0000-4000-8000-000000000003";
  const states = Object.fromEntries(
    (["en", "es", "pt", "fr"] as const).map((locale) => [
      locale,
      {
        model: {
          locale,
          revision: 1,
          templateRevision: null,
          published: null,
          draft: structuredClone(before),
          working: structuredClone(before),
        },
        errors:
          locale === "en"
            ? {
                cta_url: "Enter a button URL.",
                cover_media_id: "Select an available image.",
              }
            : locale === "es"
              ? { excerpt: "Other locale stays invalid." }
              : {},
        notice: "",
        conflict: false,
      },
    ]),
  ) as PostWorkspace;
  const next = changePostField(states, "en", "cta_label", null);
  assert.equal(next.en.model.working.content.cta_url, null);
  assert.equal(next.en.errors.cta_url, undefined);
  assert.equal(next.en.errors.cover_media_id, "Select an available image.");
  assert.deepEqual(next.es.errors, states.es.errors);
});
