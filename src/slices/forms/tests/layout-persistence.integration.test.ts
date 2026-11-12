import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";
import * as domain from "../domain";
import * as validation from "../validation";
import { normalizeBlueprint } from "../layout";
import { testNotification } from "../server/notification";
import { validateAttachments } from "../server/attachments";
import type { FormBlueprint, LegacyFormBlueprint, SaveFormInput, StoredFormBlueprint } from "../types";

/** Actual query/action modules with in-memory SQL/provider seams; no database or email access. */
type Query = { text: string; params: unknown[] };
type DbRow = {
  id: string; name: string; template: "contact"; recipient: string; status: "draft" | "archived";
  revision: number; definition: StoredFormBlueprint; updated_at: Date;
};
type Target = { locale: "es"; field: string; value: string; state: "approved"; source_hash: string };

function legacy(): LegacyFormBlueprint {
  const current = domain.createBlueprint("contact");
  return {
    schemaVersion: 1, columns: 2, steps: current.steps, copy: current.copy, replyToFieldId: current.replyToFieldId,
    fields: current.fields.map(field => ({ ...field, width: field.label === "Name" || field.type === "email" ? 1 : 2, stepId: current.steps[0]!.id })),
  };
}
function load<T>(path: string, dependencies: Record<string, unknown>): T {
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, { exports: compiled.exports, module: compiled, console, require: (name: string) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency ${name}`);
    return dependencies[name];
  } });
  return compiled.exports as T;
}
function harness(definition: StoredFormBlueprint = legacy()) {
  const row: DbRow = { id: crypto.randomUUID(), name: "Own form", template: "contact", recipient: "staff@example.test", status: "draft", revision: 1, definition, updated_at: new Date("2026-11-11T00:00:00Z") };
  const state = { row, targets: [] as Target[], queries: [] as Query[], revalidated: [] as string[], snapshots: [] as { fields: unknown; kind: string }[], captured: [] as unknown[], emails: [] as unknown[], requireCalls: 0, denied: false };
  const sql = (strings: TemplateStringsArray, ...params: unknown[]): Query => ({ text: strings.join("?"), params });
  const select = {
    from: () => select, where: () => select, limit: async () => [state.row], orderBy: async () => [state.row],
  };
  const db = {
    select: () => select,
    execute: async (query: Query) => {
      state.queries.push(query);
      if (query.text.includes("update form_definition set name=")) {
        assert.match(query.text, /where id=\?::uuid and revision=\? and status='draft'/);
        const [name, recipient, raw, id, revision] = query.params;
        if (id !== row.id || revision !== row.revision || row.status !== "draft") return { rows: [] };
        row.name = String(name); row.recipient = String(recipient); row.definition = JSON.parse(String(raw)); row.revision++;
        return { rows: [{ revision: row.revision }] };
      }
      if (query.text.includes("update form_definition set revision=revision+1")) {
        assert.doesNotMatch(query.text, /definition=/);
        const [id, revision] = query.params;
        if (id !== row.id || revision !== row.revision || row.status !== "draft") return { rows: [] };
        row.revision++;
        return { rows: [{ revision: row.revision }] };
      }
      if (query.text.includes("insert into form_test_submission")) {
        assert.match(query.text, /where id=\?::uuid and revision=\? and status='draft'/);
        const saved = query.params.find(value => typeof value === "string" && value.startsWith('{"schemaVersion"'));
        state.captured.push(JSON.parse(String(saved)));
        return { rows: [{ id: "captured-test" }] };
      }
      throw Error("Unexpected SQL operation");
    },
    update: () => ({ set: () => ({ where: async () => undefined }) }),
  };
  const kernel = {
    hashSource: (value: string) => `hash:${value}`,
    loadTranslationRows: async () => state.targets,
    sourceSnapshotCtes: (_type: unknown, _ids: unknown, fields: unknown) => { state.snapshots.push({ kind: "source", fields }); return "source_cte"; },
    targetSnapshotCtes: (_type: unknown, _ids: unknown, _locale: unknown, fields: unknown) => { state.snapshots.push({ kind: "target", fields }); return "target_cte"; },
  };
  const shared = {
    "server-only": {}, "drizzle-orm": { sql, eq: () => ({}), desc: () => ({}) },
    "@core/auth": { requireStaff: async () => { state.requireCalls++; if (state.denied) throw Error("Unauthorized"); return { userId: "staff" }; } },
    "@core/db/client": { db }, "@core/i18n": kernel,
    "../schema": { form_definition: { id: "id", updated_at: "updated_at" }, form_test_submission: { id: "id" } },
    "../domain": domain, "../validation": validation,
  };
  const queries = load<typeof import("../server/queries")>("../server/queries.ts", shared);
  const actions = load<typeof import("../server/actions")>("../server/actions.ts", {
    ...shared, "zod": { z },
    "next/cache": { revalidatePath: (path: string) => state.revalidated.push(path) },
    "@core/db/serialized": { executeSerialized: async (_key: string, query: Query) => db.execute(query) },
    "@slices/settings/server-contract": { headerContactUsageGuard: () => sql`false` },
    "../public-types": { HEADER_CONTACT_LOCK: "header-contact:v1" },
    "./public-publish": { refreshPublicForm: async () => undefined },
    "@core/email": { sendEmail: async (message: unknown) => { state.emails.push(message); return { ok: true, id: "console" }; } },
    "./queries": queries, "./notification": { testNotification }, "./attachments": { validateAttachments },
  });
  return { state, queries, actions };
}

test("actual getFormEditor/listForms normalize legacy without writes or changing stored bytes/revision", async () => {
  const { state, queries } = harness();
  const before = JSON.stringify(state.row);
  const model = await queries.getFormEditor(state.row.id);
  assert.ok(model);
  assert.equal(model.form.definition.schemaVersion, 2);
  assert.deepEqual(model.form.definition, normalizeBlueprint(state.row.definition));
  assert.equal((await queries.listForms())[0]!.definition.schemaVersion, 2);
  assert.equal(JSON.stringify(state.row), before);
  assert.deepEqual(state.queries, []);
});

test("actual target Save only updates revision/translation snapshot and never converts raw legacy", async () => {
  const { state, actions } = harness();
  const before = JSON.stringify(state.row.definition);
  const key = `block:fields.${state.row.definition.fields[0]!.id}.label`;
  const result = await actions.saveFormLocale({ id: state.row.id, expectedRevision: 1, locale: "es", values: { [key]: "Nombre" }, approve: true });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { ok: true, data: { revision: 2 } });
  assert.equal(JSON.stringify(state.row.definition), before);
  assert.equal(state.row.definition.schemaVersion, 1);
  assert.equal(state.snapshots[0]!.kind, "target");
  assert.deepEqual(JSON.parse(JSON.stringify(state.snapshots[0]!.fields)), { [key]: { value: "Nombre", sourceValue: "Name" } });
});

test("actual EN Save writes v2 only with a revision guard; stale or v1 payload never changes saved layout", async () => {
  const { state, actions } = harness();
  const definition = validation.readStoredBlueprint(state.row.definition);
  const input: SaveFormInput = { id: state.row.id, expectedRevision: 1, name: state.row.name, recipient: state.row.recipient, definition };
  assert.deepEqual(JSON.parse(JSON.stringify(await actions.saveForm(input))), { ok: true, data: { revision: 2 } });
  assert.equal(state.row.definition.schemaVersion, 2);
  const saved = JSON.stringify(state.row);
  const stale = await actions.saveForm(input);
  assert.equal(stale.ok, false);
  if (!stale.ok) assert.equal(stale.code, "conflict");
  assert.equal(JSON.stringify(state.row), saved);
  const queryCount = state.queries.length;
  const downgrade = await actions.saveForm({ ...input, expectedRevision: 2, definition: legacy() as unknown as FormBlueprint });
  assert.equal(downgrade.ok, false);
  if (!downgrade.ok) assert.match(downgrade.error, /Reload/);
  assert.equal(state.queries.length, queryCount);
  assert.equal(JSON.stringify(state.row), saved);
});

test("actual legacy test captures normalized saved v2 with approved text without converting form storage", async () => {
  const { state, actions } = harness();
  const source = state.row.definition.fields[0]!;
  state.targets.push({ locale: "es", field: `block:fields.${source.id}.label`, value: "Nombre aprobado", state: "approved", source_hash: `hash:${source.label}` });
  const before = JSON.stringify(state.row);
  const values = Object.fromEntries(state.row.definition.fields.map(field => [field.id, field.type === "email" ? "guest@example.test" : "Answer"]));
  const result = await actions.testForm({ id: state.row.id, expectedRevision: 1, locale: "es", values });
  assert.equal(result.ok, true);
  assert.equal(JSON.stringify(state.row), before);
  assert.equal((state.captured[0] as FormBlueprint).schemaVersion, 2);
  assert.equal((state.captured[0] as FormBlueprint).fields[0]!.label, "Nombre aprobado");
  assert.equal(state.emails.length, 1);
});

test("actual action gates reject invalid layouts, archived/stale tests and unauthorized users before capture", async () => {
  const { state, actions } = harness();
  const definition = validation.readStoredBlueprint(state.row.definition);
  definition.rows[0]!.columns[0]!.fieldId = crypto.randomUUID();
  assert.equal((await actions.saveForm({ id: state.row.id, expectedRevision: 1, name: state.row.name, recipient: state.row.recipient, definition })).ok, false);
  assert.deepEqual(state.queries, []);
  state.row.status = "archived";
  assert.equal((await actions.testForm({ id: state.row.id, expectedRevision: 1, locale: "en", values: {} })).ok, false);
  state.row.status = "draft";
  assert.equal((await actions.testForm({ id: state.row.id, expectedRevision: 2, locale: "en", values: {} })).ok, false);
  assert.equal(state.captured.length, 0); assert.equal(state.emails.length, 0);
  state.denied = true;
  await assert.rejects(() => actions.saveForm({ id: state.row.id, expectedRevision: 1, name: state.row.name, recipient: state.row.recipient, definition }), /Unauthorized/);
  assert.deepEqual(state.queries, []);
});


test("legacy whitespace survives GET and a layout-only EN Save without changing text source hashes", async () => {
  const source = legacy();
  source.copy.title = "  Authored title  ";
  source.fields[0]!.label = "  Name  ";
  source.fields[0]!.help = "  Help text  ";
  const { state, queries, actions } = harness(source);
  const before = domain.textFields(source);
  const model = await queries.getFormEditor(state.row.id);
  assert.ok(model);
  assert.deepEqual(domain.textFields(model.form.definition), before);
  model.form.definition.rows.reverse();
  const result = await actions.saveForm({ id: state.row.id, expectedRevision: 1, name: state.row.name, recipient: state.row.recipient, definition: model.form.definition });
  assert.equal(result.ok, true);
  assert.deepEqual(domain.textFields(state.row.definition), before);
});
