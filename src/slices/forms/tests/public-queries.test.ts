import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import ts from "typescript";
import { z } from "zod";
import * as domain from "../domain";
import * as validation from "../validation";
import * as publicTypes from "../public-types";

function harness() {
  const id = crypto.randomUUID();
  const row = { id, name: "Private catalog name", recipient: "private@example.test", status: "draft", revision: 2, template: "contact", definition: domain.createBlueprint("contact"), updated_at: new Date() };
  const state = { selected: id as string | null, row: row as typeof row | null, denied: false, queries: 0, tags: [] as string[], targets: [] as { locale: "es"; field: string; value: string; state: string; source_hash: string }[] };
  const selection = { from: () => selection, where: () => selection, limit: async () => { state.queries++; return state.row ? [state.row] : []; }, orderBy: async () => state.row ? [state.row] : [] };
  const dependencies: Record<string, unknown> = {
    "server-only": {}, "node:crypto": { createHash }, "zod": { z },
    "drizzle-orm": { eq: () => null, desc: () => null, sql: () => null },
    "next/cache": { unstable_cache: (fn: () => unknown, _key: string[], options: { tags: string[] }) => { state.tags.push(...options.tags); return fn; } },
    "@core/auth": { requireStaff: async () => { if (state.denied) throw Error("Unauthorized"); } },
    "@core/db/client": { db: { select: () => selection } },
    "@core/i18n": { hashSource: (value: string) => value, loadTranslationRows: async () => state.targets },
    "@slices/settings/contract": { getGlobals: async () => ({ headerContactFormId: state.selected }) },
    "../schema": { form_definition: { id: "id", updated_at: "updated" } },
    "../domain": domain, "../validation": validation, "../public-types": publicTypes,
    "./queries": { record: (value: typeof row) => ({ ...value, definition: validation.readStoredBlueprint(value.definition), updatedAt: value.updated_at.toISOString() }) },
  };
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL("../server/public-queries.ts",import.meta.url),"utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code,{ exports: compiled.exports, module: compiled, require: (name: string) => { assert.ok(Object.hasOwn(dependencies,name),name); return dependencies[name]; } });
  return { state, row, queries: compiled.exports as typeof import("../server/public-queries") };
}

test("unconfigured header retains legacy path without reading a form",async () => {
  const { state, queries } = harness();state.selected = null;
  assert.equal(await queries.readHeaderContactForm("en"),null);assert.equal(state.queries,0);
});
test("public DTO contains only model identity and localized blueprint, never recipient or catalog name",async () => {
  const { queries,row,state } = harness();
  const model = await queries.readHeaderContactForm("en");assert.ok(model);
  assert.deepEqual(Object.keys(model).sort(),["definition","fingerprint","id","locale","revision"]);
  assert.equal(JSON.stringify(model).includes(row.recipient),false);assert.equal(JSON.stringify(model).includes(row.name),false);
  assert.match(model.fingerprint,/^[a-f0-9]{64}$/);assert.ok(state.tags.includes(`form_definition:${row.id}`));
});
test("only approved localized copy is public; pending copy falls back to EN",async () => {
  const { queries,row,state } = harness();
  state.targets = [
    { locale: "es", field: "block:copy.title", value: "Contacto aprobado", state: "approved", source_hash: "old" },
    { locale: "es", field: "block:copy.submit", value: "Texto privado", state: "needs_review", source_hash: "old" },
  ];
  const model = await queries.readHeaderContactForm("es");assert.ok(model);
  assert.equal(model.definition.copy.title,"Contacto aprobado");assert.equal(model.definition.copy.submit,row.definition.copy.submit);
  assert.notEqual(model.fingerprint,(await queries.readHeaderContactForm("en"))?.fingerprint);
});
test("missing, archived, invalid and recipient-less definitions use legacy fallback",async () => {
  for (const reason of ["missing","archived","recipient","definition"] as const) {
    const { queries,row,state } = harness();
    if (reason === "missing") state.row = null;
    if (reason === "archived") row.status = "archived";
    if (reason === "recipient") row.recipient = "";
    if (reason === "definition") row.definition.fields = [];
    assert.equal(await queries.readHeaderContactForm("en"),null,reason);
  }
});
test("selector options are auth gated and explain unavailable forms",async () => {
  const { queries,row,state } = harness();row.recipient = "";
  const [choice] = await queries.listHeaderContactFormOptions();assert.ok(choice);assert.equal(choice.available,false);assert.equal(choice.reason,"recipient");
  state.denied = true;await assert.rejects(queries.listHeaderContactFormOptions(),/Unauthorized/);
});
