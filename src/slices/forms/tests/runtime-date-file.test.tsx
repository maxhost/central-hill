import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { addFieldToColumn, addRow, addStep } from "../layout";
import * as layout from "../layout";
import type { FormBlueprint, FormField } from "../types";
import * as filePolicy from "../file-policy";
import type { FormRuntimeProps } from "../ui/form-runtime";

/** Render the actual runtime with isolated presentation/i18n seams; no auth, DB or provider. */
function runtime(locale: string) {
  const messages = JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"));
  const control = (tag: string) => function Control({ children, ...props }: Record<string, unknown>) { return React.createElement(tag, props, children as React.ReactNode); };
  const dependencies: Record<string, unknown> = {
    react: React,
    "react/jsx-runtime": jsxRuntime,
    "next-intl": { useTranslations: () => (key: string) => messages[key] },
    "@slices/backoffice/contract": {
      AdminButton: control("button"), TextInput: control("input"), TextArea: control("textarea"), Select: control("select"), Checkbox: control("input"),
      Field: ({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) => React.createElement("div", {}, React.createElement("label", { htmlFor }, label), children),
    },
    "../file-policy": filePolicy,
    "../layout": layout,
  };
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL("../ui/form-runtime.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, { exports: compiled.exports, module: compiled, require: (name: string) => {
    assert.ok(name in dependencies, `Unexpected runtime dependency ${name}`);
    return dependencies[name];
  } });
  return { Component: (compiled.exports as { FormRuntime: React.ComponentType<FormRuntimeProps> }).FormRuntime, messages };
}

function definition(): FormBlueprint {
  return { schemaVersion: 2, steps: [{ id: crypto.randomUUID(), title: "Your details" }], rows: [], fields: [], replyToFieldId: null, copy: { title: "Request", description: "", submit: "Send", next: "Next", back: "Back", cancel: "Cancel", successTitle: "Done", successMessage: "Done", errorMessage: "Error" } };
}
function field(type: FormField["type"], label: string): FormField {
  return { id: crypto.randomUUID(), type, label, placeholder: "", help: "", required: true, options: [], consent: false };
}
for (const locale of ["en", "es", "pt", "fr"]) {
  test(`Date/File render native controls with accessible localized restrictions (${locale})`, () => {
    const { Component, messages } = runtime(locale);
    let value = definition();
    value = addRow(value, value.steps[0]!.id, 2);
    const date = field("date", "Arrival date");
    const file = { ...field("file", "Document"), help: "Your document" };
    value = addFieldToColumn(value, value.rows[0]!.columns[0]!.id, date);
    value = addFieldToColumn(value, value.rows[0]!.columns[1]!.id, file);
    const html = renderToStaticMarkup(React.createElement(Component, { definition: value, onSubmit: async () => { assert.fail("SSR must not send"); } }));
    assert.match(html, /type="date"[^>]*min="0001-01-01"[^>]*max="9999-12-31"/);
    const upload = html.match(/<input[^>]*type="file"[^>]*>/)?.[0];
    assert.ok(upload);
    assert.ok(upload.includes(filePolicy.FORM_FILE_ACCEPT));
    assert.match(upload, /required=""/);
    assert.match(upload, /aria-describedby="[^"]*-help [^"]*-file-policy"/);
    assert.doesNotMatch(upload, /(?:multiple|value)=/);
    assert.ok(html.includes(messages.fileHint));
    assert.ok(messages.types.date && messages.types.file);
  });
}

test("wizard keeps inactive file rows mounted, hidden and disabled for native validation", () => {
  const { Component } = runtime("en");
  let value = addStep(definition(), "Next");
  value = addRow(value, value.steps[0]!.id, 1);
  value = addFieldToColumn(value, value.rows[0]!.columns[0]!.id, field("date", "Arrival"));
  value = addRow(value, value.steps[1]!.id, 1);
  value = addFieldToColumn(value, value.rows[1]!.columns[0]!.id, field("file", "Document"));
  const html = renderToStaticMarkup(React.createElement(Component, { definition: value, onSubmit: async () => ({ ok: true }) }));
  assert.match(html, /<div data-form-row="[^"]+" hidden="" class="min-w-0">/);
  const upload = html.match(/<input[^>]*type="file"[^>]*>/)?.[0];
  assert.ok(upload);
  assert.match(upload, /disabled=""/);
});

test("runtime follows visual row order, skips empty rows and keeps right-only desktop placement", () => {
  const { Component } = runtime("en");
  let value = definition();
  value = addRow(value, value.steps[0]!.id, 2);
  const first = field("text", "Visually first");
  value = addFieldToColumn(value, value.rows[0]!.columns[1]!.id, first);
  value = addRow(value, value.steps[0]!.id, 1);
  const second = field("text", "Visually second");
  value = addFieldToColumn(value, value.rows[1]!.columns[0]!.id, second);
  value = addRow(value, value.steps[0]!.id, 2);
  value.fields.reverse();
  const desktop = renderToStaticMarkup(React.createElement(Component, { definition: value, onSubmit: async () => ({ ok: true }) }));
  const compact = renderToStaticMarkup(React.createElement(Component, { definition: value, compact: true, onSubmit: async () => ({ ok: true }) }));
  assert.ok(desktop.indexOf("Visually first") < desktop.indexOf("Visually second"));
  assert.equal((desktop.match(/data-form-row=/g) ?? []).length, 2);
  assert.match(desktop, /sm:col-start-2/);
  assert.doesNotMatch(compact, /sm:col-start-2|sm:grid-cols-2/);
});
