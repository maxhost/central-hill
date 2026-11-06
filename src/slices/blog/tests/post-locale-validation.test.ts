import test from "node:test";
import assert from "node:assert/strict";
import { checkBlogEnvelope, prepareBlogTarget, sharedBlogValuesMatch } from "../server/post-locale-validation";
import type { BlogPostEnvelopeV1 } from "../editorial-types";
const category = "c1000000-0000-4000-8000-000000000001";
const author = "c2000000-0000-4000-8000-000000000001";
const media = "c3000000-0000-4000-8000-000000000001";
function article(): BlogPostEnvelopeV1 { return { schemaVersion: 1, content: { title: "English title", excerpt: "English introduction", body: [{ type: "paragraph", text: "Article text" }], category_id: category, author_id: author, cover_media_id: media, og_image_media_id: null, published_at: null, reading_minutes: 4, is_featured: false, related_ids: [], cta_label: null, cta_url: null, meta_title: null, meta_description: null } }; }
test("Unfinished drafts remain bounded while publication validates required text, body and media", () => {
  const doc = article(); doc.content.title = ""; doc.content.excerpt = ""; doc.content.cover_media_id = null;
  doc.content.body = [{ type: "heading", level: 2, text: "" }, { type: "image", media_id: "" }, { type: "list", ordered: false, items: [] }];
  assert.deepEqual(checkBlogEnvelope(doc).errors, {});
  assert.ok(Object.keys(checkBlogEnvelope(doc, true).errors).length >= 4);
  doc.content.title = "x".repeat(201); assert.ok(checkBlogEnvelope(doc).errors["content.title"]);
  const bad = { ...article(), schemaVersion: 2 }; assert.equal(checkBlogEnvelope(bad).envelope, undefined);
  const unknown = article(); unknown.content.body = [{ type: "video" } as never]; assert.equal(checkBlogEnvelope(unknown).envelope, undefined);
});
test("Localized targets preserve complete bodies and text while shared references follow saved EN", () => {
  const en = article(); const es = article(); es.content.title = "Título ES"; es.content.body = [{ type: "quote", text: "Texto ES" }, { type: "paragraph", text: "Segundo" }];
  es.content.reading_minutes = 8; es.content.cta_url = "https://example.test/es"; es.content.cta_label = "Reservar";
  en.content.cover_media_id = "c3000000-0000-4000-8000-000000000002";
  const next = prepareBlogTarget(en, es);
  assert.deepEqual(next.content.body, es.content.body); assert.equal(next.content.title, "Título ES");
  assert.equal(next.content.reading_minutes, 8); assert.equal(next.content.cta_url, "https://example.test/es");
  assert.equal(next.content.cover_media_id, en.content.cover_media_id); assert.equal(sharedBlogValuesMatch(next, en), true);
  assert.equal(sharedBlogValuesMatch(es, en), false); assert.notEqual(es.content.cover_media_id, en.content.cover_media_id);
});
test("Button pairs publish together and executable URLs never enter persisted documents", () => {
  const doc = article(); doc.content.cta_label = "Reserve";
  assert.equal(Object.keys(checkBlogEnvelope(doc).errors).length, 0);
  assert.ok(checkBlogEnvelope(doc, true).errors.cta_url);
  doc.content.cta_url = "javascript:alert(1)"; assert.equal(checkBlogEnvelope(doc).envelope, undefined);
  doc.content.cta_url = "https://example.test/en?campaign=one"; assert.deepEqual(checkBlogEnvelope(doc, true).errors, {});
  doc.content.body = [{ type: "cta", label: "Run", url: "data:text/html,hello" }]; assert.equal(checkBlogEnvelope(doc).envelope, undefined);
});
