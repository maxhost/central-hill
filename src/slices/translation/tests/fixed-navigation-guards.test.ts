import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, loadTranslationRows, setSourceContent, setTargetTranslation } from "@core/i18n";
import { approveField, resetField, saveField, clearField, approveEntity, generateEntityDrafts } from "../admin/actions";
import { getEntityTranslations, getTranslationInbox } from "../admin/queries";
import { generateDrafts } from "../server/generate";

const id = randomUUID();
const statId = randomUUID();
const label = "Own legacy Navigation label";
let verified = false;
const navRows = async () => (await loadTranslationRows({ type: "nav_item", id }))
  .sort((a, b) => a.field.localeCompare(b.field) || a.locale.localeCompare(b.locale));
before(async () => {
  assert.equal(new URL(process.env.DATABASE_URL ?? "http://invalid.test").hostname, "propertylocalesqa.local");
  assert.deepEqual((await db.execute(sql`select current_database() as db,current_user as role`)).rows[0], { db: "propertylocalesqa", role: "propertylocalesqa" });
  assert.equal((await navRows()).length, 0);
  assert.equal((await loadTranslationRows({ type: "company_settings", id: statId })).length, 0);
  verified = true;
  await setSourceContent("nav_item", id, { label });
  await setTargetTranslation("nav_item", id, "label", "es", "Own pending navigation label", { sourceValue: label, state: "needs_review" });
});
after(async () => {
  if (!verified) return;
  await deleteContent("nav_item", id);
  await deleteContent("company_settings", statId);
  assert.equal((await navRows()).length, 0);
  assert.equal((await loadTranslationRows({ type: "company_settings", id: statId })).length, 0);
});
test("all generic Navigation mutations and direct generation reject without changing legacy rows", async () => {
  const beforeRows = await navRows();
  const args = ["nav_item", id, "label", "es"] as const;
  for (const result of [
    await approveField(...args), await resetField(...args), await saveField(...args, "Overwrite"),
    await clearField(...args), await approveEntity("nav_item", id), await generateEntityDrafts("nav_item", id, true),
  ]) assert.deepEqual(result, { ok: false, error: "validation" });
  await assert.rejects(generateDrafts("nav_item", id, { overwrite: true }), /Navigation is fixed/);
  assert.deepEqual(await navRows(), beforeRows);
});
test("generic Navigation queries hide historical rows without modifying them", async () => {
  const beforeRows = await navRows();
  assert.equal(await getEntityTranslations("nav_item", id), null);
  const inbox = await getTranslationInbox({ entityType: "nav_item" });
  assert.deepEqual(inbox.items, []);
  assert.deepEqual(inbox.entityTypes, []);
  assert.deepEqual(await navRows(), beforeRows);
});
test("remaining global Settings copy can still be reviewed, approved and generated", async () => {
  const beforeRows = await navRows();
  await setSourceContent("company_settings", statId, { "stats.bookings.label": "Own QA bookings" });
  await setTargetTranslation("company_settings", statId, "stats.bookings.label", "es", "Reservas QA", { sourceValue: "Own QA bookings", state: "needs_review" });
  assert.deepEqual((await getEntityTranslations("company_settings", statId))?.fields.map((field) => field.field), ["stats.bookings.label"]);
  assert.deepEqual(await approveField("company_settings", statId, "stats.bookings.label", "es"), { ok: true });
  assert.equal((await loadTranslationRows({ type: "company_settings", id: statId, locale: "es" }))[0]?.state, "approved");
  const generated = await generateDrafts("company_settings", statId, { locales: ["es"], overwrite: true });
  assert.equal(generated.provider, "identity");
  assert.equal(generated.total, 1);
  assert.deepEqual(await navRows(), beforeRows);
});
