import assert from "node:assert/strict";
import test from "node:test";
import { applyPostLocaleResult, emptyPostEnvelope, postMediaIds, preparePostTarget, type PostWorkspace } from "../admin/ui/post-editor-state";
import type { BlogPostLocaleModel } from "../editorial-types";

test("preparing a target keeps its complete differently ordered body and localized links", () => {
  const source = emptyPostEnvelope("source-category", "source-author");
  source.content.body = [{ type: "heading", level: 2, text: "English heading" }];
  source.content.cover_media_id = "new-cover";
  const own = emptyPostEnvelope("old-category", "old-author");
  own.content.title = "Mi artículo";
  own.content.body = [{ type: "paragraph", text: "Contenido propio" }, { type: "cta", label: "Reservar", url: "https://example.test/es/book" }];
  own.content.cta_url = "https://example.test/es/aside";
  const prepared = preparePostTarget(source, own);
  assert.deepEqual(prepared.content.body, own.content.body);
  assert.equal(prepared.content.title, "Mi artículo");
  assert.equal(prepared.content.cta_url, own.content.cta_url);
  assert.equal(prepared.content.cover_media_id, "new-cover");
  assert.equal(prepared.content.category_id, "source-category");
  prepared.content.related_ids.push("another-post");
  assert.deepEqual(source.content.related_ids, []);
});

test("applying a publication response retains unsaved work and persisted draft in another locale", () => {
  const model = (locale: BlogPostLocaleModel["locale"]): BlogPostLocaleModel => ({
    locale, revision: 2, templateRevision: null,
    published: emptyPostEnvelope(), draft: emptyPostEnvelope(), working: emptyPostEnvelope(),
  });
  const states = Object.fromEntries((["en", "es", "pt", "fr"] as const).map(locale => [locale, {
    model: model(locale), errors: {}, conflict: false, notice: "",
  }])) as PostWorkspace;
  states.es.model.working.content.title = "Un cambio sin guardar";
  states.es.model.draft!.content.title = "Borrador guardado";
  const published = { ...states.en.model, revision: 3, published: states.en.model.draft, draft: null };
  const next = applyPostLocaleResult(states, "en", published, "Published");
  assert.equal(next.es, states.es);
  assert.equal(next.es.model.working.content.title, "Un cambio sin guardar");
  assert.equal(next.es.model.draft!.content.title, "Borrador guardado");
  assert.equal(next.en.model.revision, 3);
  assert.equal(next.en.model.draft, null);
});

test("scoped media collection excludes unreferenced and other-language assets", () => {
  const envelope = emptyPostEnvelope();
  envelope.content.cover_media_id = "cover";
  envelope.content.og_image_media_id = "cover";
  envelope.content.body = [{ type: "image", media_id: "inline" }, { type: "image", media_id: "" }];
  assert.deepEqual(postMediaIds(envelope), ["cover", "inline"]);
});
