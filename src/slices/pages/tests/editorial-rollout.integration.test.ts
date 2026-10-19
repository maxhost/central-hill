import test from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { translation } from "@core/i18n/schema";
import { page_content, page_locale_content } from "../schema";
import { assertEditorialTestDatabase } from "./editorial-test-environment";
import { blogAdapter } from "../adapters/blog";
import { bootstrapEditorial, editorialModel, legacyEditorialRows, publishEditorialDraft, readEditorialRows, saveEditorialDraft } from "../admin/editorial-store";
import { getPublishedPageLocale } from "../server/editorial-publication";
import type { PageEnvelope } from "../editorial-types";

test("Blog adopts legacy privately and publishes EN/ES with independent persistent revisions and layout scope", async () => {
  await assertEditorialTestDatabase();
  const [source] = await db.select().from(page_content).where(eq(page_content.key, "blog"));
  assert.ok(source);
  const originals = await db.select().from(page_locale_content).where(eq(page_locale_content.page_key, "blog"));
  const translations = await db.select().from(translation).where(eq(translation.entity_id, source.id));
  const witness = await db.select().from(page_locale_content).where(eq(page_locale_content.page_key, "about"));
  const actor = "pageeditors2qa-staff";
  try {
    await db.delete(page_locale_content).where(eq(page_locale_content.page_key, "blog"));
    const data = blogAdapter.defaultContent();
    data.hero!.headline = "";
    await db.update(page_content).set({ data }).where(eq(page_content.id, source.id));
    await db.insert(translation).values([
      { entity_type: "page_content", entity_id: source.id, field: "block:hero.headline", locale: "es", value: "Stale legacy headline", state: "approved" },
      { entity_type: "page_content", entity_id: source.id, field: "block:seo.meta_title", locale: "es", value: "Pending Spanish SEO", state: "draft" },
    ]).onConflictDoUpdate({ target: [translation.entity_type, translation.entity_id, translation.field, translation.locale], set: { value: "Pending Spanish SEO", state: "draft" } });
    const baseline = await legacyEditorialRows("blog");
    assert.equal(baseline.find(row => row.locale === "es")?.published?.content.hero?.headline, "");
    assert.equal(baseline.find(row => row.locale === "es")?.draft?.content.seo?.meta_title, "Pending Spanish SEO");
    await bootstrapEditorial(actor, "blog");
    const rows = await readEditorialRows("blog");
    for (const row of baseline) assert.deepEqual(rows.find(saved => saved.locale === row.locale)?.published, row.published);
    const empty: PageEnvelope<"blog"> = { schemaVersion: 1, content: data, ogImageMediaId: null };
    const en = editorialModel(rows, "en", empty, "blog");
    en.working.content.hero!.headline = "Published English Journal";
    const saved = await saveEditorialDraft({ key: "blog", locale: "en", expectedRevision: 0, templateRevision: null, payload: en.working }, actor);
    assert.ok(saved.ok, JSON.stringify(saved));
    assert.notEqual((await getPublishedPageLocale("blog", "en"))?.content.hero?.headline, "Published English Journal");
    const esBefore = rows.find(row => row.locale === "es");
    const published = await publishEditorialDraft({ key: "blog", locale: "en", expectedRevision: saved.model.revision }, actor);
    assert.ok(published.ok, JSON.stringify(published));
    assert.equal(published.model.revision, 2);
    assert.equal(published.model.draft, null);
    assert.equal((await getPublishedPageLocale("blog", "en"))?.content.hero?.headline, "Published English Journal");
    assert.deepEqual((await readEditorialRows("blog")).find(row => row.locale === "es"), esBefore);
    const es = editorialModel(await readEditorialRows("blog"), "es", empty, "blog");
    es.working.content.seo!.meta_title = "Spanish editorial SEO";
    const esSaved = await saveEditorialDraft({ key: "blog", locale: "es", expectedRevision: es.revision, templateRevision: es.templateRevision, payload: es.working }, actor);
    assert.ok(esSaved.ok, JSON.stringify(esSaved));
    assert.ok((await publishEditorialDraft({ key: "blog", locale: "es", expectedRevision: esSaved.model.revision }, actor)).ok);
    assert.equal((await getPublishedPageLocale("blog", "es"))?.content.seo?.meta_title, "Spanish editorial SEO");
    assert.equal(blogAdapter.publicationScope, "layout");
    assert.deepEqual(await db.select().from(page_locale_content).where(eq(page_locale_content.page_key, "about")), witness);
  } finally {
    await db.delete(page_locale_content).where(eq(page_locale_content.page_key, "blog"));
    if (originals.length) await db.insert(page_locale_content).values(originals);
    await db.update(page_content).set({ data: source.data }).where(eq(page_content.id, source.id));
    await db.delete(translation).where(eq(translation.entity_id, source.id));
    if (translations.length) await db.insert(translation).values(translations);
  }
});
