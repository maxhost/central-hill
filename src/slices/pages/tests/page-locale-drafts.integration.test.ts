import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { page_content, page_locale_content } from "../schema";
import { homeSchema } from "../schemas/home";
import { normalizeHome } from "../home-content";
import { applyDefaults, describe } from "../admin/form-model";
import { bootstrapEditorial, editorialModel, legacyEditorialRows, publishEditorialDraft, readEditorialRows, saveEditorialDraft } from "../admin/editorial-store";
import { getPublishedPageLocale, resolveEditorialEnvelope } from "../server/editorial-publication";
import type { PageEnvelope, PageLocaleEditorialModel, PageEditorialResult } from "../editorial-types";
import { assertEditorialTestDatabase } from "./editorial-test-environment";
const actor = "pageeditorsqa-staff";
let originals: typeof page_locale_content.$inferSelect[];
let legacy: typeof page_content.$inferSelect | undefined;
let empty: PageEnvelope;
function success(result: PageEditorialResult): PageLocaleEditorialModel { assert.equal(result.ok, true, JSON.stringify(result)); if (!result.ok) throw Error("Mutation failed"); return result.model; }
async function model(locale: "en" | "es") { return editorialModel(await readEditorialRows(), locale, empty); }
async function save(current: PageLocaleEditorialModel, payload = current.working) { return saveEditorialDraft({ key: "home", locale: current.locale, expectedRevision: current.revision, templateRevision: current.templateRevision, payload }, actor); }
async function publish(current: PageLocaleEditorialModel) { return publishEditorialDraft({ key: "home", locale: current.locale, expectedRevision: current.revision }, actor); }
before(async () => {
  await assertEditorialTestDatabase();
  originals = await db.select().from(page_locale_content).where(eq(page_locale_content.page_key, "home"));
  [legacy] = await db.select().from(page_content).where(eq(page_content.key, "home")).limit(1);
  assert.ok(legacy, "Synthetic Home fixture required");
  const content = normalizeHome(applyDefaults(describe(homeSchema), {}) as PageEnvelope["content"]);
  content.guests_pitch.benefits.forEach(item => item.icon_key = "check");
  content.services_carousel.assurances.forEach(item => item.icon_key = "check");
  content.hero.cta_primary.url = "https://example.test/booking";
  content.guests_pitch.cta.url = "https://example.test/stays";
  content.hero.headline = "Baseline Home";
  empty = { schemaVersion: 1, content, ogImageMediaId: null };
  await db.update(page_content).set({ data: content, og_image_media_id: null }).where(eq(page_content.key, "home"));
  await db.delete(page_locale_content).where(eq(page_locale_content.page_key, "home"));
});
after(async () => {
  if (!originals) return;
  await db.delete(page_locale_content).where(eq(page_locale_content.page_key, "home"));
  if (originals.length) await db.insert(page_locale_content).values(originals);
  if (legacy) await db.update(page_content).set({ data: legacy.data, og_image_media_id: legacy.og_image_media_id, updated_at: legacy.updated_at }).where(eq(page_content.key, "home"));
});

