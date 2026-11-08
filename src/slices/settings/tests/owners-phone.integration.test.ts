import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, loadTranslationRows } from "@core/i18n";
import { company_settings } from "../schema";
import { DEFAULT_GLOBALS } from "../defaults";
import { SITE_ICON_DEFAULTS } from "../site-icons";
import { saveGlobals } from "../admin/actions";
import { getGlobalsForEdit } from "../admin/queries";
import { getGlobals } from "../server/queries";

const EMAIL = "owners-phone-backend@example.invalid";
const INITIAL = "+351 910 438 062";
const CUSTOM = "+351 999 111 222";
const LOCALES = ["en", "es", "pt", "fr"] as const;
let ownId: string | null = null;
let verified = false;
const payload = (overrides: Record<string, unknown> = {}) => ({
  email: EMAIL,
  phone: DEFAULT_GLOBALS.phone,
  whatsapp: DEFAULT_GLOBALS.whatsapp,
  checkin_phone: DEFAULT_GLOBALS.checkinPhone,
  website_url: DEFAULT_GLOBALS.website,
  social: { instagram: null, facebook: null, linkedin: null, youtube: null, tiktok: null },
  stats: structuredClone(DEFAULT_GLOBALS.stats),
  office_address: DEFAULT_GLOBALS.officeAddress,
  office_hours: null,
  office_hours_label: null,
  currency: "EUR",
  default_og_image_media_id: null,
  avantio_account_id: "owners-phone-backend-test",
  avantio_widget_config: {},
  show_building_location: false,
  show_building_count: false,
  site_icons: { ...SITE_ICON_DEFAULTS },
  ...overrides,
});
const rows = () => db.select().from(company_settings);
async function ownRow() {
  const all = await rows();
  assert.equal(all.length, 1, "Refusing writes when another singleton exists");
  const row = all[0];
  assert.ok(row);
  assert.equal(row.id, ownId);
  assert.equal(row.email, EMAIL);
  return row;
}
const neutral = (row: Awaited<ReturnType<typeof ownRow>>) =>
  Object.fromEntries(Object.entries(row).filter(([key]) => !["owners_phone", "updated_at"].includes(key)));
async function save(overrides: Record<string, unknown> = {}) {
  await ownRow();
  const result = await saveGlobals(payload(overrides));
  assert.deepEqual(result, { ok: true });
}
before(async () => {
  assert.equal(new URL(process.env.DATABASE_URL ?? "http://invalid.test").hostname, "propertylocalesqa.local");
  const who = await db.execute(sql`select current_database() as database,current_user as role`);
  assert.deepEqual(who.rows[0], { database: "propertylocalesqa", role: "propertylocalesqa" });
  const column = await db.execute(sql`select column_name from information_schema.columns where table_schema='public'and table_name='company_settings'and column_name='owners_phone'`);
  assert.equal(column.rows.length, 1, "Migration0029 must be applied by root before DB tests");
  assert.equal((await rows()).length, 0, "Refusing to replace or restore existing Settings");
  verified = true;
});
after(async () => {
  if (!verified || !ownId) return;
  // Delete only the new record identified after our successful create; never other globals.
  const [row] = await db.select().from(company_settings).where(eq(company_settings.id, ownId));
  assert.equal(row?.email, EMAIL);
  await db.delete(company_settings).where(eq(company_settings.id, ownId));
  await deleteContent("company_settings", ownId);
  assert.equal((await db.select().from(company_settings).where(eq(company_settings.id, ownId))).length, 0);
  assert.equal((await loadTranslationRows({ type: "company_settings", id: ownId })).length, 0);
});

test("absent singleton scaffolds supplied Owners phone without GET writes", async () => {
  assert.equal((await rows()).length, 0);
  assert.equal((await getGlobalsForEdit()).data.owners_phone, INITIAL);
  for (const locale of LOCALES) assert.equal(await getGlobals(locale), null);
  assert.equal((await rows()).length, 0);
});
test("first legacy-shaped Save obtains the new column default", async () => {
  assert.equal((await rows()).length, 0);
  const result = await saveGlobals(payload());
  const all = await rows();
  assert.equal(all.length, 1);
  assert.equal(all[0]?.email, EMAIL);
  ownId = all[0]?.id ?? null;
  assert.ok(ownId);
  assert.deepEqual(result, { ok: true });
  assert.equal((await ownRow()).owners_phone, INITIAL);
  assert.equal((await getGlobalsForEdit()).data.owners_phone, INITIAL);
  for (const locale of LOCALES) assert.equal((await getGlobals(locale))?.ownersPhone, INITIAL);
});
test("Owners phone Save trims and reloads without changing other contact/config values", async () => {
  const before = neutral(await ownRow());
  await save({ owners_phone: `  ${CUSTOM}  ` });
  assert.equal((await ownRow()).owners_phone, CUSTOM);
  assert.equal((await getGlobalsForEdit()).data.owners_phone, CUSTOM);
  for (const locale of LOCALES) assert.equal((await getGlobals(locale))?.ownersPhone, CUSTOM);
  assert.deepEqual(neutral(await ownRow()), before);
});
test("old clients omitting Owners phone preserve a custom value", async () => {
  const before = neutral(await ownRow());
  await save();
  assert.equal((await ownRow()).owners_phone, CUSTOM);
  for (const locale of LOCALES) assert.equal((await getGlobals(locale))?.ownersPhone, CUSTOM);
  assert.deepEqual(neutral(await ownRow()), before);
});
test("explicit null hides Owners phone and old client omission does not revive default", async () => {
  const before = neutral(await ownRow());
  await save({ owners_phone: null });
  await save();
  assert.equal((await ownRow()).owners_phone, null);
  assert.equal((await getGlobalsForEdit()).data.owners_phone, "");
  for (const locale of LOCALES) assert.equal((await getGlobals(locale))?.ownersPhone, null);
  assert.deepEqual(neutral(await ownRow()), before);
});
test("legacy whitespace reads hidden; invalid new values do not write", async () => {
  const owned = await ownRow();
  await db.update(company_settings).set({ owners_phone: "   " }).where(eq(company_settings.id, owned.id));
  assert.equal((await getGlobalsForEdit()).data.owners_phone, "   ");
  for (const locale of LOCALES) assert.equal((await getGlobals(locale))?.ownersPhone, null);
  const before = await ownRow();
  for (const owners_phone of ["  ", "x".repeat(41)]) {
    const result = await saveGlobals(payload({ owners_phone }));
    assert.equal(result.ok, false);
    if (!result.ok && result.error === "validation") assert.ok(result.fieldErrors.owners_phone);
  }
  assert.deepEqual(await ownRow(), before);
});
