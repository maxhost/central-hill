import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";
import * as layout from "../layout";
import type { FormBlueprint, FormField } from "../types";

/** Exercise handlers from the shipped components with isolated React state and presentation seams. */
function component(file: string, name: string) {
  const messages = JSON.parse(readFileSync(new URL("../messages/en.json", import.meta.url), "utf8"));
  const state: unknown[] = []; let cursor = 0;
  const translated = (key: string, values: Record<string, unknown> = {}) => {
    let value: unknown = messages;
    for (const part of key.split(".")) value = (value as Record<string, unknown>)[part];
    assert.equal(typeof value, "string", `Missing message ${key}`);
    return String(value).replace(/\{(\w+)\}/g, (_, token) => String(values[token] ?? token));
  };
  const dependencies: Record<string, unknown> = {
    react: { ...React, useState: (initial: unknown) => {
      const index = cursor++; if (!(index in state)) state[index] = initial;
      return [state[index], (next: unknown) => { state[index] = next; }];
    } },
    "react/jsx-runtime": jsxRuntime, "next-intl": { useTranslations: () => translated },
    "@slices/backoffice/contract": { AdminButton: "button", Field: "fieldset", Select: "select" },
    "../layout": layout,
  };
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL(`../admin/${file}.tsx`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, { exports: compiled.exports, module: compiled, require: (dependency: string) => {
    assert.ok(dependency in dependencies, `Unexpected dependency ${dependency}`); return dependencies[dependency];
  } });
  type Element = React.ReactElement<Record<string, unknown>>;
  function expand(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(expand);
    if (!React.isValidElement(value)) return value;
    const element = value as Element;
    if (typeof element.type === "function") return expand((element.type as (props: unknown) => unknown)(element.props));
    return React.cloneElement(element, { children: expand(element.props.children) });
  }
  function nodes(value: unknown): Element[] {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!React.isValidElement(value)) return [];
    const element = value as Element;
    return [element, ...nodes(element.props.children)];
  }
  const Component = (compiled.exports as Record<string, (props: unknown) => unknown>)[name]!;
  const render = (props: unknown) => { cursor = 0; return nodes(expand(Component(props))); };
  const find = (tree: Element[], key: string, value: unknown) => {
    const element = tree.find(item => item.props[key] === value);
    assert.ok(element, `Missing ${key}=${String(value)}`); return element;
  };
  const button = (tree: Element[], text: string) => {
    const element = tree.find(item => item.type === "button" && item.props.children === text);
    assert.ok(element, `Missing button ${text}`); return element;
  };
  const click = (tree: Element[], text: string) => (button(tree, text).props.onClick as () => void)();
  const change = (tree: Element[], id: string, value: string) => (find(tree, "id", id).props.onChange as (event: unknown) => void)({ target: { value } });
  return { render, find, button, click, change };
}

function fixture(): FormBlueprint {
  const fields: FormField[] = ["Left", "Right"].map(label => ({ id: crypto.randomUUID(), type: "text", label, placeholder: "", help: "", required: false, options: [], consent: false }));
  const stepId = crypto.randomUUID();
  return {
    schemaVersion: 2, steps: [{ id: stepId, title: "Details" }],
    rows: [{ id: crypto.randomUUID(), stepId, columns: fields.map(field => ({ id: crypto.randomUUID(), fieldId: field.id })) }], fields, replyToFieldId: null,
    copy: { title: "Request", description: "", submit: "Send", next: "Next", back: "Back", cancel: "Cancel", successTitle: "Done", successMessage: "Done", errorMessage: "Error" },
  };
}

test("canvas adds chosen rows and fields to explicit columns; translation mode exposes no add controls", () => {
  const ui = component("form-layout-canvas", "FormLayoutCanvas");
  const original = fixture();
  const definition = layout.removeField(original, original.fields[0]!.id);
  const added: unknown[] = []; const rows: number[] = [];
  const props = { definition, selected: "form", activeStep: definition.steps[0]!.id, compact: false, sourceMode: true, onSelect() {}, onAddStep() {},
    onAddField: (column: string, type: string) => added.push({ column, type }), onAddRow: (columns: number) => rows.push(columns) };
  let tree = ui.render(props);
  ui.change(tree, "new-row-columns", "2"); tree = ui.render(props); ui.click(tree, "Add row");
  assert.deepEqual(rows, [2]);
  const column = definition.rows[0]!.columns[0]!.id;
  ui.change(tree, `add-type-${column}`, "date"); tree = ui.render(props); ui.click(tree, "Add field");
  assert.deepEqual(added, [{ column, type: "date" }]);
  tree = ui.render({ ...props, sourceMode: false });
  assert.equal(tree.some(item => item.props.id === "new-row-columns" || item.props.id === `add-type-${column}`), false);
  assert.equal(original.fields.length, 2);
});

test("populated row removal requires confirmation and reports the affected fields", () => {
  const ui = component("form-row-controls", "FormRowControls");
  const definition = fixture(); let removed = 0; let count = 0;
  const props = { definition, row: definition.rows[0], onColumns: (value: number) => { count = value; }, onStep() {}, onMove() {}, onRemove: () => { removed++; } };
  let tree = ui.render(props);
  ui.change(tree, "row-columns", "1"); assert.equal(count, 1);
  ui.click(tree, "Remove row"); assert.equal(removed, 0);
  tree = ui.render(props);
  assert.ok(tree.some(item => typeof item.props.children === "string" && item.props.children.includes("Left, Right")));
  ui.click(tree, "Keep row"); assert.equal(removed, 0);
  tree = ui.render(props); assert.equal(tree.some(item => item.props.children === "Confirm remove row"), false);
  ui.click(tree, "Remove row"); tree = ui.render(props); ui.click(tree, "Confirm remove row"); assert.equal(removed, 1);
});

test("field move requires explicit occupied-column swap confirmation", () => {
  const ui = component("form-row-controls", "FormFieldMoveControls");
  const definition = fixture(); const moved: unknown[] = [];
  const props = { definition, field: definition.fields[0], onMove: (column: string, swap: boolean) => moved.push({ column, swap }) };
  let tree = ui.render(props);
  assert.equal(ui.button(tree, "Move field").props.disabled, true);
  ui.change(tree, "destination-column", definition.rows[0]!.columns[1]!.id); tree = ui.render(props);
  ui.click(tree, "Swap fields"); assert.equal(moved.length, 0);
  tree = ui.render(props); ui.click(tree, "Cancel move"); assert.equal(moved.length, 0);
  tree = ui.render(props); ui.click(tree, "Swap fields"); tree = ui.render(props); ui.click(tree, "Confirm swap");
  assert.deepEqual(moved, [{ column: definition.rows[0]!.columns[1]!.id, swap: true }]);
});

test("field destination step selects that step's first row and empty column", () => {
  const ui = component("form-row-controls", "FormFieldMoveControls");
  let definition = layout.addStep(fixture(), "Other");
  definition = layout.addRow(definition, definition.steps[1]!.id, 1);
  const moved: unknown[] = [];
  const props = { definition, field: definition.fields[0], onMove: (column: string, swap: boolean) => moved.push({ column, swap }) };
  let tree = ui.render(props);
  ui.change(tree, "destination-step", definition.steps[1]!.id); tree = ui.render(props);
  assert.equal(ui.find(tree, "id", "destination-row").props.value, definition.rows[1]!.id);
  ui.click(tree, "Move field");
  assert.deepEqual(moved, [{ column: definition.rows[1]!.columns[0]!.id, swap: false }]);
});
