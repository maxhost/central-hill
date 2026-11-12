import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyServiceEnvelope, serviceLocalizedEqual, serviceSharedContent } from "../locale-content";
import type { ServiceEditorialModel } from "../editorial-types";
import { SERVICE_EDITOR_LOCALES, SERVICE_SHARED_KEYS } from "../editorial-types";
import { checkServiceEnvelope } from "../server/locale-validation";
import { applyServiceModel, changeServiceForm, createServiceWorkspace, serviceAnyFormDirty, serviceFormEnvelope, serviceLocaleFormDirty } from "../admin/locale-form-state";
const category="e7800000-0000-4000-8000-000000000001",formId="c7800000-0000-4000-8000-000000000001";
function model(): ServiceEditorialModel {
  const envelope=emptyServiceEnvelope(category);envelope.content.name="Service";envelope.content.enquiry_form_id=formId;
  return {id:category,status:"draft",slugByLocale:{en:"service"},previews:{},shared:{revision:0,content:serviceSharedContent(envelope.content)},locales:Object.fromEntries(SERVICE_EDITOR_LOCALES.map(locale=>[locale,{locale,revision:1,templateRevision:locale==="en"?null:1,published:null,draft:null,working:{...structuredClone(envelope),localeMode:locale==="en"?"custom":"inherit"}}])) as ServiceEditorialModel["locales"]};
}
test("service assignment is optional nullable and never enters live common values",()=>{
  const empty=emptyServiceEnvelope(category);assert.equal(Object.hasOwn(empty.content,"enquiry_form_id"),false);
  assert.ok(checkServiceEnvelope(empty).envelope);
  for(const id of [null,formId]) {empty.content.enquiry_form_id=id;assert.ok(checkServiceEnvelope(empty).envelope);}
  empty.content.enquiry_form_id="invalid";assert.ok(checkServiceEnvelope(empty).errors.enquiry_form_id);
  assert.equal(SERVICE_SHARED_KEYS.some(key=>String(key)==="enquiry_form_id"),false);
  assert.equal(Object.hasOwn(serviceSharedContent(model().locales.en.working.content),"enquiry_form_id"),false);
});
test("EN selection edits are dirty only in EN; target payload and inherit mode remain independent",()=>{
  let workspace=createServiceWorkspace(model(),category);assert.equal(serviceAnyFormDirty(workspace),false);
  for(const locale of ["es","pt","fr"] as const){assert.equal(Object.hasOwn(workspace.locales[locale].working,"enquiry_form_id"),false);assert.equal(serviceFormEnvelope(workspace,locale).localeMode,"inherit");}
  workspace=changeServiceForm(workspace,"en",{...workspace.locales.en.working,enquiry_form_id:null});
  assert.equal(serviceLocaleFormDirty(workspace,"en"),true);
  for(const locale of ["es","pt","fr"] as const){assert.equal(serviceLocaleFormDirty(workspace,locale),false);assert.equal(serviceFormEnvelope(workspace,locale).localeMode,"inherit");assert.equal(Object.hasOwn(serviceFormEnvelope(workspace,locale).content,"enquiry_form_id"),false);}
  const before=model().locales.en.working.content,after={...before,enquiry_form_id:null};assert.equal(serviceLocalizedEqual(before,after),true);
});
test("target save keeps unsaved EN selection and EN save keeps custom target text",()=>{
  let workspace=createServiceWorkspace(model(),category);
  workspace=changeServiceForm(workspace,"en",{...workspace.locales.en.working,enquiry_form_id:null});
  workspace=changeServiceForm(workspace,"pt",{...workspace.locales.pt.working,name:"Texto próprio"});
  workspace=applyServiceModel(workspace,"es",model());assert.equal(workspace.locales.en.working.enquiry_form_id,null);assert.equal(workspace.locales.pt.working.name,"Texto próprio");
  const incoming=model();incoming.locales.en.working.content.enquiry_form_id=null;incoming.locales.en.revision=2;
  workspace=applyServiceModel(workspace,"en",incoming);assert.equal(workspace.locales.pt.working.name,"Texto próprio");assert.equal(serviceFormEnvelope(workspace,"pt").localeMode,"custom");
});
