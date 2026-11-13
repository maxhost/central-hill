import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { runInNewContext } from "node:vm";
import { and, asc, eq, sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { parse } from "dotenv";
import ts from "typescript";
import { company_settings } from "../schema";
import { companySettingsSaveInput } from "../admin/validation";
import { DEFAULT_GLOBALS } from "../defaults";
import { resolveSiteIcons } from "../server/site-icons";

const enabled = process.env.OWNERS_EMAIL_DB_TEST === "1";
const ownDatabase = "ownersemailunitqa20261112";
const guestEmail = "own-owners-email-guest@example.test";
const customEmail = "own-owner-contact@example.test";
const locales = ["en", "es", "pt", "fr"] as const;
function load<T>(source: URL, dependencies: Record<string, unknown>): T {
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(source, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, { module: compiled, exports: compiled.exports, console, require(name: string) { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name]; } });
  return compiled.exports as T;
}
function harness() {
  const config = parse(readFileSync(".env.local")), url = new URL(config.DATABASE_URL!);
  assert.deepEqual([url.hostname, url.pathname, url.username], [`${ownDatabase}.local`, `/${ownDatabase}`, ownDatabase]);
  const client = neon(url.href), db = drizzle(client);
  const state = { revalidated: 0, authChecks: 0, cacheKeys: [] as string[][] };
  const serialized = load<typeof import("../../../core/db/serialized")>(new URL("../../../core/db/serialized.ts", import.meta.url), { "server-only": {}, "drizzle-orm/pg-core": { PgDialect }, "./client": { sqlClient: client } });
  const noop = async () => undefined;
  const actions = load<typeof import("../admin/actions")>(new URL("../admin/actions.ts", import.meta.url), {
    "@core/media/owner-alt-write": { saveOwnerMediaAlts: noop }, "drizzle-orm": { and, eq, sql },
    "@core/auth": { requireStaff: async (roles: string[]) => { assert.deepEqual(Array.from(roles), ["admin"]); state.authChecks++; return { userId: "own-email-test" }; } },
    "@core/db/client": { db }, "@core/db/serialized": serialized,
    "@slices/forms/contract": { HEADER_CONTACT_LOCK: "header-contact:v1" },
    "@slices/forms/server-contract": { getAssignableHeaderForm: async () => { throw Error("No assignment changes in Owners email test"); }, assignableHeaderFormGuard: () => { throw Error("No assignment changes in Owners email test"); } },
    "../defaults": { DEFAULT_GLOBALS }, "../schema": { company_settings },
    "../server/publish": { revalidateGlobals: () => { state.revalidated++; } },
    "../server/website-locales": { saveWebsiteTranslations: noop }, "../server/navigation-ctas": { saveNavigationCtas: noop }, "../server/hours-labels": { saveHoursLabelTranslations: noop }, "./validation": { companySettingsSaveInput },
  });
  const shared = {
    "server-only": {}, "drizzle-orm": { asc }, "@core/db/client": { db },
    "@core/i18n/content": { loadContent: async () => ({ get: () => undefined }), loadTranslationRows: async () => [] },
    "@core/media": { loadMedia: async () => new Map(), mediaUrl: () => { throw Error("No media in Owners email test"); } },
    "../contract": { COMPANY_SETTINGS: "company_settings", SETTINGS_TAGS: { globals: "globals", nav: "nav" } }, "../schema": { company_settings },
    "../defaults": { DEFAULT_GLOBALS }, "../server/site-icons": { resolveSiteIcons },
  };
  const admin = load<typeof import("../admin/queries")>(new URL("../admin/queries.ts", import.meta.url), {
    ...shared, "@core/media/owner-alt": { rawOwnerMediaAlts: () => ({}) },
    "../server/website-locales": { rawWebsiteTranslations: () => ({ es: "", pt: "", fr: "" }) },
    "../server/navigation-ctas": { navigationCtasForEdit: () => ({}) }, "../server/hours-labels": { rawHoursLabelTranslations: () => ({ es: "", pt: "", fr: "" }) },
  });
  const publicQueries = load<typeof import("../server/queries")>(new URL("../server/queries.ts", import.meta.url), {
    ...shared, "@core/media/owner-alt": { resolveOwnerMediaAlt: () => "" },
    "next/cache": { unstable_cache: (fn: unknown, keys: string[]) => { state.cacheKeys.push(keys); return fn; } },
    "../site-icons": { SITE_ICON_KEYS: [] }, "./site-icons": { resolveSiteIcons },
    "./website-locales": { resolveWebsiteUrl: (value: unknown) => value }, "./navigation-ctas": { resolveNavigationCtas: () => ({}) },
    "./fixed-navigation": { getFixedNav: () => [] }, "./hours-labels": { resolveHoursLabel: (value: unknown) => value },
  });
  return { client, db, actions, admin, publicQueries, state };
}
let h: ReturnType<typeof harness>;
let ownId: string | null = null;
let verified = false;
function payload(extra: Record<string, unknown> = {}) {
  const d = DEFAULT_GLOBALS;
  return { email: guestEmail, phone: d.phone, owners_phone: d.ownersPhone, whatsapp: d.whatsapp, checkin_phone: d.checkinPhone, website_url: d.website,
    social: { instagram: null, facebook: null, linkedin: null, youtube: null, tiktok: null }, office_address: d.officeAddress,
    office_hours: d.officeHours, office_hours_label: d.officeHoursLabel, currency: "EUR", default_og_image_media_id: null, site_icons: d.icons, ...extra };
}
async function ownRow() {
  const rows = await h.db.select().from(company_settings);
  assert.equal(rows.length, 1, "Refuse writes if another Settings singleton appears");
  assert.equal(rows[0]?.id, ownId); assert.equal(rows[0]?.email, guestEmail);
  return rows[0]!;
}
function unaffected(row: Awaited<ReturnType<typeof ownRow>>) {
  return JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(row).filter(([key]) => !["owners_email", "updated_at"].includes(key)))));
}
async function save(extra: Record<string, unknown> = {}) {
  const before = unaffected(await ownRow());
  const result = await h.actions.saveGlobals(payload(extra)); assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(unaffected(await ownRow()), before, "No existing contact/config column changes");
}
async function expectRead(value: string | null, raw = value ?? "") {
  assert.equal((await h.admin.getGlobalsForEdit()).data.owners_email, raw);
  for (const locale of locales) assert.equal((await h.publicQueries.getGlobals(locale))?.ownersEmail, value, locale);
}
before(async () => {
  if (!enabled) return;
  h = harness();
  assert.deepEqual((await h.client`select current_database() as db,current_user as role`)[0], { db: ownDatabase, role: ownDatabase });
  assert.equal((await h.client`select count(*)::int as n from company_settings`)[0]?.n, 0, "Refuse an existing singleton");
  assert.equal((await h.client`select column_default from information_schema.columns where table_schema='public'and table_name='company_settings'and column_name='owners_email'`)[0]?.column_default, "'partners@centralhill.pt'::text");
  verified = true;
});
after(async () => {
  if (!enabled || !verified || !ownId) return;
  await ownRow();
  await h.db.delete(company_settings).where(eq(company_settings.id, ownId));
  assert.equal((await h.client`select count(*)::int as n from company_settings`)[0]?.n, 0);
});
test("Owners email DB: absent singleton scaffold uses supplied default without any GET writes", { skip: !enabled }, async () => {
  assert.equal((await h.admin.getGlobalsForEdit()).data.owners_email, DEFAULT_GLOBALS.ownersEmail);
  for (const locale of locales) assert.equal(await h.publicQueries.getGlobals(locale), null);
  assert.equal((await h.client`select count(*)::int as n from company_settings`)[0]?.n, 0);
});
test("Owners email DB: first old-shaped Save obtains the nullable column default", { skip: !enabled }, async () => {
  const result = await h.actions.saveGlobals(payload());
  const rows = await h.db.select().from(company_settings); ownId = rows[0]?.id ?? null;
  assert.ok(ownId); assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal((await ownRow()).owners_email, "partners@centralhill.pt");
  await expectRead("partners@centralhill.pt");
});
test("Owners email DB: trimmed address reloads for all locales without changing other contact/config values", { skip: !enabled }, async () => {
  await save({ owners_email: `  ${customEmail}  ` });
  assert.equal((await ownRow()).owners_email, customEmail);
  await expectRead(customEmail);
  assert.ok(h.state.cacheKeys.some(keys => keys.includes("v9-owners-email")), "Old globals shape cannot hide the new field");
});
test("Owners email DB: old-client omission preserves a configured address", { skip: !enabled }, async () => {
  await save(); await expectRead(customEmail);
});
test("Owners email DB: explicit null clears and later omission never revives the default", { skip: !enabled }, async () => {
  await save({ owners_email: null }); await save();
  assert.equal((await ownRow()).owners_email, null); await expectRead(null);
});
test("Owners email DB: stored whitespace reads hidden and malformed submissions leave the exact row intact", { skip: !enabled }, async () => {
  const row = await ownRow(); await h.db.update(company_settings).set({ owners_email: "   " }).where(eq(company_settings.id, row.id));
  await expectRead(null, "   ");
  const before = JSON.parse(JSON.stringify(await ownRow())), revalidated = h.state.revalidated;
  for (const owners_email of ["", "  ", "invalid", "a@b.test\nBCC:c@d.test", "a".repeat(255)]) {
    const result = await h.actions.saveGlobals(payload({ owners_email }));
    assert.equal(result.ok, false); if (!result.ok && result.error === "validation") assert.ok(result.fieldErrors.owners_email);
  }
  assert.deepEqual(JSON.parse(JSON.stringify(await ownRow())), before);
  assert.equal(h.state.revalidated, revalidated, "Rejected values never revalidate");
  assert.ok(h.state.authChecks >= 6);
});
