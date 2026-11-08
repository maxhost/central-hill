import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, loadTranslationRows, setSourceContent, setTargetTranslation } from "@core/i18n";
import { approveField, resetField, saveField, clearField, approveEntity, generateEntityDrafts } from "../admin/actions";
import { getEntityTranslations, getTranslationInbox } from "../admin/queries";
import { generateDrafts } from "../server/generate";

test("all individual Settings translation actions reject manually owned and retired fields", async () => {
  const id = "e8510000-0000-4000-8000-000000000099";
  for (const field of ["website_url", "navigation_ctas", "office_hours_label", "stats.bookings.label"]) {
    const args = ["company_settings", id, field, "es"] as const;
    for (const result of [await approveField(...args), await resetField(...args), await saveField(...args, "Overwrite"), await clearField(...args)])
      assert.deepEqual(result, { ok: false, error: "validation" });
  }
});
test("Settings bulk approval, generation and review retire without modifying legacy translations", async () => {
  assert.equal(new URL(process.env.DATABASE_URL ?? "http://invalid.test").hostname, "propertylocalesqa.local");
  assert.deepEqual((await db.execute(sql`select current_database()as db,current_user as role`)).rows[0], { db: "propertylocalesqa", role: "propertylocalesqa" });
  const id = randomUUID(), type = "company_settings";
  const rows = () => loadTranslationRows({ type, id });
  assert.equal((await rows()).length, 0);
  try {
    const fields = { website_url: "https://legacy.example.invalid/en", navigation_ctas: "Own legacy JSON", office_hours_label: "Own office hours", "stats.bookings.label": "Own legacy stat" };
    await setSourceContent(type, id, fields);
    for (const [field, value] of Object.entries(fields)) await setTargetTranslation(type, id, field, "es", "Own pending " + value, { sourceValue: value, state: "needs_review" });
    const before = await rows();
    assert.deepEqual(await approveEntity(type, id), { ok: false, error: "validation" });
    assert.deepEqual(await generateEntityDrafts(type, id, true), { ok: false, error: "validation" });
    await assert.rejects(generateDrafts(type, id, { locales: ["es"], overwrite: true }), /edited in Settings/);
    assert.equal(await getEntityTranslations(type, id), null);
    const inbox = await getTranslationInbox({ entityType: type });
    assert.deepEqual(inbox.items, []);
    assert.deepEqual(inbox.entityTypes, []);
    assert.deepEqual(await rows(), before);
  } finally { await deleteContent(type, id); assert.equal((await rows()).length, 0); }
});
