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
function runtime(locale: string, hooks: Partial<typeof React> = {}) {
  const messages = JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"));
  const control = (tag: string) => function Control({ children, ...props }: Record<string, unknown>) { return React.createElement(tag, props, children as React.ReactNode); };
  const dependencies: Record<string, unknown> = {
    react: { ...React, ...hooks },
    "react/jsx-runtime": jsxRuntime,
    "next-intl": { useTranslations: () => (key: string) => messages[key] },
    "./runtime-controls": {
      RuntimeButton: control("button"), TextInput: control("input"), TextArea: control("textarea"), Select: control("select"), Checkbox: control("input"),
      Field: ({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) => React.createElement("div", {}, React.createElement("label", { htmlFor }, label), children),
    },
    "../file-policy": filePolicy,
    "../layout": layout,
  };
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL("../ui/form-runtime.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, { FormData, exports: compiled.exports, module: compiled, require: (name: string) => {
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
    assert.match(messages.fileHint, /3 MiB/);
    assert.match(messages.fileTooLarge, /3 MiB/);
    assert.match(messages.filesTooLarge, /3 MiB/);
    assert.doesNotMatch(messages.fileHint, /(?:5|20) (?:MB|MiB|Mo)/);
    assert.ok(messages.types.date && messages.types.file);
  });
}

/** Invoke the shipped change/submit handlers with stateful hooks; no DOM, DB or network. */
function interactiveRuntime() {
  const state: unknown[] = []; let cursor = 0;
  const hooks = {
    useId: () => "attachment-test",
    useState: (initial: unknown) => {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], (next: unknown) => {
        state[index] = typeof next === "function" ? next(state[index]) : next;
      }];
    },
    useRef: (initial: unknown) => {
      const index = cursor++;
      if (!(index in state)) state[index] = { current: initial };
      return state[index];
    },
  } as Partial<typeof React>;
  const { Component, messages } = runtime("en", hooks);
  type Element = React.ReactElement<Record<string, unknown>>;
  function nodes(value: unknown): Element[] {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!React.isValidElement(value)) return [];
    const element = value as Element;
    if (typeof element.type === "function") return nodes((element.type as (props: unknown) => unknown)(element.props));
    return [element, ...nodes(element.props.children)];
  }
  const render = (props: FormRuntimeProps) => { cursor = 0; return nodes((Component as (props: FormRuntimeProps) => React.ReactNode)(props)); };
  const choose = (tree: Element[], id: string, file: File) => {
    const input = tree.find(element => element.props.name === id && element.props.type === "file");
    assert.ok(input);
    const currentTarget = { files: [file], value: file.name };
    (input.props.onChange as (event: unknown) => void)({ currentTarget });
    return currentTarget;
  };
  const submit = async (tree: Element[]) => {
    const form = tree.find(element => element.type === "form");
    assert.ok(form);
    await (form.props.onSubmit as (event: unknown) => Promise<void>)({ preventDefault() {} });
  };
  return { render, choose, submit, messages };
}

test("browser rejects a 3 MiB + 1 file before sending and accepts an exact-boundary replacement", async () => {
  const ui = interactiveRuntime();
  let value = definition();
  value = addRow(value, value.steps[0]!.id, 1);
  const document = field("file", "Document");
  value = addFieldToColumn(value, value.rows[0]!.columns[0]!.id, document);
  const captured: FormData[] = [];
  const props = { definition: value, onSubmit: async (_values: unknown, files: FormData) => { captured.push(files); return { ok: true }; } };
  const limit = 3 * 1024 * 1024;
  assert.equal(ui.choose(ui.render(props), document.id, new File([new Uint8Array(limit + 1)], "large.pdf", { type: "application/pdf" })).value, "");
  await ui.submit(ui.render(props));
  assert.equal(captured.length, 0);
  assert.ok(ui.render(props).some(element => element.props.role === "alert" && element.props.children === ui.messages.fileTooLarge));
  ui.choose(ui.render(props), document.id, new File([new Uint8Array(limit)], "fits.pdf", { type: "application/pdf" }));
  await ui.submit(ui.render(props));
  assert.equal(captured.length, 1);
  assert.equal((captured[0]!.get(document.id) as File).size, limit);
});

test("browser counts retained files across wizard steps and blocks aggregate overflow before sending", async () => {
  const ui = interactiveRuntime();
  let value = addStep(definition(), "Second step");
  const files = [field("file", "First document"), field("file", "Second document")];
  for (let index = 0; index < files.length; index++) {
    value = addRow(value, value.steps[index]!.id, 1);
    value = addFieldToColumn(value, value.rows[index]!.columns[0]!.id, files[index]!);
  }
  const captured: FormData[] = [];
  const props = { definition: value, onSubmit: async (_values: unknown, files: FormData) => { captured.push(files); return { ok: true }; } };
  const half = 3 * 1024 * 1024 / 2;
  ui.choose(ui.render(props), files[0]!.id, new File([new Uint8Array(half)], "first.pdf", { type: "application/pdf" }));
  await ui.submit(ui.render(props));
  assert.equal(captured.length, 0, "Next must not send the form");
  assert.equal(ui.choose(ui.render(props), files[1]!.id, new File([new Uint8Array(half + 1)], "overflow.pdf", { type: "application/pdf" })).value, "");
  await ui.submit(ui.render(props));
  assert.equal(captured.length, 0);
  assert.ok(ui.render(props).some(element => element.props.role === "alert" && element.props.children === ui.messages.filesTooLarge));
  ui.choose(ui.render(props), files[1]!.id, new File([new Uint8Array(half)], "second.pdf", { type: "application/pdf" }));
  await ui.submit(ui.render(props));
  assert.equal(captured.length, 1);
  assert.equal([...captured[0]!.values()].reduce((sum, item) => sum + (item as File).size, 0), 3 * 1024 * 1024);
  assert.equal((captured[0]!.get(files[0]!.id) as File).name, "first.pdf");
});

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
