import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, loadTranslationRows, setTargetTranslation } from "@core/i18n";
import { company_settings } from "../schema";
import { DEFAULT_GLOBALS } from "../defaults";
import { NAVIGATION_CTA_LOCALES, NAVIGATION_CTAS_FIELD, type NavigationCtasByLocale } from "../navigation-cta-types";
import { defaultNavigationCtas } from "../server/navigation-ctas";
import { saveGlobals } from "../admin/actions";
import { getGlobalsForEdit } from "../admin/queries";
import { getGlobals } from "../server/queries";

const EMAIL = "navigation-ctas-backend@example.invalid";
const authored = (): NavigationCtasByLocale => Object.fromEntries(NAVIGATION_CTA_LOCALES.map((locale) => [locale, {
  book: { label: `Book ${locale}`, url: `https://navigation.example.invalid/${locale}?from=header#book` },
  earn: { label: `Earn ${locale}` },
}])) as NavigationCtasByLocale;
const blank = () => ({ book: { label: "", url: "" }, earn: { label: "" } });
const WEBSITE_TARGETS = { es: "https://website.example.invalid/es", pt: "https://website.example.invalid/pt", fr: "" };
let ownId: string | null = null;
let verified = false;

const payload = (overrides: Record<string, unknown> = {}) => ({
  email: EMAIL,
  phone: DEFAULT_GLOBALS.phone,
  owners_phone: DEFAULT_GLOBALS.ownersPhone,
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
const allTranslations = () => loadTranslationRows({ type: "company_settings", id: ownId! });
const ctaRows = async () => (await allTranslations()).filter((row) => row.field === NAVIGATION_CTAS_FIELD);
const websiteRows = async () => (await allTranslations()).filter((row) => row.field === "website_url");
const neutral = (row: Awaited<ReturnType<typeof ownRow>>) => Object.fromEntries(
  Object.entries(row).filter(([key]) => key !== "updated_at"),
);
async function save(navigation_ctas?: NavigationCtasByLocale) {
  const before = neutral(await ownRow());
  const websites = await websiteRows();
  assert.deepEqual(await saveGlobals(payload(navigation_ctas ? { navigation_ctas } : {})), { ok: true });
  assert.deepEqual(neutral(await ownRow()), before);
  assert.deepEqual(await websiteRows(), websites);
}
async function expectCtas(expected: NavigationCtasByLocale) {
  for (const locale of NAVIGATION_CTA_LOCALES) assert.deepEqual((await getGlobals(locale))?.navigationCtas, expected[locale], locale);
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
  assert.equal(row?.email, EMAIL, "Refuse cleanup of unrecognized Settings");
  await db.delete(company_settings).where(eq(company_settings.id, ownId));
  await deleteContent("company_settings", ownId);
  assert.equal((await rows()).length, 0);
  assert.equal((await allTranslations()).length, 0);
});

test("missing Settings returns current translated CTA scaffolds without GET writes", async () => {
  const edit = await getGlobalsForEdit();
  for (const locale of NAVIGATION_CTA_LOCALES) {
    assert.deepEqual(edit.data.navigation_ctas?.[locale], defaultNavigationCtas(locale));
    assert.equal(await getGlobals(locale), null);
  }
  assert.equal((await rows()).length, 0);
});
test("legacy-shaped first Save keeps default public CTAs and writes no CTA configuration", async () => {
  assert.equal((await rows()).length, 0);
  const result = await saveGlobals(payload({ website_translations: WEBSITE_TARGETS }));
  const all = await rows();
  assert.equal(all.length, 1);
  assert.equal(all[0]?.email, EMAIL);
  ownId = all[0]!.id;
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(await ctaRows(), []);
  for (const locale of NAVIGATION_CTA_LOCALES) {
    assert.deepEqual((await getGlobals(locale))?.navigationCtas, defaultNavigationCtas(locale));
  }
});
test("one Save persists and approves all locale CTAs while neutral config and Website rows stay exact", async () => {
  const input = authored();
  input.es.book.label = `  ${input.es.book.label}  `;
  input.es.book.url = `  ${input.es.book.url}  `;
  input.es.earn.label = `  ${input.es.earn.label}  `;
  await save(input);
  assert.deepEqual((await getGlobalsForEdit()).data.navigation_ctas, authored());
  assert.equal((await ctaRows()).length, 4);
  assert.ok((await ctaRows()).filter((row) => row.locale !== "en").every((row) => row.state === "approved"));
  await expectCtas(authored());
});
test("old clients omitting CTA input preserve exact saved locale rows", async () => {
  const before = await ctaRows();
  await save();
  assert.deepEqual(await ctaRows(), before);
  await expectCtas(authored());
});
test("raw pending target stays editable but public uses English; invalid target URL cannot escape", async () => {
  const input = authored();
  await setTargetTranslation("company_settings", ownId!, NAVIGATION_CTAS_FIELD, "es", JSON.stringify(input.es), {
    sourceValue: JSON.stringify(input.en), state: "needs_review",
  });
  const unsafe = { book: { label: "Own PT label", url: "javascript:alert(1)" }, earn: { label: "Own PT earn" } };
  await setTargetTranslation("company_settings", ownId!, NAVIGATION_CTAS_FIELD, "pt", JSON.stringify(unsafe), {
    sourceValue: JSON.stringify(input.en), state: "approved",
  });
  const before = await ctaRows();
  assert.deepEqual((await getGlobalsForEdit()).data.navigation_ctas?.es, input.es);
  assert.deepEqual((await getGlobalsForEdit()).data.navigation_ctas?.pt, unsafe);
  assert.deepEqual((await getGlobals("es"))?.navigationCtas, input.en);
  assert.deepEqual((await getGlobals("pt"))?.navigationCtas, { book: { label: unsafe.book.label, url: input.en.book.url }, earn: unsafe.earn });
  assert.deepEqual(await ctaRows(), before, "GET must not rewrite pending/invalid values");
});
test("later English changes keep own locale labels/URLs; individual target clears follow English", async () => {
  const input = authored();
  input.en = { book: { label: "New English booking", url: "/book?source=settings#dates" }, earn: { label: "New English owners" } };
  input.es = blank();
  input.pt.book.label = "";
  input.fr.earn.label = "";
  await save(input);
  const expected = structuredClone(input);
  expected.es = input.en;
  expected.pt.book.label = input.en.book.label;
  expected.fr.earn.label = input.en.earn.label;
  await expectCtas(expected);
  assert.deepEqual((await getGlobalsForEdit()).data.navigation_ctas, input, "Form must retain blanks rather than fallback copies");
});
test("invalid URLs, empty English and unexpected Earn URL reject before any DB writes", async () => {
  const before = await ownRow();
  const translations = await allTranslations();
  const badUrl = authored(); badUrl.es.book.url = "//evil.example.invalid";
  const emptyEnglish = authored(); emptyEnglish.en.earn.label = " ";
  const earnUrl = authored(); Object.assign(earnUrl.en.earn, { url: "/owners" });
  const unsafeEnglish = authored(); unsafeEnglish.en.book.url = "http://navigation.example.invalid";
  for (const navigation_ctas of [badUrl, emptyEnglish, earnUrl, unsafeEnglish]) {
    const result = await saveGlobals(payload({ navigation_ctas }));
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "validation");
  }
  assert.deepEqual(await ownRow(), before);
  assert.deepEqual(await allTranslations(), translations);
});
