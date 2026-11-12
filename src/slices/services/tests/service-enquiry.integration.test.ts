import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { test } from "node:test";
import { sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { HEADER_CONTACT_LOCK } from "@slices/forms/contract";
import { createBlueprint } from "@slices/forms/contract";
import { emptyServiceEnvelope, serviceSharedContent } from "../locale-content";
import type { ServiceEditorialModel, ServiceEditorialResult } from "../editorial-types";
import { readServiceEditorialModel } from "../server/locale-model";
import { saveServiceDraft, publishServiceDraft, setServiceArchived } from "../server/locale-store";
import { readServiceEnquiryAssignment, serviceEnquiryAssignmentGuard, serviceEnquiryUsageGuard, serviceEnquiryPaths } from "../server/enquiry-assignment";
import { loadServicePublications } from "../server/locale-public";
const enabled=process.env.SERVICE_ENQUIRY_DB_TEST==="1";
const ownDB="serviceenquiryservicesqa20261112";
function success(result:ServiceEditorialResult):ServiceEditorialModel{assert.equal(result.ok,true,JSON.stringify(result));if(!result.ok)throw Error("Service failed");return result.model;}
function request(model:ServiceEditorialModel,locale:"en"|"es"|"pt"|"fr",payload=structuredClone(model.locales[locale].working)){return {serviceId:model.id,locale,expectedRevision:model.locales[locale].revision,templateRevision:model.locales[locale].templateRevision,expectedSharedRevision:model.shared.revision,payload};}
async function publish(model:ServiceEditorialModel,locale:"en"|"es"|"pt"|"fr"="en"){return success(await publishServiceDraft({serviceId:model.id,locale,expectedRevision:model.locales[locale].revision},"own-service-test"));}

test("Service actual Save/Publish: creation, EN-only authority, omission/null, target ownership, invalid fallback, routing and archives",{skip:!enabled},async()=>{
 const url=new URL(process.env.DATABASE_URL!);assert.deepEqual([url.hostname,url.pathname,url.username],[ownDB+".local","/"+ownDB,ownDB]);
 assert.deepEqual((await db.execute(sql`select current_database() as database,current_user as role`)).rows[0],{database:ownDB,role:ownDB});
 assert.equal((await db.execute(sql`select current_setting('transaction_isolation') as isolation`)).rows[0]?.isolation,"read committed");
 Object.assign(globalThis,{__incrementalCache:{generateCacheKey:async(key:string)=>key,get:async()=>null,set:async()=>undefined}});
 const category=randomUUID(),photo=randomUUID(),formA=randomUUID(),formB=randomUUID(),serviceId=randomUUID(),secondId=randomUUID(),invalidNew=randomUUID(),slug="own-service-enquiry-"+serviceId.slice(0,8);
 const seed=emptyServiceEnvelope(category);Object.assign(seed.content,{name:"Own service",excerpt:"Own excerpt",body:"Own body",booking_type:"enquiry",cover_media_id:photo,enquiry_form_id:formA.toUpperCase()});
 try {
  await db.execute(sql`insert into service_category(id,slug,icon)values(${category}::uuid,${slug},'car')`);
  await db.execute(sql`insert into media_asset(id,r2_key,mime,width,height)values(${photo}::uuid,${"own-service-enquiry/"+photo+".png"},'image/png',10,10)`);
  for(const id of [formA,formB])await db.execute(sql`insert into form_definition(id,name,template,recipient,definition)values(${id}::uuid,'Own service Form','newsletter','own@example.test',${JSON.stringify(createBlueprint("newsletter"))}::jsonb)`);
  const bad=structuredClone(seed);bad.content.enquiry_form_id=randomUUID();
  const invalid=await saveServiceDraft({serviceId:invalidNew,locale:"en",expectedRevision:0,templateRevision:null,expectedSharedRevision:0,payload:bad,slug:slug+"-bad"},"own-service-test");assert.equal(invalid.ok,false);
  assert.equal((await db.execute(sql`select count(*)::int as n from service where id=${invalidNew}::uuid`)).rows[0]?.n,0,"Invalid first assignment reserves no identity");
  let model=success(await saveServiceDraft({serviceId,locale:"en",expectedRevision:0,templateRevision:null,expectedSharedRevision:0,payload:seed,slug},"own-service-test"));
  assert.equal(model.status,"draft");assert.equal(await readServiceEnquiryAssignment(serviceId),null);assert.equal(Object.hasOwn(model.shared.content,"enquiry_form_id"),false);
  assert.equal((await db.execute(sql`select ${serviceEnquiryUsageGuard(formA)} as used`)).rows[0]?.used,true,"Uppercase draft reserves form");
  model=await publish(model);const published=await readServiceEnquiryAssignment(serviceId);assert.ok(published);assert.equal(published.formId,formA);
  assert.equal((await db.execute(sql`select ${serviceEnquiryAssignmentGuard(serviceId,"en",formA,published.identity)} as assigned`)).rows[0]?.assigned,true);
  assert.equal((await db.execute(sql`select ${serviceEnquiryAssignmentGuard(serviceId,"pt",formA,published.identity)} as assigned`)).rows[0]?.assigned,false,"New target not published yet");
  for(const locale of ["es","pt","fr"] as const){const payload=structuredClone(model.locales[locale].working);delete payload.content.enquiry_form_id;model=success(await saveServiceDraft(request(model,locale,payload),"own-service-test"));assert.equal(model.locales[locale].draft?.localeMode,"inherit");assert.equal(Object.hasOwn(model.locales[locale].draft!.content,"enquiry_form_id"),false);model=await publish(model,locale);}
  assert.equal((await db.execute(sql`select ${serviceEnquiryAssignmentGuard(serviceId,"pt",formA,published.identity)} as assigned`)).rows[0]?.assigned,true);
  const targetsBefore=(await db.execute(sql`select locale,published from service_locale_content where service_id=${serviceId}::uuid and locale<>'en' order by locale`)).rows;
  const target=structuredClone(model.locales.pt.working);target.content.enquiry_form_id=formB;
  const forged=await saveServiceDraft(request(model,"pt",target),"own-service-test");assert.equal(forged.ok,false);if(!forged.ok&&forged.error==="validation")assert.ok(forged.fieldErrors.enquiry_form_id);
  const omitted=structuredClone(model.locales.en.working);delete omitted.content.enquiry_form_id;
  model=success(await saveServiceDraft(request(model,"en",omitted),"own-service-test"));assert.equal(model.locales.en.draft?.content.enquiry_form_id?.toLowerCase(),formA);assert.equal((await readServiceEnquiryAssignment(serviceId))?.identity,published.identity);
  const changed=structuredClone(model.locales.en.working);changed.content.enquiry_form_id=formB;model=success(await saveServiceDraft(request(model,"en",changed),"own-service-test"));assert.equal((await readServiceEnquiryAssignment(serviceId))?.formId,formA,"EN draft is private despite shared Save");
  assert.equal((await db.execute(sql`select ${serviceEnquiryUsageGuard(formA)} as a,${serviceEnquiryUsageGuard(formB)} as b`)).rows[0]?.a,true);assert.equal((await db.execute(sql`select ${serviceEnquiryUsageGuard(formB)} as b`)).rows[0]?.b,true);
  model=await publish(model);const b=await readServiceEnquiryAssignment(serviceId);assert.ok(b);assert.equal(b.formId,formB);assert.notEqual(b.identity,published.identity);
  assert.deepEqual((await db.execute(sql`select locale,published from service_locale_content where service_id=${serviceId}::uuid and locale<>'en' order by locale`)).rows,targetsBefore,"EN publication leaves all target snapshots exact");
  assert.ok((await serviceEnquiryPaths(formB)).includes("/pt/services/"+slug));
  // Same Form in another service must have a different identity and stable origin.
  const second=structuredClone(seed);second.content.enquiry_form_id=formB;
  let other=success(await saveServiceDraft({serviceId:secondId,locale:"en",expectedRevision:0,templateRevision:null,expectedSharedRevision:0,payload:second,slug:slug+"-second"},"own-service-test"));other=await publish(other);const otherAssignment=await readServiceEnquiryAssignment(secondId);assert.ok(otherAssignment);assert.notEqual(otherAssignment.identity,b.identity);
  assert.equal((await db.execute(sql`select ${serviceEnquiryAssignmentGuard(serviceId,"en",formB,otherAssignment.identity)} as assigned`)).rows[0]?.assigned,false);
  // Invalid optional assignment never removes the service's published copy.
  await db.execute(sql`update service_locale_content set published=jsonb_set(published,'{content,enquiry_form_id}','"not-a-uuid"'::jsonb)where service_id=${serviceId}::uuid and locale='en'`);
  assert.equal(await readServiceEnquiryAssignment(serviceId),null);assert.equal((await loadServicePublications([serviceId],"en")).get(serviceId)?.content.name,"Own service");
  await db.execute(sql`update service_locale_content set published=jsonb_set(published,'{content,enquiry_form_id}',${JSON.stringify(formB)}::jsonb)where service_id=${serviceId}::uuid and locale='en'`);
  model=(await readServiceEditorialModel(serviceId))!;
  const clear=structuredClone(model.locales.en.working);clear.content.enquiry_form_id=null;model=success(await saveServiceDraft(request(model,"en",clear),"own-service-test"));assert.equal((await readServiceEnquiryAssignment(serviceId))?.formId,formB);model=await publish(model);assert.equal(await readServiceEnquiryAssignment(serviceId),null);
  // Existing external/none live shared semantics remain, assignment does not alter type.
  const nonEnquiry=structuredClone(other.locales.en.working);nonEnquiry.content.booking_type="none";other=success(await saveServiceDraft(request(other,"en",nonEnquiry),"own-service-test"));assert.equal(other.shared.content.booking_type,"none");assert.equal(await readServiceEnquiryAssignment(secondId),null);assert.equal((await db.execute(sql`select ${serviceEnquiryUsageGuard(formB)} as used`)).rows[0]?.used,true);
  other=success(await setServiceArchived(secondId,true,"own-service-test"));assert.equal(await readServiceEnquiryAssignment(secondId),null);assert.equal((await db.execute(sql`select ${serviceEnquiryUsageGuard(formB)} as used`)).rows[0]?.used,true,"Archive does not release configured Form");
  const external=structuredClone(other.locales.en.working);external.content.booking_type="external";external.content.cta_url="https://example.test/booking";external.content.cta_label="Book outside";other=success(await saveServiceDraft(request(other,"en",external),"own-service-test"));assert.equal(other.shared.content.booking_type,"external");assert.equal(await readServiceEnquiryAssignment(secondId),null);
  assert.equal(Object.hasOwn(serviceSharedContent(other.locales.en.working.content),"enquiry_form_id"),false);
 } finally {
  await db.execute(sql`delete from service where id=any(${"{"+[serviceId,secondId,invalidNew].join(",")+"}"}::uuid[])`);
  await db.execute(sql`delete from slug where entity_type='service' and entity_id=any(${"{"+[serviceId,secondId,invalidNew].join(",")+"}"}::uuid[])`);
  await db.execute(sql`delete from service_category where id=${category}::uuid`);
  await db.execute(sql`delete from media_asset where id=${photo}::uuid`);
  await db.execute(sql`delete from form_definition where id=any(${"{"+[formA,formB].join(",")+"}"}::uuid[])`);
 }
});


for (const operation of ["Save", "Publish"] as const) test(`Service ${operation} waits for shared Form lock and rechecks a fresh form revision/status`,{skip:!enabled},async()=>{
 const url=new URL(process.env.DATABASE_URL!);assert.deepEqual([url.hostname,url.pathname,url.username],[ownDB+".local","/"+ownDB,ownDB]);
 assert.deepEqual((await db.execute(sql`select current_database() as database,current_user as role`)).rows[0],{database:ownDB,role:ownDB});
 assert.equal((await db.execute(sql`select current_setting('transaction_isolation') as isolation`)).rows[0]?.isolation,"read committed");
 Object.assign(globalThis,{__incrementalCache:{generateCacheKey:async(key:string)=>key,get:async()=>null,set:async()=>undefined}});
 const category=randomUUID(),photo=randomUUID(),formId=randomUUID(),serviceId=randomUUID(),slug="own-service-lock-"+serviceId.slice(0,8);
 let finishBlocker:(()=>Promise<void>)|undefined;
 let mutation:Promise<ServiceEditorialResult>|undefined;
 try {
  await db.execute(sql`insert into service_category(id,slug,icon)values(${category}::uuid,${slug},'car')`);
  await db.execute(sql`insert into media_asset(id,r2_key,mime,width,height)values(${photo}::uuid,${"own-service-enquiry/"+photo+".png"},'image/png',10,10)`);
  await db.execute(sql`insert into form_definition(id,name,template,recipient,definition)values(${formId}::uuid,'Own lock Form','newsletter','own@example.test',${JSON.stringify(createBlueprint("newsletter"))}::jsonb)`);
  const seed=emptyServiceEnvelope(category);Object.assign(seed.content,{name:"Own lock service",excerpt:"Own excerpt",body:"Own body",booking_type:"enquiry",cover_media_id:photo});
  let model=success(await saveServiceDraft({serviceId,locale:"en",expectedRevision:0,templateRevision:null,expectedSharedRevision:0,payload:seed,slug},"own-service-test"));model=await publish(model);
  const payload=structuredClone(model.locales.en.working);payload.content.enquiry_form_id=formId;
  if(operation==="Publish")model=success(await saveServiceDraft(request(model,"en",payload),"own-service-test"));
  const before=(await db.execute(sql`select revision,draft,published from service_locale_content where service_id=${serviceId}::uuid and locale='en'`)).rows[0];
  // An interactive own-DB transaction holds the common lock until this test
  // observes the Service mutation waiting. No sleep duration decides the race.
  const child=spawn("/opt/homebrew/opt/libpq/bin/psql",["-X","-qAt","-v","ON_ERROR_STOP=1"],{env:{...process.env,PGHOST:"127.0.0.1",PGPORT:"5658",PGDATABASE:ownDB,PGUSER:ownDB,PGPASSWORD:decodeURIComponent(url.password),PGSSLMODE:"disable"},stdio:["pipe","pipe","pipe"]});
  const lines=createInterface({input:child.stdout});
  let stderr="";child.stderr.on("data",data=>{stderr+=data;});
  const exited=new Promise<void>((resolve,reject)=>{child.on("error",reject);child.on("exit",code=>code===0?resolve():reject(Error("Own lock holder failed: "+stderr.slice(0,150))));});
  const held=new Promise<void>((resolve,reject)=>{lines.on("line",line=>{if(line==="HELD")resolve();});child.once("error",reject);child.once("exit",code=>{if(code)reject(Error("Own lock holder exited before readiness"));});});
  let released=false;
  finishBlocker=async()=>{if(!released){released=true;child.stdin.end(`update form_definition set ${operation==="Save"?"status='archived',":""}revision=revision+1 where id='${formId}'::uuid;\nCOMMIT;\n\\q\n`);}await exited;};
  child.stdin.write(`BEGIN ISOLATION LEVEL READ COMMITTED;\nSELECT pg_advisory_xact_lock(hashtextextended('${HEADER_CONTACT_LOCK}',0));\nSELECT 'HELD';\n`);
  await held;
  mutation=operation==="Save" ? saveServiceDraft(request(model,"en",payload),"own-service-test")
   : publishServiceDraft({serviceId,locale:"en",expectedRevision:model.locales.en.revision},"own-service-test");
  let queued=false;
  for(let n=0;n<100;n++){const lock=await db.execute(sql`select exists(select 1 from pg_locks where locktype='advisory' and not granted and objsubid=1 and classid=((hashtextextended(${HEADER_CONTACT_LOCK},0)>>32)&4294967295)::oid and objid=(hashtextextended(${HEADER_CONTACT_LOCK},0)&4294967295)::oid and database=(select oid from pg_database where datname=current_database())) as queued`);if(lock.rows[0]?.queued===true){queued=true;break;}await new Promise(resolve=>setTimeout(resolve,10));}
  assert.equal(queued,true,"Service mutation really queued behind the common lock");
  await finishBlocker();const result=await mutation;assert.equal(result.ok,false);if(!result.ok)assert.equal(result.error,"conflict");
  assert.deepEqual((await db.execute(sql`select revision,draft,published from service_locale_content where service_id=${serviceId}::uuid and locale='en'`)).rows[0],before,"Fresh guard rejects without changing draft/publication/revision");
  assert.equal(await readServiceEnquiryAssignment(serviceId),null);
 } finally {
  if(finishBlocker)await finishBlocker();
  if(mutation)await mutation;
  await db.execute(sql`delete from service where id=${serviceId}::uuid`);
  await db.execute(sql`delete from slug where entity_type='service' and entity_id=${serviceId}::uuid`);
  await db.execute(sql`delete from service_category where id=${category}::uuid`);
  await db.execute(sql`delete from media_asset where id=${photo}::uuid`);
  await db.execute(sql`delete from form_definition where id=${formId}::uuid`);
 }
});
