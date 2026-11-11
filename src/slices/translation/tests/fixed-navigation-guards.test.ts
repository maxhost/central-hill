import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, loadTranslationRows, setSourceContent, setTargetTranslation } from "@core/i18n";
import { approveField, resetField, saveField, clearField, approveEntity, generateEntityDrafts } from "../admin/actions";
import { generateDrafts } from "../server/generate";

const id = randomUUID();
const faqId = randomUUID();
const label = "Own legacy Navigation label";
let verified = false;
const navRows = async () => (await loadTranslationRows({ type: "nav_item", id }))
  .sort((a, b) => a.field.localeCompare(b.field) || a.locale.localeCompare(b.locale));
before(async () => {
  assert.equal(new URL(process.env.DATABASE_URL ?? "http://invalid.test").hostname, "translationsretirementunitqa.local");
  assert.deepEqual((await db.execute(sql`select current_database() as db,current_user as role`)).rows[0], { db: "translationsretirementunitqa", role: "translationsretirementunitqa" });
  assert.equal((await navRows()).length, 0);
  assert.equal((await loadTranslationRows({ type: "faq_item", id: faqId })).length, 0);
  verified = true;
  await setSourceContent("nav_item", id, { label });
  await setTargetTranslation("nav_item", id, "label", "es", "Own pending navigation label", { sourceValue: label, state: "needs_review" });
});
after(async () => {
  if (!verified) return;
  await deleteContent("nav_item", id);
  await deleteContent("faq_item", faqId);
  assert.equal((await navRows()).length, 0);
  assert.equal((await loadTranslationRows({ type: "faq_item", id: faqId })).length, 0);
});
test("all generic Navigation mutations and direct generation reject without changing legacy rows", async () => {
  const beforeRows = await navRows();
  const args = ["nav_item", id, "label", "es"] as const;
  for (const result of [
    await approveField(...args), await resetField(...args), await saveField(...args, "Overwrite"),
    await clearField(...args), await approveEntity("nav_item", id), await generateEntityDrafts("nav_item", id, true),
  ]) assert.deepEqual(result, { ok: false, error: "validation" });
  await assert.rejects(generateDrafts("nav_item", id, { overwrite: true }), /workflow is retired/);
  assert.deepEqual(await navRows(), beforeRows);
});
test("retired generic FAQ actions preserve pending copy and unrelated Navigation rows", async () => {
  const beforeNavigation = await navRows();
  await setSourceContent("faq_item", faqId, { question: "Own QA question" });
  await setTargetTranslation("faq_item", faqId, "question", "es", "Pregunta QA", { sourceValue: "Own QA question", state: "needs_review" });
  const beforeFaq = await loadTranslationRows({ type: "faq_item", id: faqId });
  const args = ["faq_item", faqId, "question", "es"] as const;
  for (const result of [
    await approveField(...args), await resetField(...args), await saveField(...args, "Rejected overwrite"),
    await clearField(...args), await approveEntity("faq_item", faqId), await generateEntityDrafts("faq_item", faqId, true),
  ]) assert.deepEqual(result, { ok: false, error: "validation" });
  await assert.rejects(generateDrafts("faq_item", faqId, { locales: ["es"], overwrite: true }), /workflow is retired/);
  assert.deepEqual(await loadTranslationRows({ type: "faq_item", id: faqId }), beforeFaq);
  assert.deepEqual(await navRows(), beforeNavigation);
});
