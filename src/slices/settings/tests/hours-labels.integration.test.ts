import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, loadTranslationRows, setSourceContent, setTargetTranslation } from "@core/i18n";
import { company_settings } from "../schema";
import { DEFAULT_GLOBALS } from "../defaults";
import { EDITABLE_SITE_ICON_KEYS } from "../site-icons";
import { OFFICE_HOURS_DEFAULT_LABELS } from "../hours-label-types";
import { saveGlobals } from "../admin/actions";
import { getGlobalsForEdit } from "../admin/queries";
import { getGlobals } from "../server/queries";

const EMAIL = "hours-cleanup-backend@example.invalid";
const TYPE = "company_settings";
const SOURCE = "Canonical English hours";
const LEGACY_SOURCE = "Preserved historical source";
const SCHEDULE = "09:30 – 18:00";
const LABELS = { es: "Horario propio", pt: "Horário próprio", fr: "Horaires propres" };
const LOCALES = ["en", "es", "pt", "fr"] as const;
let ownId: string | null = null;
let verified = false;
let protectedLegacy: unknown;
let protectedTranslations: Awaited<ReturnType<typeof loadTranslationRows>> = [];
const all = () => db.select().from(company_settings);
const activeIcons = (icons: Record<string, string> = DEFAULT_GLOBALS.icons) =>
  Object.fromEntries(EDITABLE_SITE_ICON_KEYS.map((key) => [key, icons[key]]));
async function ownRow() {
  const rows = await all();
  assert.equal(rows.length, 1, "Refusing writes if another singleton appears");
  const row = rows[0];
  assert.equal(row?.id, ownId);
  assert.equal(row?.email, EMAIL, "Refusing writes or cleanup of unrecognized content");
  return row!;
}
const legacy = (row: Awaited<ReturnType<typeof ownRow>>) => ({
  stats: row.stats,
  avantio_account_id: row.avantio_account_id,
  avantio_widget_config: row.avantio_widget_config,
  show_building_location: row.show_building_location,
  show_building_count: row.show_building_count,
  retiredIcons: Object.fromEntries(Object.entries(row.site_icons).filter(([key]) => !(EDITABLE_SITE_ICON_KEYS as readonly string[]).includes(key))),
});
const rows = () => loadTranslationRows({ type: TYPE, id: ownId! });
const hours = async () => (await rows()).filter(row => row.field === "office_hours_label");
const targets = async () => (await hours()).filter(row => row.locale !== "en");
const legacyRows = async () => (await rows()).filter(row => row.field.startsWith("stats.") || (row.field === "office_hours_label" && row.locale === "en"));
function payload(overrides: Record<string, unknown> = {}, current?: Awaited<ReturnType<typeof ownRow>>) {
  return {
    email: EMAIL,
    phone: DEFAULT_GLOBALS.phone,
    owners_phone: DEFAULT_GLOBALS.ownersPhone,
    whatsapp: DEFAULT_GLOBALS.whatsapp,
    checkin_phone: DEFAULT_GLOBALS.checkinPhone,
    website_url: DEFAULT_GLOBALS.website,
    social: { instagram: null, facebook: null, linkedin: null, youtube: null, tiktok: null },
    office_address: DEFAULT_GLOBALS.officeAddress,
    office_hours: current ? current.office_hours : SCHEDULE,
    office_hours_label: current ? current.office_hours_label : SOURCE,
    currency: "EUR",
    default_og_image_media_id: null,
    site_icons: activeIcons(current?.site_icons),
    ...overrides,
  };
}
async function save(overrides: Record<string, unknown> = {}) {
  const current = await ownRow();
  assert.deepEqual(await saveGlobals(payload(overrides, current)), { ok: true });
  if (protectedLegacy) assert.deepEqual(legacy(await ownRow()), protectedLegacy);
  if (protectedTranslations.length) assert.deepEqual(await legacyRows(), protectedTranslations);
}
async function expectLabels(expected: Record<(typeof LOCALES)[number], string>) {
  for (const locale of LOCALES) {
    const globals = await getGlobals(locale);
    assert.equal(globals?.officeHoursLabel, expected[locale], locale);
    assert.equal(globals?.officeHours, SCHEDULE, "Shared authored schedule remains exact");
  }
}
before(async () => {
  assert.equal(new URL(process.env.DATABASE_URL ?? "http://invalid.test").hostname, "propertylocalesqa.local");
  const who = await db.execute(sql`select current_database() as db,current_user as role`);
  assert.deepEqual(who.rows[0], { db: "propertylocalesqa", role: "propertylocalesqa" });
  assert.equal((await all()).length, 0, "Refusing to replace, delete or restore existing Settings");
  verified = true;
});
after(async () => {
  if (!verified || !ownId) return;
  await ownRow();
  await db.delete(company_settings).where(eq(company_settings.id, ownId));
  await deleteContent(TYPE, ownId);
  assert.equal((await all()).length, 0);
  assert.equal((await rows()).length, 0);
});

