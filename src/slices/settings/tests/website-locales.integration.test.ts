import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, loadTranslationRows, setSourceContent, setTargetTranslation } from "@core/i18n";
import { company_settings } from "../schema";
import { DEFAULT_GLOBALS } from "../defaults";
import { saveGlobals } from "../admin/actions";
import { getGlobalsForEdit } from "../admin/queries";
import { getGlobals } from "../server/queries";

const EMAIL = "website-locales-backend@example.invalid";
const BASE = "https://website.example.invalid/en";
const NEXT = "https://website.example.invalid/english-new?from=settings#office";
const URLS = {
  es: "https://website.example.invalid/es?lang=es#office",
  pt: "https://website.example.invalid/pt",
  fr: "https://website.example.invalid/fr",
};
const LEGACY = "https://stale-website.example.invalid/legacy-en";
const LOCALES = ["en", "es", "pt", "fr"] as const;
let ownId: string | null = null;
let verified = false;
let legacyEnglish: Awaited<ReturnType<typeof loadTranslationRows>> = [];

const payload = (overrides: Record<string, unknown> = {}) => ({
  email: EMAIL,
  phone: DEFAULT_GLOBALS.phone,
  owners_phone: DEFAULT_GLOBALS.ownersPhone,
  whatsapp: DEFAULT_GLOBALS.whatsapp,
  checkin_phone: DEFAULT_GLOBALS.checkinPhone,
  website_url: BASE,
  social: { instagram: null, facebook: null, linkedin: null, youtube: null, tiktok: null },
  stats: structuredClone(DEFAULT_GLOBALS.stats),
  office_address: DEFAULT_GLOBALS.officeAddress,
  office_hours: null,
  office_hours_label: null,
  currency: "EUR",
  default_og_image_media_id: null,
  avantio_account_id: DEFAULT_GLOBALS.avantio.accountId,
  avantio_widget_config: {},
  show_building_location: DEFAULT_GLOBALS.showBuildingLocation,
  show_building_count: DEFAULT_GLOBALS.showBuildingCount,
  site_icons: { ...DEFAULT_GLOBALS.icons },
  ...overrides,
});
const rows = () => db.select().from(company_settings);
async function ownRow() {
  const all = await rows();
  assert.equal(all.length, 1, "Refusing writes if another Settings record appears");
  assert.equal(all[0]?.id, ownId);
  assert.equal(all[0]?.email, EMAIL);
  return all[0]!;
}
const neutral = (row: Awaited<ReturnType<typeof ownRow>>) => Object.fromEntries(
  Object.entries(row).filter(([key]) => !["website_url", "updated_at"].includes(key)),
);
const websiteRows = async () => (await loadTranslationRows({ type: "company_settings", id: ownId! }))
  .filter((row) => row.field === "website_url");
const targetRows = async () => (await websiteRows()).filter((row) => row.locale !== "en");
async function save(overrides: Record<string, unknown> = {}) {
  const before = neutral(await ownRow());
  assert.deepEqual(await saveGlobals(payload(overrides)), { ok: true });
  assert.deepEqual(neutral(await ownRow()), before);
  if (legacyEnglish.length) assert.deepEqual((await websiteRows()).filter((row) => row.locale === "en"), legacyEnglish);
}
async function expectUrls(expected: Record<(typeof LOCALES)[number], string | null>) {
  for (const locale of LOCALES) assert.equal((await getGlobals(locale))?.website, expected[locale], locale);
}
before(async () => {
  assert.equal(new URL(process.env.DATABASE_URL ?? "http://invalid.test").hostname, "propertylocalesqa.local");
  const who = await db.execute(sql`select current_database() as database,current_user as role`);
  assert.deepEqual(who.rows[0], { database: "propertylocalesqa", role: "propertylocalesqa" });
  assert.equal((await rows()).length, 0, "Refusing to replace, delete or restore an existing singleton");
  verified = true;
});
after(async () => {
  if (!verified || !ownId) return;
  const [row] = await db.select().from(company_settings).where(eq(company_settings.id, ownId));
  assert.equal(row?.email, EMAIL, "Refuse cleanup of unrecognized record");
  await db.delete(company_settings).where(eq(company_settings.id, ownId));
  await deleteContent("company_settings", ownId);
  assert.equal((await db.select().from(company_settings).where(eq(company_settings.id, ownId))).length, 0);
  assert.equal((await loadTranslationRows({ type: "company_settings", id: ownId })).length, 0);
});

