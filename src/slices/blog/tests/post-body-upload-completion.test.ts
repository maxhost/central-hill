import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";
import * as stateHelpers from "../admin/ui/post-editor-state";
import { BLOG_EDITOR_LOCALES, type BlogPostEditorialModel } from "../editorial-types";
import type { PostBody } from "../body";

type Node = { type?: unknown; props?: Record<string, unknown> };
function nodes(tree: unknown, type: string): Node[] {
  if (Array.isArray(tree)) return tree.flatMap(value => nodes(value, type));
  if (!tree || typeof tree !== "object") return [];
  const node = tree as Node;
  return [...(node.type === type ? [node] : []), ...nodes(node.props?.children, type)];
}
function text(tree: unknown): string {
  if (Array.isArray(tree)) return tree.map(text).join("");
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  return tree && typeof tree === "object" ? text((tree as Node).props?.children) : "";
}
const originalBody: PostBody = [{ type: "paragraph", text: "Original article" }];
const reservedBody: PostBody = [...originalBody, { type: "image", media_id: "924c0711-d67a-4897-b03d-5945d01bc5b0" }];

/** Render the real parent and its callbacks with controlled hooks/action IO; no upload or browser claim. */
function harness(archived = false) {
  const values: unknown[] = [], refs: Array<{ current: unknown }> = [];
  let valueIndex = 0, refIndex = 0;
  const pending = new Map<string, (result: unknown) => void>();
  const h = {
    navigating: false,
    queue: { isPreparing: false, flush: () => new Promise(resolve => pending.set("save", resolve)) },
  };
  const source = stateHelpers.emptyPostEnvelope("category", "author");
  source.content.title = "Original title";
  source.content.body = structuredClone(originalBody);
  const initial = {
    id: "d7aa4664-c14d-4caa-ad45-d91ee7a728e6", archived, slugByLocale: { en: "article" }, previews: {},
    locales: Object.fromEntries(BLOG_EDITOR_LOCALES.map(locale => [locale, {
      locale, revision: 1, templateRevision: null, published: null,
      draft: structuredClone(source), working: structuredClone(source),
    }])),
  } as unknown as BlogPostEditorialModel;
  const components = (...names: string[]) => Object.fromEntries(names.map(name => [name, name]));
  const action = (name: string) => () => new Promise(resolve => pending.set(name, resolve));
  const dependencies: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    react: {
      useState: (initialValue: unknown) => {
        const index = valueIndex++;
        if (!(index in values)) values[index] = typeof initialValue === "function" ? (initialValue as () => unknown)() : initialValue;
        return [values[index], (value: unknown) => { values[index] = typeof value === "function" ? (value as (before: unknown) => unknown)(values[index]) : value; }];
      },
      useRef: (value: unknown) => { const index = refIndex++; return refs[index] ?? (refs[index] = { current: value }); },
      useId: () => "editor", useMemo: (fn: () => unknown) => fn(), useEffect: () => {},
      useTransition: () => [h.navigating, (fn: () => void) => fn()],
    },
    "next/navigation": { useRouter: () => ({ push: () => {}, replace: () => {} }) },
    "next-intl": { useTranslations: () => (key: string) => key },
    "@core/ui": components("UiIcon"),
    "@slices/backoffice/contract": { ...components("AdminButton", "Checkbox", "Field", "MediaField", "MediaAltProvider", "Select", "TextArea", "TextInput"), useMediaQueue: () => h.queue },
    "../editorial-contract": { BLOG_EDITOR_LOCALES },
    "../post-locale-actions": { archivePost: action("archive"), publishPostLocaleDraft: action("publish"), savePostLocaleDraft: action("save-action") },
    "../actions": { deletePost: action("delete") },
    "./post-rich-text-editor": components("PostRichTextEditor"),
    "./post-editor-state": stateHelpers,
  };
  const compiled = { exports: {} as Record<string, (props: unknown) => Node> };
  const sourceText = readFileSync(new URL("../admin/ui/post-locale-editor.tsx", import.meta.url), "utf8");
  const code = ts.transpileModule(sourceText, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(code, { module: compiled, exports: compiled.exports, require: (name: string) => {
    assert.ok(name in dependencies, `Unexpected dependency ${name}`); return dependencies[name];
  } });
  const render = () => { valueIndex = 0; refIndex = 0; return compiled.exports.PostLocaleEditor!({ initial, categories: [], authors: [], posts: [] }); };
  const rich = () => nodes(render(), "PostRichTextEditor")[0]!.props!;
  const button = (label: string) => nodes(render(), "AdminButton").find(node => text(node.props?.children) === label)!.props!;
  return {
    ...h, queue: h.queue,
    setNavigating: (value: boolean) => { h.navigating = value; },
    rich, button, render,
    body: () => rich().value as PostBody,
    complete: (name: string, result: unknown = { ok: false, error: "conflict" }) => { assert.ok(pending.has(name), `${name} started`); pending.get(name)!(result); },
    confirm: (kind: "archive" | "delete") => {
      (button(kind === "delete" ? "actions.delete" : "archive").onClick as () => void)();
      const dialog = nodes(render(), "dialog").find(node => node.props?.["aria-label"] === `${kind}Confirm`)!;
      const confirm = nodes(dialog, "AdminButton").find(node => text(node.props?.children) === "continue")!;
      (confirm.props!.onClick as () => void)();
    },
  };
}
const settled = () => new Promise(resolve => setImmediate(resolve));