test("missing Settings has raw blank target labels and GET never initializes rows", async () => {
  const beforeRows = await all();
  const edit = await getGlobalsForEdit();
  assert.equal(edit.data.office_hours_label, "");
  assert.deepEqual(edit.data.office_hours_translations, { es: "", pt: "", fr: "" });
  for (const locale of LOCALES) assert.equal(await getGlobals(locale), null);
  assert.deepEqual(await all(), beforeRows);
});
test("active-only first Save supplies real internal defaults and ignores retired junk", async () => {
  assert.equal((await all()).length, 0);
  const result = await saveGlobals(payload({ stats: "ignored", avantio_account_id: "", avantio_widget_config: "{broken", show_building_location: "ignored", show_building_count: true }));
  const created = await all();
  assert.equal(created.length, 1);
  assert.equal(created[0]?.email, EMAIL);
  ownId = created[0]?.id ?? null;
  assert.ok(ownId);
  assert.deepEqual(result, { ok: true });
  const row = await ownRow();
  assert.deepEqual(row.stats, DEFAULT_GLOBALS.stats);
  assert.equal(row.avantio_account_id, DEFAULT_GLOBALS.avantio.accountId);
  assert.equal(row.avantio_account_id, "bk_centralhill");
  assert.deepEqual(row.avantio_widget_config, DEFAULT_GLOBALS.avantio.widgetConfig);
  assert.equal(row.show_building_location, DEFAULT_GLOBALS.showBuildingLocation);
  assert.equal(row.show_building_count, DEFAULT_GLOBALS.showBuildingCount);
  assert.deepEqual(await rows(), [], "Do not materialize retired source labels or a mirrored EN label");
  await expectLabels({ en: SOURCE, es: SOURCE, pt: SOURCE, fr: SOURCE });
});
test("raw pending labels remain editable while inline EN and approved valid targets govern public output", async () => {
  const current = await ownRow();
  await db.update(company_settings).set({
    stats: { bookings: { value: "431", label: "Stored retired label" }, future: { value: "29", label: "Legacy extra" } },
    avantio_account_id: "preserved-legacy-account",
    avantio_widget_config: { nested: { preserve: true }, legacy: [1, 2] },
    show_building_location: true,
    show_building_count: true,
    site_icons: { ...current.site_icons, services_how_1: "calendar", services_how_2: "mail", services_how_3: "user", legacy_custom: "preserve-unknown-entry" },
  }).where(eq(company_settings.id, ownId!));
  await setSourceContent(TYPE, ownId!, { "stats.bookings.label": "Legacy stat source", office_hours_label: LEGACY_SOURCE });
  await setTargetTranslation(TYPE, ownId!, "stats.bookings.label", "es", "Legacy pending stat", { sourceValue: "Legacy stat source", state: "needs_review" });
  await setTargetTranslation(TYPE, ownId!, "office_hours_label", "es", LABELS.es, { sourceValue: SOURCE, state: "needs_review" });
  await setTargetTranslation(TYPE, ownId!, "office_hours_label", "pt", LABELS.pt, { sourceValue: SOURCE, state: "approved" });
  await setTargetTranslation(TYPE, ownId!, "office_hours_label", "fr", "x".repeat(121), { sourceValue: SOURCE, state: "approved" });
  protectedLegacy = legacy(await ownRow());
  protectedTranslations = await legacyRows();
  const beforeRows = await rows();
  const edit = await getGlobalsForEdit();
  assert.equal(edit.data.office_hours_label, SOURCE, "Do not revive legacy EN translation over canonical inline label");
  assert.deepEqual(edit.data.office_hours_translations, { es: LABELS.es, pt: LABELS.pt, fr: "x".repeat(121) });
  await expectLabels({ en: SOURCE, es: SOURCE, pt: LABELS.pt, fr: SOURCE });
  assert.deepEqual(await rows(), beforeRows);
});
test("manual Save approves trimmed labels and merges active icons without changing hidden values", async () => {
  const current = await ownRow();
  await save({
    office_hours_translations: { es: ` ${LABELS.es} `, pt: LABELS.pt, fr: LABELS.fr },
    site_icons: { ...activeIcons(current.site_icons), account: "mail", services_how_1: "not-an-icon", legacy_custom: "attempted overwrite" },
    stats: { dangerous: "ignored" }, avantio_account_id: null, avantio_widget_config: false,
    show_building_location: false, show_building_count: false,
  });
  assert.deepEqual((await getGlobalsForEdit()).data.office_hours_translations, LABELS);
  assert.ok((await targets()).every(row => row.state === "approved"));
  assert.equal((await ownRow()).site_icons.account, "mail");
  assert.equal((await getGlobals("en"))?.icons.account, "mail");
  await expectLabels({ en: SOURCE, ...LABELS });
});
test("later English changes with old omitted target payload preserve exact authored targets", async () => {
  const beforeRows = await targets();
  await save({ office_hours_label: "Updated English label" });
  assert.deepEqual(await targets(), beforeRows);
  await expectLabels({ en: "Updated English label", ...LABELS });
});
test("clearing one target follows current English while own other languages stay independent", async () => {
  await save({ office_hours_translations: { ...LABELS, es: "" } });
  assert.equal((await targets()).some(row => row.locale === "es"), false);
  assert.deepEqual((await getGlobalsForEdit()).data.office_hours_translations, { ...LABELS, es: "" });
  await expectLabels({ en: "Updated English label", es: "Updated English label", pt: LABELS.pt, fr: LABELS.fr });
});
test("empty English keeps own targets, uses language defaults and never revives legacy EN rows", async () => {
  const beforeRows = await targets();
  await save({ office_hours_label: null });
  await save({ stats: [], avantio_widget_config: "not JSON" });
  assert.equal((await getGlobalsForEdit()).data.office_hours_label, "");
  assert.deepEqual(await targets(), beforeRows);
  await expectLabels({ en: OFFICE_HOURS_DEFAULT_LABELS.en, es: OFFICE_HOURS_DEFAULT_LABELS.es, pt: LABELS.pt, fr: LABELS.fr });
  await save({ office_hours_translations: LABELS });
  await expectLabels({ en: OFFICE_HOURS_DEFAULT_LABELS.en, ...LABELS });
});
test("invalid active labels or icons reject before changing any row or translation", async () => {
  const beforeRow = await ownRow();
  const beforeTranslations = await rows();
  for (const overrides of [
    { office_hours_label: "x".repeat(121) },
    { office_hours_translations: { ...LABELS, es: "x".repeat(121) } },
    { office_hours_translations: { es: LABELS.es } },
    { office_hours_translations: { ...LABELS, en: "not a target" } },
    { site_icons: { ...activeIcons(beforeRow.site_icons), account: "not-an-icon" } },
  ]) {
    const result = await saveGlobals(payload(overrides, beforeRow));
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "validation");
    assert.deepEqual(await ownRow(), beforeRow);
    assert.deepEqual(await rows(), beforeTranslations);
  }
});
