import assert from "node:assert/strict";
import test from "node:test";
import { applyPostLocaleResult, changePostField, emptyPostEnvelope, postMediaIds, preparePostTarget, type PostWorkspace } from "../admin/ui/post-editor-state";
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

test("source save and publish advance unsaved targets without losing localized work or changing saved drafts", () => {
  const model = (locale: BlogPostLocaleModel["locale"]): BlogPostLocaleModel => ({
    locale, revision: 4, templateRevision: locale === "en" ? null : 4,
    published: emptyPostEnvelope("old-category", "old-author"), draft: null,
    working: emptyPostEnvelope("old-category", "old-author"),
  });
  const states = Object.fromEntries((["en", "es", "pt", "fr"] as const).map(locale => [locale, {
    model: model(locale), errors: {}, conflict: false, notice: "",
  }])) as PostWorkspace;
  states.es.model.working.content.title = "Título todavía sin guardar";
  states.es.model.working.content.reading_minutes = 7;
  states.es.model.working.content.cta_url = "https://example.test/es/reservar";
  states.es.model.working.content.body = [{ type: "paragraph", text: "Mi texto local" },
    { type: "cta", label: "Continuar", url: "https://example.test/es/continuar" }];
  states.pt.model.draft = structuredClone(states.pt.model.working);
  states.pt.model.draft.content.title = "Rascunho guardado";
  const savedTarget = states.pt;
  const previousPublic = states.es.model.published;
  const source = emptyPostEnvelope("new-category", "new-author");
  source.content.cover_media_id = "new-cover";
  source.content.related_ids = ["related-post"];
  const savedEn = { ...states.en.model, revision: 5, draft: source, working: source };
  const afterSave = applyPostLocaleResult(states, "en", savedEn, "Saved");
  assert.equal(afterSave.es.model.templateRevision, 5);
  assert.equal(afterSave.es.model.working.content.category_id, "new-category");
  assert.equal(afterSave.es.model.working.content.cover_media_id, "new-cover");
  assert.equal(afterSave.es.model.working.content.title, "Título todavía sin guardar");
  assert.equal(afterSave.es.model.working.content.reading_minutes, 7);
  assert.equal(afterSave.es.model.working.content.cta_url, "https://example.test/es/reservar");
  assert.deepEqual(afterSave.es.model.working.content.body, states.es.model.working.content.body);
  assert.equal(afterSave.es.model.published, previousPublic);
  assert.equal(afterSave.pt, savedTarget);
  const publishedEn = { ...savedEn, revision: 6, draft: null, published: source };
  const afterPublish = applyPostLocaleResult(afterSave, "en", publishedEn, "Published");
  assert.equal(afterPublish.es.model.templateRevision, 6);
  assert.deepEqual(afterPublish.es.model.working, afterSave.es.model.working);
  assert.equal(afterPublish.es.model.published, previousPublic);
  assert.equal(afterPublish.pt, savedTarget);
  assert.equal(afterPublish.pt.model.templateRevision, 4);
});

test("editing a just-published target starts a save-ready draft from current source references without changing its publication", () => {
  const oldTarget = emptyPostEnvelope("old-category", "old-author");
  oldTarget.content.title = "Título traducido";
  oldTarget.content.body = [{ type: "paragraph", text: "Cuerpo traducido" }];
  oldTarget.content.cta_url = "https://example.test/es/reservar";
  oldTarget.content.reading_minutes = 8;
  const latestSource = emptyPostEnvelope("new-category", "new-author");
  latestSource.content.cover_media_id = "new-cover";
  const states = Object.fromEntries((["en", "es", "pt", "fr"] as const).map(locale => [locale, {
    model: { locale, revision: 4, templateRevision: locale === "en" ? null : 2,
      published: null, draft: locale === "en" ? latestSource : oldTarget,
      working: locale === "en" ? latestSource : oldTarget },
    errors: {}, conflict: false, notice: "",
  }])) as PostWorkspace;
  const whileSavedDraft = changePostField(states, "es", "title", "Edición del borrador existente");
  assert.equal(whileSavedDraft.es.model.working.content.category_id, "old-category");
  assert.equal(whileSavedDraft.es.model.templateRevision, 2);
  const targetPublished = { ...states.es.model, revision: 5, draft: null, published: oldTarget, working: oldTarget };
  const afterPublish = applyPostLocaleResult(states, "es", targetPublished, "Published");
  assert.equal(afterPublish.es.model.working, oldTarget);
  const afterEdit = changePostField(afterPublish, "es", "title", "Nueva edición traducida");
  assert.equal(afterEdit.es.model.templateRevision, 4);
  assert.equal(afterEdit.es.model.working.content.category_id, "new-category");
  assert.equal(afterEdit.es.model.working.content.author_id, "new-author");
  assert.equal(afterEdit.es.model.working.content.cover_media_id, "new-cover");
  assert.equal(afterEdit.es.model.working.content.title, "Nueva edición traducida");
  assert.deepEqual(afterEdit.es.model.working.content.body, oldTarget.content.body);
  assert.equal(afterEdit.es.model.working.content.cta_url, oldTarget.content.cta_url);
  assert.equal(afterEdit.es.model.working.content.reading_minutes, 8);
  assert.equal(afterEdit.es.model.published, oldTarget);
  assert.equal(afterEdit.en, states.en);
});