test("Bootstrap freezes all four legacy publications and preserves unpublished ES SEO as draft", async () => {
  const baseline = await legacyEditorialRows();
  const es = baseline.find(row => row.locale === "es")!;
  assert.equal(es.draft?.content.seo?.meta_title, "Legacy unpublished SEO ES");
  assert.notEqual(es.published?.content.seo?.meta_title, "Legacy unpublished SEO ES");
  await bootstrapEditorial(actor);
  const persisted = await readEditorialRows();
  assert.equal(persisted.length, 4);
  for (const row of baseline) assert.deepEqual(persisted.find(saved => saved.locale === row.locale)?.published, row.published);
  await bootstrapEditorial(actor);
  assert.deepEqual(await readEditorialRows(), persisted);
});
test("EN save survives reload without altering public Home", async () => {
  const before = await getPublishedPageLocale("home", "en");
  const current = await model("en");
  current.working.content.hero.headline = "Saved draft EN";
  const saved = success(await save(current));
  assert.equal((await model("en")).draft?.content.hero.headline, "Saved draft EN");
  assert.equal(saved.revision, current.revision + 1);
  assert.deepEqual(await getPublishedPageLocale("home", "en"), before);
});
test("ES SEO saves with blank EN SEO and stays private", async () => {
  const current = await model("es");
  assert.equal((await model("en")).working.content.seo?.meta_title ?? "", "");
  current.working.content.seo = { meta_title: "Título ES", meta_description: "Descripción ES" };
  success(await save(current));
  assert.equal((await model("es")).draft?.content.seo?.meta_title, "Título ES");
  assert.notEqual((await getPublishedPageLocale("home", "es"))?.content.seo?.meta_title, "Título ES");
});
test("Publishing EN clears only EN; ES continues and publishes independently with identical preview", async () => {
  const esBefore = (await readEditorialRows()).find(row => row.locale === "es");
  const current = await model("en");
  const preview = await resolveEditorialEnvelope(current.draft, "en");
  const result = success(await publish(current));
  assert.equal(result.draft, null);
  assert.deepEqual(await getPublishedPageLocale("home", "en"), preview);
  assert.deepEqual((await readEditorialRows()).find(row => row.locale === "es"), esBefore);
  const es = await model("es"); es.working.content.hero.headline = "Continuar ES";
  const saved = success(await save(es));
  const esPreview = await resolveEditorialEnvelope(saved.draft, "es");
  success(await publish(saved));
  assert.deepEqual(await getPublishedPageLocale("home", "es"), esPreview);
  assert.equal((await model("en")).published?.content.hero.headline, "Saved draft EN");
});
test("Invalid publication and missing media preserve DB draft and published snapshots", async () => {
  const current = await model("en"); current.working.content.hero.cta_primary.url = "";
  const saved = success(await save(current));
  const before = await readEditorialRows();
  const invalid = await publish(saved); assert.equal(invalid.ok, false); if (!invalid.ok) assert.equal(invalid.error, "validation");
  assert.deepEqual(await readEditorialRows(), before);
  saved.working.content.hero.cta_primary.url = "https://example.test/booking";
  saved.working.content.hero.poster_media_id = "46d4b557-b1f1-4ac2-96b3-a32004b68283";
  const withMedia = success(await save(saved));
  const beforeMedia = await readEditorialRows();
  // QA fixture simulates an uploaded asset whose MIME is no longer supported.
  await db.execute(sql`update media_asset set mime='application/pdf' where id='46d4b557-b1f1-4ac2-96b3-a32004b68283'`);
  try {
    const missing = await publish(withMedia); assert.equal(missing.ok, false); if (!missing.ok) assert.equal(missing.error, "validation");
    assert.deepEqual(await readEditorialRows(), beforeMedia);
  } finally {
    await db.execute(sql`update media_asset set mime='image/png' where id='46d4b557-b1f1-4ac2-96b3-a32004b68283'`);
  }
});
test("Concurrent revisions and publish deletion reject stale saves; first targets guard EN template", async () => {
  const current = await model("en"); current.working.content.hero.cta_primary.url = "https://example.test/booking";
  const results = await Promise.all([save(current), save(current)]);
  assert.equal(results.filter(result => result.ok).length, 1);
  const saved = success(results.find(result => result.ok)!);
  const target = await model("es");
  const published = success(await publish(saved));
  assert.equal(published.revision, saved.revision + 1);
  const stale = await save(saved); assert.deepEqual(stale, { ok: false, error: "conflict" });
  assert.equal((await model("en")).draft, null);
  assert.deepEqual(await save(target), { ok: false, error: "conflict" });
});

test("Home legacy translation generation is blocked before any stored translation changes", async () => {
  const { getPageEditorialRedirect } = await import("../server/editorial-translation-policy");
  const { generateDrafts } = await import("@slices/translation/contract");
  const { loadTranslationRows } = await import("@core/i18n");
  assert.ok(legacy);
  const before = await loadTranslationRows({ type: "page_content", id: legacy.id });
  assert.equal(await getPageEditorialRedirect("page_content", legacy.id), "/admin/pages/home");
  assert.equal(await getPageEditorialRedirect("building", legacy.id), null);
  await assert.rejects(generateDrafts("page_content", legacy.id), /page editor/);
  assert.deepEqual(await loadTranslationRows({ type: "page_content", id: legacy.id }), before);
});
