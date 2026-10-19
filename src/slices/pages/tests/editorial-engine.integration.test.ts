import test from "node:test";
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "@core/db/client";
import { translation } from "@core/i18n/schema";
import { page_content, page_locale_content } from "../schema";
import { bootstrapEditorial, editorialModel, legacyEditorialRows, publishEditorialDraft, readEditorialRows, saveEditorialDraft } from "../admin/editorial-store";
import { getPublishedPageLocale } from "../server/editorial-publication";
import { buildingsAdapter } from "../adapters/buildings";
import type { PageEnvelope } from "../editorial-types";
import { assertEditorialTestDatabase } from "./editorial-test-environment";

test("Real Buildings bootstrap retains pending ES and page/language CAS revisions survive publication", async () => {
  await assertEditorialTestDatabase();
  const keys = ["buildings", "owners"];
  const originals = await db.select().from(page_locale_content).where(inArray(page_locale_content.page_key, keys));
  const [source] = await db.select().from(page_content).where(eq(page_content.key, "buildings"));
  assert.ok(source, "Synthetic Buildings fixture required");
  const originalTranslations = await db.select().from(translation).where(eq(translation.entity_id, source.id));
  const actor = "pageeditorsqa-staff";
  try {
    await db.delete(page_locale_content).where(inArray(page_locale_content.page_key, keys));
    await db.insert(translation).values({ entity_type: "page_content", entity_id: source.id, locale: "es", field: "block:seo.meta_title", value: "Pending Buildings ES", state: "draft" })
      .onConflictDoUpdate({ target: [translation.entity_type, translation.entity_id, translation.field, translation.locale], set: { value: "Pending Buildings ES", state: "draft" } });
    const baseline = await legacyEditorialRows("buildings");
    await bootstrapEditorial(actor, "buildings");
    const rows = await readEditorialRows("buildings");
    for (const row of baseline) assert.deepEqual(rows.find(saved => saved.locale === row.locale)?.published, row.published);
    assert.equal(rows.find(row => row.locale === "es")?.draft?.content.seo?.meta_title, "Pending Buildings ES");
    assert.notEqual(rows.find(row => row.locale === "es")?.published?.content.seo?.meta_title, "Pending Buildings ES");
    await bootstrapEditorial(actor, "buildings");
    assert.deepEqual(await readEditorialRows("buildings"), rows, "Bootstrap is idempotent");
    await db.insert(page_locale_content).values({ page_key: "owners", locale: "en", revision: 7 });
    const witness = await db.select().from(page_locale_content).where(eq(page_locale_content.page_key, "owners"));
    const spanish = rows.find(row => row.locale === "es");
    const empty: PageEnvelope<"buildings"> = { schemaVersion: 1, content: buildingsAdapter.defaultContent(), ogImageMediaId: null };
    const model = editorialModel(rows, "en", empty, "buildings");
    model.working.content.hero ??= { image_media_id: "" };
    model.working.content.hero.headline = "Independent Buildings publication";
    const input = { key: "buildings" as const, locale: "en" as const, expectedRevision: model.revision, templateRevision: model.templateRevision, payload: model.working };
    const saves = await Promise.all([saveEditorialDraft(input, actor), saveEditorialDraft(input, actor)]);
    assert.equal(saves.filter(result => result.ok).length, 1);
    const saved = saves.find(result => result.ok)!;
    assert.ok(saved.ok);
    assert.equal((await getPublishedPageLocale("buildings", "en"))?.content.hero?.headline, model.published?.content.hero?.headline, "Draft remains private");
    const published = await publishEditorialDraft({ key: "buildings", locale: "en", expectedRevision: saved.model.revision }, actor);
    assert.ok(published.ok, JSON.stringify(published));
    assert.equal(published.model.draft, null);
    assert.equal(published.model.revision, model.revision + 2);
    assert.equal((await getPublishedPageLocale("buildings", "en"))?.content.hero?.headline, "Independent Buildings publication");
    const stale = await saveEditorialDraft({ ...input, expectedRevision: saved.model.revision }, actor);
    assert.deepEqual(stale, { ok: false, error: "conflict" });
    assert.deepEqual((await readEditorialRows("buildings")).find(row => row.locale === "es"), spanish);
    assert.deepEqual(await db.select().from(page_locale_content).where(eq(page_locale_content.page_key, "owners")), witness);
  } finally {
    await db.delete(page_locale_content).where(inArray(page_locale_content.page_key, keys));
    if (originals.length) await db.insert(page_locale_content).values(originals);
    await db.delete(translation).where(eq(translation.entity_id, source.id));
    if (originalTranslations.length) await db.insert(translation).values(originalTranslations);
  }
});
