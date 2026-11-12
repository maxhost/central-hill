import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { sql,eq } from "drizzle-orm";
import { z } from "zod";
import ts from "typescript";
import * as validation from "../validation";

test("Archive explains every active placement for all thirty-one combinations",async()=>{
  for(let bits=1;bits<32;bits++){
    const usage={header_used:Boolean(bits&1),about_used:Boolean(bits&2),guest_used:Boolean(bits&4),real_estate_used:Boolean(bits&8),service_used:Boolean(bits&16)};
    const deps:Record<string,unknown>={
      "drizzle-orm":{sql,eq},"next/cache":{revalidatePath:()=>undefined},"zod":{z},"@core/auth":{requireStaff:async()=>({userId:"own"})},"@core/db/client":{db:{execute:async()=>({rows:[usage]})}},
      "@core/db/serialized":{executeSerialized:async()=>({rows:[]})},"@slices/settings/server-contract":{headerContactUsageGuard:()=>sql`false`},"@slices/services/server-contract":{serviceEnquiryUsageGuard:()=>sql`false`},"@slices/pages/server-contract":{aboutContactUsageGuard:()=>sql`false`,guestContactUsageGuard:()=>sql`false`,realEstateEnquiryUsageGuard:()=>sql`false`},
      "../public-types":{HEADER_CONTACT_LOCK:"header-contact:v1"},"./public-publish":{},"@core/email":{},"@core/i18n":{},"../domain":{},"../schema":{},"../validation":validation,"./queries":{},"./notification":{},"./attachments":{},
    };
    const compiled={exports:{}};
    const code=ts.transpileModule(readFileSync(new URL("../server/actions.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    runInNewContext(code,{module:compiled,exports:compiled.exports,console,require(name:string){assert.ok(Object.hasOwn(deps,name),name);return deps[name];}});
    const result=await(compiled.exports as typeof import("../server/actions")).archiveForm(crypto.randomUUID(),1,true);assert.equal(result.ok,false);
    if(!result.ok){assert.equal(result.code,"validation");assert.equal(result.error.includes("Settings"),usage.header_used);assert.equal(result.error.includes("About"),usage.about_used);assert.equal(result.error.includes("Guest"),usage.guest_used);assert.equal(result.error.includes("Real Estate"),usage.real_estate_used);assert.equal(result.error.includes("Services"),usage.service_used);assert.match(result.error,/before archiving/);}
  }
});
