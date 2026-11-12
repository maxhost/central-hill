import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { createBlueprint } from "../domain";
import type { PublicFormModel, PublicContactInput } from "../public-types";
import type { FormRuntimeProps } from "../ui/form-runtime";

test("public island submits only selected model identity and retains one idempotency key across retries", async () => {
  let runtime: FormRuntimeProps | undefined;
  const calls: PublicContactInput[] = [];
  const model: PublicFormModel = { id: crypto.randomUUID(), revision: 2, locale: "pt", fingerprint: "f".repeat(64), definition: createBlueprint("contact") };
  const dependencies: Record<string, unknown> = {
    react: React, "react/jsx-runtime": jsx, "next-intl": { useTranslations: () => (key: string) => key },
    "../server/public-actions": { submitHeaderContactForm: async (input: PublicContactInput) => { calls.push(input); return { ok: false, code: "server" }; } },
    "./form-runtime": { FormRuntime: (props: FormRuntimeProps) => { runtime = props; return <form />; } },
  };
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL("../ui/public-contact-form.tsx", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(code, { module: compiled, exports: compiled.exports, crypto, require(name: string) { assert.ok(name in dependencies, name); return dependencies[name]; } });
  const Component = (compiled.exports as typeof import("../ui/public-contact-form")).PublicContactForm;
  const html = renderToStaticMarkup(<Component model={model} />);
  assert.match(html, /data-public-contact-form=/); assert.doesNotMatch(html, /recipient/);
  assert.ok(runtime); assert.equal(runtime.publicMode, true); assert.equal(runtime.showHeading, false);
  const values = { [model.definition.fields[0]!.id]: "Own answer" };
  await runtime.onSubmit(values, new FormData()); await runtime.onSubmit(values, new FormData());
  assert.equal(calls.length, 2); assert.equal(calls[0]!.submissionKey, calls[1]!.submissionKey);
  assert.equal(calls[0]!.id, model.id); assert.equal(calls[0]!.expectedRevision, 2); assert.equal(calls[0]!.locale, "pt");
  assert.equal(calls[0]!.fingerprint, model.fingerprint); assert.equal(calls[0]!.honeypot, "");
  assert.equal(Object.hasOwn(calls[0]!, "recipient"), false);
  runtime.onReset?.(); await runtime.onSubmit(values, new FormData()); assert.notEqual(calls[2]!.submissionKey, calls[0]!.submissionKey);
});


test("About island submits only its published assignment identity; private preview has no action", async () => {
  let runtime: FormRuntimeProps | undefined;
  const calls: PublicContactInput[] = [];
  const model: PublicFormModel = { id: crypto.randomUUID(), revision: 3, locale: "fr", fingerprint: "f".repeat(64), definition: createBlueprint("contact"), placement: "about-contact", assignmentIdentity: "a".repeat(32) };
  const dependencies: Record<string,unknown> = {
    react: React, "react/jsx-runtime": jsx, "next-intl": { useTranslations: () => (key:string) => key },
    "../server/public-actions": { submitHeaderContactForm: async () => { throw Error("Wrong placement"); }, submitAboutContactForm: async (input:PublicContactInput) => { calls.push(input);return {ok:true}; } },
    "./form-runtime": { FormRuntime: (props:FormRuntimeProps) => {runtime=props;return <form/>;} },
  };
  const compiled={exports:{}};
  const code=ts.transpileModule(readFileSync(new URL("../ui/public-contact-form.tsx",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  runInNewContext(code,{module:compiled,exports:compiled.exports,crypto,require(name:string){assert.ok(name in dependencies,name);return dependencies[name];}});
  const Component=(compiled.exports as typeof import("../ui/public-contact-form")).PublicContactForm;
  renderToStaticMarkup(<Component model={model}/>);assert.ok(runtime);
  await runtime.onSubmit({},new FormData());assert.equal(calls.length,1);assert.equal(calls[0]?.assignmentIdentity,model.assignmentIdentity);
  const html=renderToStaticMarkup(<Component model={model} preview/>);assert.match(html,/inert/);assert.match(html,/data-form-preview/);
  assert.equal(runtime.showHeading,false);await runtime.onSubmit({},new FormData());assert.equal(calls.length,1);
});


test("All four public placements route to explicit actions with published identity and inert previews",async()=>{
  let runtime:FormRuntimeProps|undefined;
  const calls:{placement:string,input:PublicContactInput}[]=[];
  const dependencies:Record<string,unknown>={
    react:React,"react/jsx-runtime":jsx,"next-intl":{useTranslations:()=>(key:string)=>key},
    "../server/public-actions":{
      submitHeaderContactForm:async(input:PublicContactInput)=>{calls.push({placement:"header-contact",input});return{ok:true};},
      submitAboutContactForm:async(input:PublicContactInput)=>{calls.push({placement:"about-contact",input});return{ok:true};},
      submitGuestOwnerContactForm:async(input:PublicContactInput)=>{calls.push({placement:"guests-dual-cta",input});return{ok:true};},
      submitRealEstateEnquiryForm:async(input:PublicContactInput)=>{calls.push({placement:"real-estate-enquiry",input});return{ok:true};},
    },
    "./form-runtime":{FormRuntime:(props:FormRuntimeProps)=>{runtime=props;return<form/>;}},
  };
  const compiled={exports:{}};
  const code=ts.transpileModule(readFileSync(new URL("../ui/public-contact-form.tsx",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  runInNewContext(code,{module:compiled,exports:compiled.exports,crypto,require(name:string){assert.ok(name in dependencies,name);return dependencies[name];}});
  const Component=(compiled.exports as typeof import("../ui/public-contact-form")).PublicContactForm;
  for(const placement of ["header-contact","about-contact","guests-dual-cta","real-estate-enquiry"] as const){
    const model:PublicFormModel={id:crypto.randomUUID(),revision:2,locale:"es",fingerprint:"f".repeat(64),definition:createBlueprint("newsletter"),placement,assignmentIdentity:"c".repeat(32)};
    renderToStaticMarkup(<Component model={model}/>);assert.ok(runtime);await runtime.onSubmit({},new FormData());
    assert.equal(calls.at(-1)?.placement,placement);assert.equal(calls.at(-1)?.input.assignmentIdentity,placement==="header-contact"?undefined:model.assignmentIdentity);
    const before=calls.length,html=renderToStaticMarkup(<Component model={model} preview/>);assert.match(html,/inert/);await runtime.onSubmit({},new FormData());assert.equal(calls.length,before);
  }
});
