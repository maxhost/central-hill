import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import type { ReactNode } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { orMessage } from "../ui/or-message";

function harness(configured: boolean) {
  const calls: unknown[][] = [];
  const model = { id: "a8111111-1111-4111-8111-111111111111", revision: 1, fingerprint: "fixture", definition: {} };
  const wrap = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  const dependencies: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    "next-intl/server": { getTranslations: async () => (key: string) => key },
    "@slices/settings/contract": { getGlobals: async () => ({}) },
    "@slices/forms/server-contract": { readRealEstateEnquiryForm: async (...input: unknown[]) => { calls.push(input); return configured ? model : null; } },
    "@slices/forms/contract": { PublicContactForm: ({ preview }: { preview: boolean }) => <div inert={preview || undefined}><form data-configured><button>Form own submit</button></form></div> },
    "../contact-line": { enquiryContactLines: () => [{ label: "Direct", href: "mailto:direct@example.test", text: "direct@example.test" }] },
    "../or-message": { orMessage },
    "./static-form-card": { StaticFormCard: ({ children, ...props }: { children?: ReactNode; inert?: boolean }) => <form {...props} data-static>{children}</form> },
    "@core/ui": {
      EnquirySplit: ({ id, title, lede, contact, children }: { id: string; title: string; lede: string; contact: { title: string }; children: ReactNode }) => <section id={id}><h2>{title}</h2><p>{lede}</p><p>{contact.title}</p>{children}</section>,
      FormAccordion: wrap, FormField: wrap, FormGroup: wrap, FormInput: "input", FormNote: "p", FormRow: wrap,
      FormSelect: () => <select />, FormSubmit: "button", FormTextarea: "textarea",
    },
  };
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL("../ui/components/deal-enquiry-section.tsx", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(code, { module: compiled, exports: compiled.exports, require: (name: string) => { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name]; } });
  const render = (compiled.exports as { DealEnquirySection(input: unknown): Promise<ReactNode> }).DealEnquirySection;
  return { calls, render: async (preview = false) => renderToStaticMarkup(await render({ locale: "pt", preview, realEstateEnquiryFormId: model.id, content: { headline: "Own headline", lede: "Own lede", contact_title: "Own contacts", submit_label: "Legacy Page submit", note: "Legacy Page note" } })) };
}
for (const configured of [false, true]) test(`Real Estate enquiry ${configured ? "configured" : "legacy"} has one form and preserves section copy`, async () => {
  const h = harness(configured), html = await h.render();
  assert.equal((html.match(/<form\b/g) ?? []).length, 1, "The presentation frame must never nest a runtime form");
  assert.match(html, /id="deal-enquiry"/);
  for (const text of ["Own headline", "Own lede", "Own contacts"]) assert.ok(html.includes(text));
  assert.equal(html.includes("Form own submit"), configured);
  assert.equal(html.includes("Legacy Page submit"), !configured);
  assert.equal(html.includes("Legacy Page note"), !configured);
  assert.deepEqual(h.calls, [["pt"]], "Public render cannot receive the private override");
});
test("Real Estate configured and legacy previews are inert and resolve the explicit private override", async () => {
  for (const configured of [false, true]) {
    const h = harness(configured), html = await h.render(true);
    assert.match(html, /inert=""/);
    assert.deepEqual(h.calls, [["pt", "a8111111-1111-4111-8111-111111111111"]]);
    assert.equal((html.match(/<form\b/g) ?? []).length, 1);
  }
});
