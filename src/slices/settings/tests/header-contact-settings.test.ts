import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { and, eq, sql, type SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { company_settings } from "../schema";
import { companySettingsSaveInput } from "../admin/validation";
import { DEFAULT_GLOBALS } from "../defaults";

const choice = "be730eb1-d307-4922-9706-61951db0ed72";
const id = "6a1c5388-98d2-48b8-b911-586c75f1208b";
function payload(extra: Record<string, unknown> = {}) {
  const d = DEFAULT_GLOBALS;
  return { email: d.email, phone: d.phone, whatsapp: d.whatsapp, checkin_phone: d.checkinPhone, website_url: d.website,
    social: { instagram: null, facebook: null, linkedin: null, youtube: null, tiktok: null }, office_address: d.officeAddress,
    office_hours: d.officeHours, office_hours_label: d.officeHoursLabel, currency: "EUR", default_og_image_media_id: null,
    site_icons: d.icons, ...extra };
}
function harness({ existing = true, available = true, saved = true } = {}) {
  const state = { locks: [] as string[], queries: [] as { sql: string; params: unknown[] }[], translations: 0, revalidated: 0, candidateReads: 0 };
  const orm = drizzle(neon("postgresql://fixture:fixture@unreachable.invalid/fixture"));
  const select = { from: () => select, orderBy: () => select, limit: async () => existing ? [{ id, site_icons: { retained_icon: "star" } }] : [] };
  const db = { select: () => select, update: orm.update.bind(orm) };
  const noop = async () => { state.translations++; };
  const dependencies: Record<string, unknown> = {
    "@core/media/owner-alt-write": { saveOwnerMediaAlts: noop },
    "drizzle-orm": { and, eq, sql }, "@core/auth": { requireStaff: async () => ({ userId: "own-qa" }) },
    "@core/db/client": { db }, "@core/db/serialized": { executeSerialized: async (key: string, query: SQL) => {
      state.locks.push(key); state.queries.push(new PgDialect().sqlToQuery(query));
      return { rows: saved ? [{ id }] : [] };
    } },
    "@slices/forms/contract": { HEADER_CONTACT_LOCK: "header-contact:v1", getAssignableHeaderForm: async () => { state.candidateReads++; return available ? { id: choice, revision: 3 } : null; }, assignableHeaderFormGuard: (value: string, revision: number) => sql`exists(select 1 from form_definition where id=${value}::uuid and revision=${revision} and status='draft')` },
    "../defaults": { DEFAULT_GLOBALS }, "../schema": { company_settings },
    "../server/publish": { revalidateGlobals: () => { state.revalidated++; } },
    "../server/website-locales": { saveWebsiteTranslations: noop },
    "../server/navigation-ctas": { saveNavigationCtas: noop },
    "../server/hours-labels": { saveHoursLabelTranslations: noop }, "./validation": { companySettingsSaveInput },
  };
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL("../admin/actions.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, { module: compiled, exports: compiled.exports, console, require(name: string) { assert.ok(name in dependencies, name); return dependencies[name]; } });
  return { state, actions: compiled.exports as typeof import("../admin/actions") };
}
test("header assignment distinguishes omission from explicit clear and validates UUID", () => {
  const field = companySettingsSaveInput.shape.header_contact_form_id;
  assert.equal(field.parse(undefined), undefined); assert.equal(field.parse(null), null); assert.equal(field.parse(choice), choice);
  assert.equal(field.safeParse("arbitrary").success, false);
});
test("selected form is validated and guarded inside the serialized Settings update", async () => {
  const { state, actions } = harness();
  assert.equal((await actions.saveGlobals(payload({ header_contact_form_id: choice }))).ok, true);
  assert.deepEqual(state.locks, ["header-contact:v1"]);
  assert.match(state.queries[0]!.sql, /where .*exists\(select 1 from form_definition/);
  assert.match(state.queries[0]!.sql, /revision=/); assert.ok(state.queries[0]!.params.includes(3));
  assert.ok(state.queries[0]!.params.includes(choice)); assert.equal(state.revalidated, 1); assert.equal(state.translations, 4);
});
test("old Settings clients preserve header selection, while explicit null clears it", async () => {
  const omitted = harness(); await omitted.actions.saveGlobals(payload());
  assert.doesNotMatch(omitted.state.queries[0]!.sql, /set "header_contact_form_id"/);
  assert.equal(omitted.state.candidateReads, 0);
  const clear = harness(); await clear.actions.saveGlobals(payload({ header_contact_form_id: null }));
  assert.match(clear.state.queries[0]!.sql, /"header_contact_form_id" =/); assert.ok(clear.state.queries[0]!.params.includes(null));
});
test("unavailable selection and failed atomic guard do not save translations or revalidate", async () => {
  for (const setup of [{ available: false }, { saved: false }]) {
    const { state, actions } = harness(setup);
    const result = await actions.saveGlobals(payload({ header_contact_form_id: choice }));
    assert.equal(result.ok, false); if (!result.ok && result.error === "validation") assert.ok(result.fieldErrors.header_contact_form_id);
    assert.equal(state.translations, 0); assert.equal(state.revalidated, 0);
  }
});
test("first Settings save guards singleton absence and form availability in one statement", async () => {
  const { state, actions } = harness({ existing: false });
  assert.equal((await actions.saveGlobals(payload({ header_contact_form_id: choice }))).ok, true);
  assert.match(state.queries[0]!.sql, /insert into "company_settings"/);
  assert.match(state.queries[0]!.sql, /where not exists\(select 1 from "company_settings"\) and exists/);
  assert.deepEqual(state.locks, ["header-contact:v1"]);
});
