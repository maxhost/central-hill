import assert from "node:assert/strict";
import { test } from "node:test";
import { editorDocumentToPostBody, postBodyToEditorDocument, RichTextConversionError, type EditorDocument } from "../admin/rich-text-codec";
import { postBody, type PostBody } from "../body";
import { checkBlogEnvelope } from "../server/post-locale-validation";

const media = "00000000-0000-4000-8000-000000000001";
const legacy: PostBody = [
  { type: "heading", level: 2, number: "01", text: "Start" },
  { type: "paragraph", text: "Plain text" },
  { type: "list", ordered: true, items: ["First", "Second"] },
  { type: "image", media_id: media, caption: "", alt: "A scene" },
  { type: "quote", text: "A thought", attribution: "Writer" },
  { type: "callout", variant: "warning", body: "Be careful" },
  { type: "divider" },
  { type: "cta", label: "Read more", url: "https://example.com/" },
];
const roundtrip = (body: PostBody) => editorDocumentToPostBody(postBodyToEditorDocument(body));
test("all eight legacy blocks round-trip exactly, including optional presence and blank draft text", () => {
  assert.deepEqual(roundtrip(legacy), legacy);
  const optional: PostBody = [
    { type: "heading", level: 4, number: "", text: "" }, { type: "paragraph", text: "" },
    { type: "image", media_id: media }, { type: "quote", text: "Q", attribution: "" },
    { type: "callout", variant: "note", body: "", inline: [] }, { type: "list", ordered: false, items: [""], inline_items: [[]] },
  ];
  assert.deepEqual(roundtrip(optional), optional);
  assert.deepEqual(roundtrip([]), []);
});
test("inline formatting and safe links preserve exact existing run segmentation and false flags", () => {
  const body: PostBody = [
    { type: "paragraph", text: "Hello world", inline: [{ text: "Hel", bold: true }, { text: "lo", bold: true }, { text: " world", italic: false, href: "/en/blog" }] },
    { type: "list", ordered: false, items: ["Bold", "Plain"], inline_items: [[{ text: "Bold", bold: true }], [{ text: "Plain" }]] },
    { type: "quote", text: "Text", inline: [{ text: "Text", bold: false }] },
  ];
  assert.deepEqual(roundtrip(body), body);
});
test("editing text retains heading number and quote attribution while updating canonical runs", () => {
  const document = postBodyToEditorDocument(legacy);
  document.content[0]!.content = [{ type: "text", text: "Edited", marks: [{ type: "bold" }] }];
  document.content[4]!.content = [{ type: "text", text: "Changed", marks: [{ type: "italic" }] }];
  const result = editorDocumentToPostBody(document);
  assert.deepEqual(result[0], { type: "heading", level: 2, number: "01", text: "Edited", inline: [{ text: "Edited", bold: true }] });
  assert.deepEqual(result[4], { type: "quote", text: "Changed", attribution: "Writer", inline: [{ text: "Changed", italic: true }] });
});
test("nested paste, unsupported marks/nodes and unsafe links fail atomically; source is untouched", () => {
  const before = structuredClone(legacy);
  const bad: EditorDocument[] = [
    { type: "doc", content: [{ type: "table" }] },
    { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Code", marks: [{ type: "code" }] }] }] },
    { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Unsafe", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }] },
    { type: "doc", content: [{ type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph" }, { type: "bulletList" }] }] }] },
    { type: "doc", content: [{ type: "orderedList", attrs: { start: 3 }, content: [] }] },
  ];
  for (const document of bad) assert.throws(() => editorDocumentToPostBody(document), RichTextConversionError);
  assert.deepEqual(legacy, before);
});
function envelope(body: unknown) { return { schemaVersion: 1, content: {
  title: "", excerpt: "", body, category_id: media, author_id: media, cover_media_id: null, og_image_media_id: null,
  published_at: null, reading_minutes: null, is_featured: false, related_ids: [], cta_label: null, cta_url: null, meta_title: null, meta_description: null,
} }; }
test("postBody and draft envelope reject mismatched runs and unsafe href; drafts retain blank legacy paragraph", () => {
  const mismatch = [{ type: "paragraph", text: "One", inline: [{ text: "Other", bold: true }] }];
  assert.equal(postBody.safeParse(mismatch).success, false);
  assert.ok(Object.keys(checkBlogEnvelope(envelope(mismatch)).errors).length);
  for (const href of ["javascript:alert(1)", "//evil.test", "/\\evil", " https://example.com", "data:text/html,test"]) {
    const invalid = [{ type: "paragraph", text: "X", inline: [{ text: "X", href }] }];
    assert.equal(postBody.safeParse(invalid).success, false);
    assert.ok(Object.keys(checkBlogEnvelope(envelope(invalid)).errors).length);
  }
  const valid: PostBody = [{ type: "paragraph", text: "Good", inline: [{ text: "Good", bold: true, href: "https://example.com" }] }];
  assert.equal(postBody.safeParse(valid).success, true);
  assert.deepEqual(checkBlogEnvelope(envelope(valid)).envelope?.content.body, valid);
  assert.deepEqual(checkBlogEnvelope(envelope([{ type: "paragraph", text: "" }])).errors, {});
});

test("formatted list with a blank item saves as a draft with no empty text runs; publish rejects it", () => {
  const document: EditorDocument = { type: "doc", content: [{ type: "bulletList", content: [
    { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "First", marks: [{ type: "bold" }] }] }] },
    { type: "listItem", content: [{ type: "paragraph" }] },
  ] }] };
  const body = editorDocumentToPostBody(document);
  assert.deepEqual(body, [{ type: "list", ordered: false, items: ["First", ""], inline_items: [[{ text: "First", bold: true }], []] }]);
  assert.deepEqual(checkBlogEnvelope(envelope(body)).errors, {});
  assert.ok(checkBlogEnvelope(envelope(body), true).errors["body.0.items"]);
});
