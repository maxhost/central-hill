import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

function load(file: URL, dependencies: Record<string, unknown>) {
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, { module: compiled, exports: compiled.exports, require: (name: string) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency ${name}`);
    return dependencies[name];
  } });
  return compiled.exports as Record<string, (props?: unknown) => Promise<unknown>>;
}

function preview(saved: unknown, locale = "en") {
  const calls: string[] = [];
  const working = { schemaVersion: 1, content: { headline: `Editable ${locale}` }, ogImageMediaId: null };
  const resolved = { content: working.content, media: {}, ogImage: null };
  let rendered: unknown;
  const dependencies: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    "next/navigation": { notFound: () => { throw new Error("not-found"); } },
    "next-intl": { NextIntlClientProvider: "section" },
    "next-intl/server": { getMessages: async () => ({}), setRequestLocale: () => {} },
    "@core/auth": { requireStaff: async () => { calls.push("auth"); } },
    "@slices/backoffice/contract": { PageEditorLivePreview: "div" },
    "@slices/settings/contract": { SiteHeader: "header", SiteFooter: "footer" },
    "../editorial-registry": { usesPageLocaleDrafts: (key: string) => key === "owners" },
    "../server/editorial-policy": { validEditorialSurface: (_key: string, surface: string) => surface === "page" },
    "../server/editorial-adapters": { getEditorialAdapter: () => ({ descriptor: { rootNode: { kind: "object", fields: [] }, externalSections: [] }, render: async (input: unknown) => { calls.push("render"); rendered = input; return null; } }) },
    "../server/editorial-preview": { getPageDraftPreview: async () => { calls.push("saved"); return saved; } },
    "./editorial-queries": { getPageEditorialModel: async () => { calls.push("working"); return { working }; } },
    "../server/editorial-publication": { resolveEditorialEnvelope: async (envelope: unknown, language: string) => { calls.push("resolve"); assert.strictEqual(envelope, working); assert.equal(language, locale); return resolved; } },
    "./live-preview-actions": { renderPageLivePreview: async () => ({ ok: true }) },
    "./home-contextual": { homeEditorBindingIds: [] },
    "./editorial-store": { readEditorialRows: async () => { assert.fail("Owners preview must not read About assignment rows"); } },
    "../guest-contact-content": { guestContactFormId: () => { assert.fail("Owners preview must not resolve a Guest assignment"); } },
    "../about-contact-content": { aboutContactFormId: () => { assert.fail("Owners preview must not resolve an About assignment"); } },
  };
  const route = load(new URL("../admin/editorial-preview-route.tsx", import.meta.url), dependencies).PageEditorialPreview!;
  return { route, calls, resolved, get rendered() { return rendered as { page: unknown }; } };
}

for (const locale of ["en", "es", "pt", "fr"]) {
  test(`an unsaved Owners page mounts the editor working envelope and live bridge (${locale})`, async () => {
    const harness = preview(null, locale);
    const tree = await harness.route({ pageKey: "owners", query: { locale, surface: "page", instance: "_R_9bn5ritqmitper9etb_-en-0-0" } });
    assert.ok(React.isValidElement(tree));
    assert.deepEqual(harness.calls, ["auth", "saved", "working", "resolve", "render"]);
    assert.strictEqual(harness.rendered.page, harness.resolved);
  });
}
test("saved preview content wins without creating a working fallback", async () => {
  const saved = { content: { headline: "Saved draft" }, media: {}, ogImage: null };
  const harness = preview(saved);
  await harness.route({ pageKey: "owners", query: { instance: "existing" } });
  assert.deepEqual(harness.calls, ["auth", "saved", "render"]);
  assert.strictEqual(harness.rendered.page, saved);
});
test("invalid preview keys, locale, instance and surfaces still fail after auth", async () => {
  for (const [pageKey, query] of [
    ["unknown", { instance: "valid" }], ["owners", { locale: "de", instance: "valid" }],
    ["owners", {}], ["owners", { instance: "invalid space" }], ["owners", { instance: "valid", surface: "unknown" }],
  ] as const) {
    const harness = preview(null);
    await assert.rejects(() => harness.route({ pageKey, query }), /not-found/);
    assert.deepEqual(harness.calls, ["auth"]);
  }
});
test("admin not-found renders content inside an existing document without nested html/body", () => {
  const loaded = load(new URL("../../../app/(admin)/not-found.tsx", import.meta.url), {
    "react/jsx-runtime": jsxRuntime,
    "next/link": { __esModule: true, default: "a" },
  });
  const content = loaded.default!() as unknown as React.ReactNode;
  const html = renderToStaticMarkup(<html lang="en"><body>{content}</body></html>);
  assert.equal((html.match(/<html/g) ?? []).length, 1);
  assert.equal((html.match(/<body/g) ?? []).length, 1);
  assert.match(html, /Page not found/);
  assert.match(html, /href="\/admin\/pages"/);
});