test("asynchronous image reservation completion updates the body while preparing; editor and generic fields remain locked", async () => {
  const h = harness(); h.queue.isPreparing = true;
  const rich = h.rich(); assert.equal(rich.disabled, true);
  await Promise.resolve().then(() => (rich.onChange as (body: PostBody) => void)(reservedBody));
  assert.deepEqual(h.body(), reservedBody);
  const tree = h.render();
  const title = nodes(tree, "TextInput").find(node => node.props?.value === "Original title")!;
  (title.props!.onChange as (event: unknown) => void)({ target: { value: "Ignored while preparing" } });
  assert.ok(nodes(h.render(), "TextInput").some(node => node.props?.value === "Original title"));
  assert.equal(h.button("saveDraft").disabled, true);
  assert.equal(h.button("publish").disabled, true);
  assert.ok(nodes(h.render(), "button").filter(node => node.props?.role === "tab").every(node => node.props?.disabled));
  h.queue.isPreparing = false;
  assert.equal(h.rich().disabled, false);
  assert.deepEqual(h.body(), reservedBody);
});

for (const operation of ["save", "publish", "archive", "delete"] as const) {
  test(`reservation completion cannot change the body during ${operation}, including a callback captured before its lock`, async () => {
    const h = harness(), stale = h.rich().onChange as (body: PostBody) => void;
    if (operation === "archive" || operation === "delete") h.confirm(operation);
    else (h.button(operation === "save" ? "saveDraft" : "publish").onClick as () => void)();
    h.queue.isPreparing = true;
    stale(reservedBody);
    (h.rich().onChange as (body: PostBody) => void)(reservedBody);
    assert.deepEqual(h.body(), originalBody);
    assert.equal(h.rich().disabled, true);
    h.queue.isPreparing = false;
    h.complete(operation, operation === "save" ? false : { ok: false, error: "conflict" });
    await settled();
  });
}

test("navigation blocks controlled body updates even while an upload reservation is preparing", () => {
  const h = harness(); h.queue.isPreparing = true; h.setNavigating(true);
  const rich = h.rich(); assert.equal(rich.disabled, true);
  (rich.onChange as (body: PostBody) => void)(reservedBody);
  assert.deepEqual(h.body(), originalBody);
});

test("archived articles reject controlled body updates", () => {
  const h = harness(true); h.queue.isPreparing = true;
  const rich = h.rich(); assert.equal(rich.disabled, true);
  (rich.onChange as (body: PostBody) => void)(reservedBody);
  assert.deepEqual(h.body(), originalBody);
});
