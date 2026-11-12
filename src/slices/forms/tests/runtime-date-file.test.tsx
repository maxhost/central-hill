import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { createBlueprint, newField } from "../domain";
import * as filePolicy from "../file-policy";
import type { FormRuntimeProps } from "../ui/form-runtime";

/** Render the actual runtime with isolated presentation/i18n seams; no auth, DB or provider. */
function runtime(locale: string) {
  const messages = JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"));
  const control = (tag: string) => ({ children, ...props }: Record<string, unknown>) => React.createElement(tag, props, children as React.ReactNode);
  const dependencies: Record<string, unknown> = {
    react: React,
    "react/jsx-runtime": jsxRuntime,
    "next-intl": { useTranslations: () => (key: string) => messages[key] },
    "@slices/backoffice/contract": {
      AdminButton: control("button"), TextInput: control("input"), TextArea: control("textarea"), Select: control("select"), Checkbox: control("input"),
      Field: ({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) => React.createElement("div", {}, React.createElement("label", { htmlFor }, label), children),
    },
    "../file-policy": filePolicy,
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

for (const locale of ["en", "es", "pt", "fr"]) {
  test(`Date/File render native controls with accessible localized restrictions (${locale})`, () => {
    const { Component, messages } = runtime(locale);
    const definition = createBlueprint("contact");
    const stepId = definition.steps[0]!.id;
    const date = { ...newField(stepId, "date"), label: "Arrival date", required: true };
    const file = { ...newField(stepId, "file"), label: "Document", help: "Your document", required: true };
    definition.fields = [date, file];
    const html = renderToStaticMarkup(React.createElement(Component, { definition, onSubmit: async () => { assert.fail("SSR must not send"); } }));
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

test("wizard keeps inactive file controls mounted and disabled for native validation", () => {
  const { Component } = runtime("en");
  const definition = createBlueprint("owner-estimate");
  const file = { ...newField(definition.steps[1]!.id, "file"), required: true };
  definition.fields = [newField(definition.steps[0]!.id, "date"), file];
  const html = renderToStaticMarkup(React.createElement(Component, { definition, onSubmit: async () => ({ ok: true }) }));
  assert.match(html, /<div hidden=""[^>]*>.*type="file"/);
  const upload = html.match(/<input[^>]*type="file"[^>]*>/)?.[0];
  assert.ok(upload);
  assert.match(upload, /disabled=""/);
});
