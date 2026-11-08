import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, loadTranslationRows } from "@core/i18n";
import { saveOwnerMediaAlts } from "@core/media/owner-alt-write";
import { rawOwnerMediaAlts, resolveOwnerMediaAlt } from "@core/media/owner-alt";
import { ownersAdapter } from "../adapters/owners";
import type { PageEnvelope, PageEditorialResult, PageLocaleEditorialModel } from "../editorial-types";
import { editorialModel, readEditorialRows, saveEditorialDraft, publishEditorialDraft } from "../admin/editorial-store";
import { getPublishedPageLocale } from "../server/editorial-publication";
import { page_content, page_locale_content } from "../schema";

const ROOT = "e8640000-0000-4000-8000-000000000001";
const OWNER = "e8640000-0000-4000-8000-000000000002";
const IMAGE = "d3000000-0000-4000-8000-000000000001";
const OTHER = "27dcf4ab-bdc3-4b24-8673-172807ef5915";
let owned = false;
let verified = false;
const actor = "image-alt-root-test";
function baseline(): PageEnvelope<"owners"> {
  const content = ownersAdapter.defaultContent();
  content.why.cta_primary.url = "https://example.test/primary";
  content.why.cta_secondary.url = "https://example.test/secondary";
  content.services.cta.url = "https://example.test/services";
  content.dashboard.cta.url = "https://example.test/dashboard";
  if (content.plans.helpers[0]?.cta) content.plans.helpers[0].cta.url = "https://example.test/helper";
  content.plans.tiers[0]!.commission = "12%";
  content.hero.headline = "Image ALT synthetic page";
  content.hero.image_media_id = IMAGE;
  ownersAdapter.publishSchema.parse(content);
  return { schemaVersion: 1, content, ogImageMediaId: IMAGE };
}
function success(result: PageEditorialResult<"owners">): PageLocaleEditorialModel<"owners"> {
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw Error("Mutation failed");
  return result.model;
}
const model = async (locale: "en" | "es") => editorialModel(await readEditorialRows("owners"), locale, baseline(), "owners");
async function save(locale: "en" | "es", payload: PageEnvelope<"owners">) {
  const current = await model(locale);
  return success(await saveEditorialDraft({ key: "owners", locale, expectedRevision: current.revision, templateRevision: current.templateRevision, payload }, actor));
}
async function publish(locale: "en" | "es") {
  const current = await model(locale);
  return success(await publishEditorialDraft({ key: "owners", locale, expectedRevision: current.revision }, actor));
}
before(async () => {
  assert.equal(new URL(process.env.DATABASE_URL ?? "").hostname, "propertylocalesqa.local");
  const who = await db.execute(sql`select current_database()as db,current_user as role`);
  assert.deepEqual(who.rows[0], { db: "propertylocalesqa", role: "propertylocalesqa" });
  verified = true;
  assert.equal((await db.select().from(page_content).where(eq(page_content.key, "owners"))).length, 0, "Never replace existing Owners page");
  assert.equal((await db.select().from(page_locale_content).where(eq(page_locale_content.page_key, "owners"))).length, 0);
  assert.deepEqual(await loadTranslationRows({ type: "company_settings", id: OWNER }), [], "Own owner fixture must be absent");
  await db.insert(page_content).values({ id: ROOT, key: "owners", data: baseline().content });
  owned = true;
});
after(async () => {
  if (!verified || !owned) return;
  const rows = await db.select().from(page_content).where(eq(page_content.key, "owners"));
  assert.equal(rows[0]?.id, ROOT, "Never clean a foreign fixed Page");
  await db.delete(page_locale_content).where(eq(page_locale_content.page_key, "owners"));
  await db.delete(page_content).where(and(eq(page_content.id, ROOT), eq(page_content.key, "owners")));
  await deleteContent("company_settings", OWNER);
});
test("Page ALT persists per-language draft/publication without changing media or another publication", async () => {
  const before = await getPublishedPageLocale("owners", "en");
  const en = (await model("en")).working;
  en.ogImageMediaId = IMAGE;
  en.mediaAlts = { [IMAGE]: "English courtyard" };
  await save("en", en);
  assert.equal((await getPublishedPageLocale("owners", "en"))?.media[IMAGE]?.alt, before?.media[IMAGE]?.alt, "Draft is private");
  await publish("en");
  assert.equal((await getPublishedPageLocale("owners", "en"))?.ogImage?.alt, "English courtyard");
  const es = (await model("es")).working;
  assert.equal(es.mediaAlts?.[IMAGE], "English courtyard");
  es.mediaAlts = { [IMAGE]: "Patio español" };
  await save("es", es); await publish("es");
  assert.equal((await getPublishedPageLocale("owners", "es"))?.media[IMAGE]?.alt, "Patio español");
  const next = (await model("en")).working; next.mediaAlts = { [IMAGE]: "New English courtyard" };
  await save("en", next); await publish("en");
  assert.equal((await getPublishedPageLocale("owners", "es"))?.ogImage?.alt, "Patio español");
  const draft = (await model("es")).working; draft.mediaAlts = { [IMAGE]: "Borrador privado" };
  await save("es", draft);
  assert.equal((await getPublishedPageLocale("owners", "es"))?.media[IMAGE]?.alt, "Patio español");
  await publish("es");
  assert.equal((await getPublishedPageLocale("owners", "es"))?.ogImage?.alt, "Borrador privado");
  const changedPhoto = (await model("es")).working; changedPhoto.ogImageMediaId = OTHER;
  const current = await model("es");
  assert.equal((await saveEditorialDraft({ key: "owners", locale: "es", expectedRevision: current.revision, templateRevision: current.templateRevision, payload: changedPhoto }, actor)).ok, false, "ALT does not bypass shared image guard");
});
test("owner ALT storage preserves own targets across EN changes and clears, old omission, and other image identity", async () => {
  await saveOwnerMediaAlts("company_settings", OWNER, IMAGE, { en: "English", es: "Español", pt: "", fr: "Français" }, actor);
  let rows = await loadTranslationRows({ type: "company_settings", id: OWNER });
  assert.deepEqual(rawOwnerMediaAlts(rows, IMAGE), { en: "English", es: "Español", pt: "", fr: "Français" });
  assert.equal(resolveOwnerMediaAlt(rows, IMAGE, "pt", "Legacy"), "English");
  await saveOwnerMediaAlts("company_settings", OWNER, IMAGE, undefined, actor);
  assert.deepEqual(await loadTranslationRows({ type: "company_settings", id: OWNER }), rows, "Omitted payload preserves exact rows");
  await saveOwnerMediaAlts("company_settings", OWNER, IMAGE, { en: "", es: "Español", pt: "", fr: "Français" }, actor);
  rows = await loadTranslationRows({ type: "company_settings", id: OWNER });
  assert.equal(resolveOwnerMediaAlt(rows, IMAGE, "es", "Legacy"), "Español");
  assert.equal(resolveOwnerMediaAlt(rows, IMAGE, "pt", "Legacy"), "Legacy");
  assert.equal(resolveOwnerMediaAlt(rows, OTHER, "es", "Other photo"), "Other photo");
  const original = rows;
  await saveOwnerMediaAlts("company_settings", OWNER, OTHER, { en: "Other English", es: "", pt: "Outra", fr: "" }, actor);
  rows = await loadTranslationRows({ type: "company_settings", id: OWNER });
  assert.deepEqual(rows.filter(row => row.field.endsWith(IMAGE)), original, "Replacing photo preserves historical descriptions");
});