test("missing Settings scaffolds EN and blank targets without GET writes", async () => {
  const before = await rows();
  const edit = await getGlobalsForEdit();
  assert.equal(edit.data.website_url, DEFAULT_GLOBALS.website);
  assert.deepEqual(edit.data.website_translations, { es: "", pt: "", fr: "" });
  for (const locale of LOCALES) assert.equal(await getGlobals(locale), null);
  assert.deepEqual(await rows(), before);
});
test("legacy-shaped first Save keeps inline EN and creates no Website translation rows", async () => {
  assert.equal((await rows()).length, 0);
  const result = await saveGlobals(payload());
  const all = await rows();
  assert.equal(all.length, 1);
  assert.equal(all[0]?.email, EMAIL);
  ownId = all[0]?.id ?? null;
  assert.ok(ownId);
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(await websiteRows(), []);
  await expectUrls({ en: BASE, es: BASE, pt: BASE, fr: BASE });
});
test("raw pending URLs stay authored while public ignores pending, unsafe and stale EN rows", async () => {
  assert.ok(ownId);
  await setSourceContent("company_settings", ownId, { website_url: LEGACY });
  await setTargetTranslation("company_settings", ownId, "website_url", "es", URLS.es, { sourceValue: BASE, state: "needs_review" });
  await setTargetTranslation("company_settings", ownId, "website_url", "pt", URLS.pt, { sourceValue: BASE, state: "approved" });
  await setTargetTranslation("company_settings", ownId, "website_url", "fr", "javascript:alert(1)", { sourceValue: BASE, state: "approved" });
  legacyEnglish = (await websiteRows()).filter((row) => row.locale === "en");
  const before = await websiteRows();
  const edit = await getGlobalsForEdit();
  assert.equal(edit.data.website_url, BASE);
  assert.deepEqual(edit.data.website_translations, { es: URLS.es, pt: URLS.pt, fr: "javascript:alert(1)" });
  await expectUrls({ en: BASE, es: BASE, pt: URLS.pt, fr: BASE });
  assert.deepEqual(await websiteRows(), before);
});
test("one Save trims and approves target URLs and preserves all non-Website configuration", async () => {
  await save({ website_translations: { es: `  ${URLS.es}  `, pt: URLS.pt, fr: URLS.fr } });
  assert.deepEqual((await getGlobalsForEdit()).data.website_translations, URLS);
  assert.equal((await targetRows()).length, 3);
  assert.ok((await targetRows()).every((row) => row.state === "approved"));
  await expectUrls({ en: BASE, ...URLS });
});
test("EN change with an older payload preserves exact target rows and their public destinations", async () => {
  const before = await targetRows();
  await save({ website_url: NEXT });
  assert.deepEqual(await targetRows(), before);
  await expectUrls({ en: NEXT, ...URLS });
});
test("an explicit empty target removes only that URL and follows current EN", async () => {
  await save({ website_url: NEXT, website_translations: { ...URLS, es: "" } });
  assert.equal((await targetRows()).some((row) => row.locale === "es"), false);
  assert.deepEqual((await getGlobalsForEdit()).data.website_translations, { ...URLS, es: "" });
  await expectUrls({ en: NEXT, es: NEXT, pt: URLS.pt, fr: URLS.fr });
});
test("clearing EN never revives a legacy source URL or erases own targets", async () => {
  const before = await targetRows();
  await save({ website_url: null });
  assert.equal((await getGlobalsForEdit()).data.website_url, "");
  assert.deepEqual(await targetRows(), before);
  await expectUrls({ en: null, es: null, pt: URLS.pt, fr: URLS.fr });
});
test("a language can own a URL with empty EN, and other explicit target clears stay empty", async () => {
  await save({ website_url: null, website_translations: { ...URLS, fr: "" } });
  await expectUrls({ en: null, es: URLS.es, pt: URLS.pt, fr: null });
  assert.equal((await targetRows()).some((row) => row.locale === "fr"), false);
});
test("invalid URLs and incomplete targets reject before changing rows or translations", async () => {
  const before = await ownRow();
  const translations = await loadTranslationRows({ type: "company_settings", id: ownId! });
  for (const overrides of [
    { website_translations: { es: "http://website.example.invalid/es", pt: "", fr: "" } },
    { website_translations: { es: "javascript:alert(1)", pt: "", fr: "" } },
    { website_translations: { es: URLS.es } },
    { website_url: "http://website.example.invalid/en" },
  ]) {
    const result = await saveGlobals(payload(overrides));
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "validation");
  }
  assert.deepEqual(await ownRow(), before);
  assert.deepEqual(await loadTranslationRows({ type: "company_settings", id: ownId! }), translations);
});
