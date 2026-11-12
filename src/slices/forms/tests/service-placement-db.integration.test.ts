import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { neon } from "@neondatabase/serverless";
import { parse } from "dotenv";
import { eq, sql, type SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import ts from "typescript";
import { z } from "zod";
import * as domain from "../domain";
import * as validation from "../validation";
import { form_definition, form_test_submission } from "../schema";
import { lead, lead_field } from "../../leads/schema";
import { buildContactSnapshot, publicContactNotification } from "../server/public-notification";
import { validateAttachments } from "../server/attachments";
import type { PublicContactInput } from "../public-types";

const enabled = process.env.SERVICE_ENQUIRY_DB_TEST === "1";
const ownDatabase = "serviceenquiryunitqa20261112";
function load<T>(source: URL | string, dependencies: Record<string, unknown>): T {
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(source, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, { module: compiled, exports: compiled.exports, console, require(name: string) { assert.ok(Object.hasOwn(dependencies, name),name);return dependencies[name]; } });
  return compiled.exports as T;
}
function harness() {
  const config = parse(readFileSync(".env.local")), url = new URL(config.DATABASE_URL!);
  assert.deepEqual([url.hostname,url.pathname,url.username],[`${ownDatabase}.local`,`/${ownDatabase}`,ownDatabase]);
  const client = neon(url.href), dialect = new PgDialect();
  const db = { execute: async (query: SQL) => { const compiled=dialect.sqlToQuery(query);return { rows: await client.query(compiled.sql,compiled.params) }; } };
  const serialized = load<typeof import("../../../core/db/serialized")>(new URL("../../../core/db/serialized.ts",import.meta.url), { "server-only":{},"drizzle-orm/pg-core":{PgDialect},"./client":{sqlClient:client} });
  const services = load<typeof import("../../services/server/enquiry-assignment")>(process.env.SERVICES_ASSIGNMENT_SOURCE ?? new URL("../../services/server/enquiry-assignment.ts",import.meta.url), {
    "server-only":{},"drizzle-orm":{sql},"next/cache":{unstable_cache:(fn:unknown)=>fn},"@core/db/client":{db},"../contract":{SERVICE_TAGS:{list:"service-list"}},
  });
  const formGuard = (id: string,revision: number) => sql`exists(select 1 from form_definition where id=${id}::uuid and revision=${revision} and status='draft')`;
  const captures = load<typeof import("../../leads/server/capture-form-contact")>(new URL("../../leads/server/capture-form-contact.ts",import.meta.url), {
    "server-only":{},"drizzle-orm":{sql},"@core/db/serialized":serialized,"@slices/forms/contract":{HEADER_CONTACT_LOCK:"header-contact:v1"},"../schema":{lead,lead_field},
  });
  const archives=load<typeof import("../server/actions")>(new URL("../server/actions.ts",import.meta.url),{
    "drizzle-orm":{eq,sql},"next/cache":{revalidatePath:()=>undefined},"zod":{z},"@core/auth":{requireStaff:async()=>({userId:"own-service-test"})},"@core/db/client":{db},"@core/db/serialized":serialized,
    "@slices/settings/server-contract":{headerContactUsageGuard:()=>sql`false`},"@slices/pages/server-contract":{aboutContactUsageGuard:()=>sql`false`,guestContactUsageGuard:()=>sql`false`,realEstateEnquiryUsageGuard:()=>sql`false`},"@slices/services/server-contract":services,
    "../public-types":{HEADER_CONTACT_LOCK:"header-contact:v1"},"./public-publish":{refreshPublicForm:async()=>undefined},"@core/email":{},"@core/i18n":{},"../domain":domain,"../schema":{form_definition,form_test_submission},"../validation":validation,"./queries":{},"./notification":{},"./attachments":{},
  });
  const state={sent:[] as unknown[],rateCalls:0};
  const actions=load<typeof import("../server/public-actions")>(new URL("../server/public-actions.ts",import.meta.url),{
    "node:net":{isIP},"next/headers":{headers:async()=>new Headers({"x-forwarded-for":"198.51.100.120","user-agent":"own-service-db-test"})},"drizzle-orm":{sql},"zod":{z},"@core/db/client":{db},
    "@core/email":{sendEmail:async(message:unknown)=>{state.sent.push(message);return{ok:true,id:"console"};}},"@slices/leads/server-contract":captures,
    "@slices/settings/server-contract":{headerContactAssignmentGuard:()=>sql`true`},"@slices/pages/server-contract":{aboutContactAssignmentGuard:()=>sql`true`,guestContactAssignmentGuard:()=>sql`true`,realEstateEnquiryAssignmentGuard:()=>sql`true`},"@slices/services/server-contract":services,
    "./public-queries":{assignableHeaderFormGuard:formGuard,readPublicFormSource:async(id:string,locale:string)=>{
      const [row]=await client`select id,name,revision,recipient,definition,status from form_definition where id=${id}::uuid`;
      if(!row||row.status!=="draft")return null;
      const definition=validation.readStoredBlueprint(row.definition),fingerprint=createHash("sha256").update(JSON.stringify({id,revision:row.revision,locale,definition})).digest("hex");
      return{form:row,definition,fingerprint};
    }},"./attachments":{validateAttachments},"../validation":validation,"./public-rate-limit":{admitPublicContact:async()=>{state.rateCalls++;return true;}},"./public-notification":{buildContactSnapshot,publicContactNotification},
  });
  return{client,db,serialized,services,captures,archives,actions,state,formGuard};
}
type Harness=ReturnType<typeof harness>;
async function ownFixture(h:Harness){
  const ids={category:crypto.randomUUID(),form:crypto.randomUUID(),a:crypto.randomUUID(),b:crypto.randomUUID()};
  const definition=domain.createBlueprint("newsletter");
  await h.client`insert into service_category(id,slug)values(${ids.category}::uuid,${'own-service-forms-'+ids.category})`;
  await h.client`insert into form_definition(id,name,template,recipient,definition)values(${ids.form}::uuid,'Own service Form','newsletter','own@example.test',${JSON.stringify(definition)}::jsonb)`;
  for(const id of [ids.a,ids.b]){
    await h.client`insert into service(id,category_id,slug,status,booking_type)values(${id}::uuid,${ids.category}::uuid,${'own-service-'+id},'published','enquiry')`;
    const envelope={schemaVersion:1,localeMode:"custom",content:{enquiry_form_id:ids.form.toUpperCase()}};
    for(const locale of ['en','es','pt','fr']){
      await h.client`insert into service_locale_content(service_id,locale,published,published_at)values(${id}::uuid,${locale},${JSON.stringify(envelope)}::jsonb,clock_timestamp())`;
      await h.client`insert into slug(entity_type,entity_id,locale,slug)values('service',${id}::uuid,${locale},${'own-'+locale+'-'+id})`;
    }
  }
  const values=Object.fromEntries(definition.fields.map(field=>[field.id,field.type==='email'?'person@example.test':field.type==='checkbox'?true:'Own response']));
  const [stored]=await h.client`select definition from form_definition where id=${ids.form}::uuid`;
  const savedDefinition=validation.readStoredBlueprint(stored!.definition);
  const fingerprint=createHash('sha256').update(JSON.stringify({id:ids.form,revision:1,locale:'en',definition:savedDefinition})).digest('hex');
  const input:PublicContactInput={id:ids.form,expectedRevision:1,locale:'en',fingerprint,values,honeypot:'',submissionKey:crypto.randomUUID()};
  return{...ids,definition,input,async cleanup(){
    await h.client`delete from lead where form_snapshot->>'formId'=${ids.form}`;
    await h.client`delete from slug where entity_type='service' and entity_id=any(${[ids.a,ids.b]}::uuid[])`;
    await h.client`delete from service where id=any(${[ids.a,ids.b]}::uuid[])`;
    await h.client`delete from service_category where id=${ids.category}::uuid`;
    await h.client`delete from form_definition where id=${ids.form}::uuid`;
  }};
}

test("Service DB: EN draft/published reserve forms even while hidden; targets are inert and identity follows publication only",{skip:!enabled},async()=>{
  const h=harness(),f=await ownFixture(h);
  try{
    assert.equal((await h.client`select current_database()as db,current_user as role`)[0]?.db,ownDatabase);
    const assignment=await h.services.readServiceEnquiryAssignment(f.a);assert.ok(assignment);assert.equal(assignment.formId,f.form);
    assert.equal((await h.db.execute(sql`select ${h.services.serviceEnquiryAssignmentGuard(f.a,'en',f.form,assignment.identity)} as assigned`)).rows[0]?.assigned,true);
    const b=await h.services.readServiceEnquiryAssignment(f.b);assert.ok(b);assert.notEqual(b.identity,assignment.identity,'Stable service UUID contributes to assignment identity');
    let result=await h.archives.archiveForm(f.form,1,true);assert.equal(result.ok,false);if(!result.ok)assert.match(result.error,/Services.*Booking/);
    await h.client`update service_locale_content set draft=published,revision=revision+1 where service_id=${f.a}::uuid and locale='en'`;
    assert.equal((await h.services.readServiceEnquiryAssignment(f.a))?.identity,assignment.identity);
    await h.client`update service_locale_content set published_at=clock_timestamp() where service_id=${f.a}::uuid and locale='en'`;
    assert.notEqual((await h.services.readServiceEnquiryAssignment(f.a))?.identity,assignment.identity);
    await h.client`update service set status='archived',booking_type='none' where id=any(${[f.a,f.b]}::uuid[])`;
    result=await h.archives.archiveForm(f.form,1,true);assert.equal(result.ok,false,'Archived or non-enquiry services retain reservation');
    assert.equal(await h.services.readServiceEnquiryAssignment(f.a),null);
    await h.client`update service_locale_content set published=null,draft=null where locale='en' and service_id=any(${[f.a,f.b]}::uuid[])`;
    const paths=await h.services.serviceEnquiryPaths(f.form);assert.equal(paths.length,0,'Target refs are not usage');
    result=await h.archives.archiveForm(f.form,1,true);assert.equal(result.ok,true,'Only target references remain, so archive is permitted');
  }finally{await f.cleanup();}
});

test("Service DB: shared-Form captures are atomic contact leads, concurrent winner only notifies and keys cannot cross services or four old placements",{skip:!enabled},async()=>{
  const h=harness(),f=await ownFixture(h);
  try{
    const a=await h.services.readServiceEnquiryAssignment(f.a),b=await h.services.readServiceEnquiryAssignment(f.b);assert.ok(a&&b);
    const input={...f.input,serviceId:f.a,assignmentIdentity:a.identity};
    const results=await Promise.all([h.actions.submitServiceEnquiryForm(input),h.actions.submitServiceEnquiryForm(input)]);assert.equal(results.every(result=>result.ok),true,JSON.stringify(results));assert.equal(h.state.sent.length,1);
    const [captured]=await h.client`select id,kind,source_page,marketing_consent,consent_at,form_snapshot from lead where submission_key=${input.submissionKey}::uuid`;
    assert.ok(captured);assert.equal(captured.kind,'contact');assert.equal(captured.source_page,`service:${f.a}`);assert.equal(captured.marketing_consent,false);
    const snapshot=captured.form_snapshot as ReturnType<typeof buildContactSnapshot>;assert.equal(snapshot.serviceId,f.a);assert.equal(snapshot.assignmentIdentity,a.identity);
    const fields=await h.client`select key,value from lead_field where lead_id=${captured.id}::uuid`;assert.ok(fields.length>=snapshot.fields.length);assert.equal(snapshot.fields[0]?.label,f.definition.fields[0]?.label);
    assert.equal((await h.actions.submitServiceEnquiryForm({...input,serviceId:f.b,assignmentIdentity:b.identity})).ok,false);
    const oldActions=[h.actions.submitHeaderContactForm,h.actions.submitAboutContactForm,h.actions.submitGuestOwnerContactForm,h.actions.submitRealEstateEnquiryForm];
    for(const [index,submit]of oldActions.entries()){
      const oldInput={...f.input,...(index?{assignmentIdentity:'d'.repeat(32)}:{})};
      assert.equal((await submit(oldInput)).ok,false,'Service key cannot replay at another placement');
      const oldKey=crypto.randomUUID();assert.equal((await submit({...oldInput,submissionKey:oldKey})).ok,true);
      assert.equal((await h.actions.submitServiceEnquiryForm({...input,submissionKey:oldKey})).ok,false,'Old placement key cannot replay as a Service');
    }
    const staleBefore=h.state.rateCalls;
    await h.client`update service_locale_content set published=null where service_id=${f.a}::uuid and locale='pt'`;
    assert.equal((await h.actions.submitServiceEnquiryForm({...input,locale:'pt'})).ok,false);assert.equal(h.state.rateCalls,staleBefore);
    const existing=h.state.sent.length;assert.equal((await h.actions.submitServiceEnquiryForm(input)).ok,true);assert.equal(h.state.sent.length,existing);
    const snapshotB={...snapshot,sourcePage:`service:${f.b}` as const,serviceId:f.b};
    assert.equal((await h.captures.captureFormContact({sourcePage:`service:${f.b}`,snapshot:snapshotB,submissionKey:input.submissionKey,email:null,ipAddress:null,userAgent:null},sql`true`)).status,'conflict','Source checks also reject cross-service keys with a forced identical payloadHash');
  }finally{await f.cleanup();}
});

test("Service DB: a capture queued behind the shared lock sees a fresh unassignment and cannot insert",{skip:!enabled},async()=>{
  const h=harness(),f=await ownFixture(h);
  try{
    const assignment=await h.services.readServiceEnquiryAssignment(f.a);assert.ok(assignment);
    const snapshot=buildContactSnapshot({id:f.form,name:'Own service Form',revision:1},f.definition,f.input.values,'en',f.input.fingerprint,[],{sourcePage:`service:${f.a}`,serviceId:f.a,assignmentIdentity:assignment.identity});
    // A separate transaction holds the same lock while making its unassignment
    // invisible until commit. The queued capture must read after that commit.
    const holding=h.client.transaction([
      h.client.query("select pg_advisory_xact_lock(hashtextextended($1,0))",['header-contact:v1']),
      h.client.query("update service_locale_content set published=jsonb_set(published,'{content,enquiry_form_id}','null'::jsonb),published_at=clock_timestamp()where service_id=$1::uuid and locale='en'",[f.a]),
      h.client.query("select pg_sleep(0.8)"),
    ],{isolationLevel:'ReadCommitted'});
    const started=Date.now();let seen=false;
    while(Date.now()-started<500){const [row]=await h.client`select exists(select 1 from pg_locks where locktype='advisory' and granted and pid<>pg_backend_pid() and database=(select oid from pg_database where datname=current_database()))as held`;if(row?.held===true){seen=true;break;}}
    assert.equal(seen,true,'The writer acquired its advisory transaction lock');
    const result=await h.captures.captureFormContact({sourcePage:`service:${f.a}`,submissionKey:f.input.submissionKey,snapshot,email:null,ipAddress:null,userAgent:null},sql`${h.services.serviceEnquiryAssignmentGuard(f.a,'en',f.form,assignment.identity)} and ${h.formGuard(f.form,1)}`);
    await holding;assert.equal(result.status,'stale');
    assert.equal((await h.client`select count(*)::int as n from lead where submission_key=${f.input.submissionKey}::uuid`)[0]?.n,0);
  }finally{await f.cleanup();}
});
