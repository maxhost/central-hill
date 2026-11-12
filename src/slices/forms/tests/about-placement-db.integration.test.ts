import assert from "node:assert/strict";
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
import { testNotification } from "../server/notification";
import { validateAttachments } from "../server/attachments";

const guestEnabled=process.env.GUEST_CONTACT_DB_TEST === "1";
const enabled = process.env.ABOUT_CONTACT_DB_TEST === "1" || guestEnabled;
const ownDatabase=guestEnabled?"guestcontactunitqa20261112":"aboutcontactunitqa20261112";
function load<T>(source: URL, dependencies: Record<string, unknown>): T {
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(source,"utf8"), {compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  runInNewContext(code,{module:compiled,exports:compiled.exports,console,require(name:string){assert.ok(Object.hasOwn(dependencies,name),name);return dependencies[name];}});
  return compiled.exports as T;
}
function harness() {
  const config=parse(readFileSync(".env.local")),url=new URL(config.DATABASE_URL!);
  assert.deepEqual([url.hostname,url.pathname,url.username],[`${ownDatabase}.local`,`/${ownDatabase}`,ownDatabase]);
  const client=neon(url.href),dialect=new PgDialect();
  const db={execute:async(query:SQL)=>{const compiled=dialect.sqlToQuery(query);return {rows:await client.query(compiled.sql,compiled.params)};}};
  const serialized=load<typeof import("../../../core/db/serialized")>(new URL("../../../core/db/serialized.ts",import.meta.url),{"server-only":{},"drizzle-orm/pg-core":{PgDialect},"./client":{sqlClient:client}});
  const aboutPages=load<typeof import("../../pages/server-contract")>(new URL("../../pages/server/about-contact-assignment.ts",import.meta.url),{
    "server-only":{},"drizzle-orm":{sql},"next/cache":{unstable_cache:(fn:unknown)=>fn},"@core/db/client":{db},"../schema":{page_locale_content:sql.identifier("page_locale_content")},"../editorial-registry":{pageLocaleTag:(key:string,locale:string)=>`page:${key}:${locale}`},
  });
  const guestPages=load<typeof import("../../pages/server-contract")>(new URL("../../pages/server/guest-contact-assignment.ts",import.meta.url),{
    "server-only":{},"drizzle-orm":{sql},"next/cache":{unstable_cache:(fn:unknown)=>fn},"@core/db/client":{db},"../schema":{page_locale_content:sql.identifier("page_locale_content")},"../editorial-registry":{pageLocaleTag:(key:string,locale:string)=>`page:${key}:${locale}`},
  });
  const pages={...aboutPages,...guestPages};
  const actions=load<typeof import("../server/actions")>(new URL("../server/actions.ts",import.meta.url),{
    "drizzle-orm":{eq,sql},"next/cache":{revalidatePath:()=>undefined},"zod":{z},"@core/auth":{requireStaff:async()=>({userId:"own-test"})},"@core/db/client":{db},"@core/db/serialized":serialized,
    "@slices/settings/server-contract":{headerContactUsageGuard:()=>sql`false`},"@slices/pages/server-contract":pages,"../public-types":{HEADER_CONTACT_LOCK:"header-contact:v1"},"./public-publish":{refreshPublicForm:async()=>undefined},"@core/email":{sendEmail:async()=>{throw Error("No mail in archive test");}},"@core/i18n":{},"../domain":domain,"../schema":{form_definition,form_test_submission},"../validation":validation,"./queries":{},"./notification":{testNotification},"./attachments":{validateAttachments},
  });
  return {client,pages,actions,db};
}

test("About DB: draft and published EN each block archive; target copies do not create independent uses",{skip:!enabled},async()=>{
  const h=harness(),formId=crypto.randomUUID(),pageId=crypto.randomUUID(),targetId=crypto.randomUUID();
  const envelope={schemaVersion:1,content:{contact:{form:{form_id:formId.toUpperCase()}}},ogImageMediaId:null};
  assert.equal((await h.client`select current_database() as db,current_user as role`)[0]?.db,ownDatabase);
  // This schema-only test DB is reserved for this implementer; never alter an existing About.
  assert.equal((await h.client`select count(*)::int as n from page_locale_content where page_key='about'`)[0]?.n,0);
  try {
    await h.client`insert into form_definition(id,name,template,recipient,definition) values(${formId}::uuid,'Own archive fixture','owner-estimate','own@example.test',${JSON.stringify(domain.createBlueprint("owner-estimate"))}::jsonb)`;
    await h.client`insert into page_locale_content(id,page_key,locale,draft) values(${pageId}::uuid,'about','en',${JSON.stringify(envelope)}::jsonb)`;
    let result=await h.actions.archiveForm(formId,1,true);assert.equal(result.ok,false);if(!result.ok)assert.match(result.error,/About/);
    await h.client`update page_locale_content set draft=null,published=${JSON.stringify(envelope)}::jsonb,published_at=clock_timestamp() where id=${pageId}::uuid`;
    result=await h.actions.archiveForm(formId,1,true);assert.equal(result.ok,false);
    const assignment=await h.pages.readAboutContactAssignment();assert.ok(assignment);assert.equal(assignment.formId,formId);
    assert.equal((await h.db.execute(sql`select ${h.pages.aboutContactAssignmentGuard(formId,assignment.identity)} as assigned`)).rows[0]?.assigned,true,"Uppercase saved UUID retains canonical public authority");
    await h.client`update page_locale_content set revision=revision+1,draft=${JSON.stringify(envelope)}::jsonb where id=${pageId}::uuid`;
    assert.equal((await h.pages.readAboutContactAssignment())?.identity,assignment.identity,"Draft save must preserve public identity");
    await h.client`insert into page_locale_content(id,page_key,locale,draft,published) values(${targetId}::uuid,'about','es',${JSON.stringify(envelope)}::jsonb,${JSON.stringify(envelope)}::jsonb)`;
    await h.client`update page_locale_content set draft=null,published=null where id=${pageId}::uuid`;
    assert.equal(await h.pages.readAboutContactAssignment(),null);
    result=await h.actions.archiveForm(formId,1,true);assert.equal(result.ok,true,"Only EN draft/published may block archive");
    assert.equal((await h.client`select status from form_definition where id=${formId}::uuid`)[0]?.status,"archived");
  } finally {
    await h.client`delete from page_locale_content where id=any(${[pageId,targetId]}::uuid[])`;
    await h.client`delete from form_definition where id=${formId}::uuid`;
  }
});


test("Guest DB: uppercase EN draft and published each prevent archive, draft save keeps public identity, target copies are inert",{skip:!enabled},async()=>{
  const h=harness(),formId=crypto.randomUUID(),pageId=crypto.randomUUID(),targetId=crypto.randomUUID();
  const envelope={schemaVersion:1,content:{dual_cta:{owner:{contact:{form_id:formId.toUpperCase()}}}},ogImageMediaId:null};
  assert.equal((await h.client`select count(*)::int as n from page_locale_content where page_key='guest'`)[0]?.n,0);
  try {
    await h.client`insert into form_definition(id,name,template,recipient,definition) values(${formId}::uuid,'Own guest archive','newsletter','own@example.test',${JSON.stringify(domain.createBlueprint("newsletter"))}::jsonb)`;
    await h.client`insert into page_locale_content(id,page_key,locale,draft) values(${pageId}::uuid,'guest','en',${JSON.stringify(envelope)}::jsonb)`;
    let result=await h.actions.archiveForm(formId,1,true);assert.equal(result.ok,false);if(!result.ok)assert.match(result.error,/Guest.*Owner contact/);
    await h.client`update page_locale_content set published=${JSON.stringify(envelope)}::jsonb,draft=null,published_at=clock_timestamp() where id=${pageId}::uuid`;
    result=await h.actions.archiveForm(formId,1,true);assert.equal(result.ok,false);
    const assignment=await h.pages.readGuestContactAssignment();assert.ok(assignment);assert.equal(assignment.formId,formId);
    assert.equal((await h.db.execute(sql`select ${h.pages.guestContactAssignmentGuard(formId,assignment.identity)} as assigned`)).rows[0]?.assigned,true);
    await h.client`update page_locale_content set revision=revision+1,draft=${JSON.stringify(envelope)}::jsonb where id=${pageId}::uuid`;
    assert.equal((await h.pages.readGuestContactAssignment())?.identity,assignment.identity);
    await h.client`update page_locale_content set published_at=clock_timestamp() where id=${pageId}::uuid`;
    assert.notEqual((await h.pages.readGuestContactAssignment())?.identity,assignment.identity);
    assert.equal((await h.db.execute(sql`select ${h.pages.guestContactAssignmentGuard(formId,assignment.identity)} as assigned`)).rows[0]?.assigned,false);
    await h.client`insert into page_locale_content(id,page_key,locale,draft,published) values(${targetId}::uuid,'guest','pt',${JSON.stringify(envelope)}::jsonb,${JSON.stringify(envelope)}::jsonb)`;
    await h.client`update page_locale_content set draft=null,published=null where id=${pageId}::uuid`;
    assert.equal(await h.pages.readGuestContactAssignment(),null);assert.equal((await h.actions.archiveForm(formId,1,true)).ok,true);
  } finally {await h.client`delete from page_locale_content where id=any(${[pageId,targetId]}::uuid[])`;await h.client`delete from form_definition where id=${formId}::uuid`;}
});
