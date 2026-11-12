import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { sql } from "drizzle-orm";
import { FORMS_PUBLIC_TAGS } from "../public-types";

test("Form invalidation covers every combination of Services, Real Estate, Guest, About and header independently in all four locales",async()=>{
  for(const bits of Array.from({length:32},(_,i)=>i)) {
    const usage={used:Boolean(bits&1),about_used:Boolean(bits&2),guest_used:Boolean(bits&4),real_estate_used:Boolean(bits&8),service_used:Boolean(bits&16)};
    const tags:string[]=[],paths:string[]=[];
    const deps:Record<string,unknown>={
      "server-only":{},"drizzle-orm":{sql},"@core/db/client":{db:{execute:async()=>({rows:[usage]})}},"@core/db/columns":{LOCALES:["en","es","pt","fr"]},
      "@core/revalidate":{updateTag:(tag:string)=>tags.push(tag),revalidatePath:(path:string,scope?:string)=>paths.push(path+(scope?`:${scope}`:""))},
      "@slices/settings/server-contract":{headerContactUsageGuard:()=>sql`false`},"@slices/services/server-contract":{SERVICE_TAGS:{list:"service-list"},serviceEnquiryPaths:async()=>usage.service_used?["/en/services/airport-transfer","/es/services/traslado","/pt/services/transfer","/fr/services/transfert"]:[]},"@slices/pages/server-contract":{aboutContactUsageGuard:()=>sql`false`,guestContactUsageGuard:()=>sql`false`,realEstateEnquiryUsageGuard:()=>sql`false`},"../public-types":{FORMS_PUBLIC_TAGS},
    };
    const compiled={exports:{}};
    const code=ts.transpileModule(readFileSync(new URL("../server/public-publish.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    runInNewContext(code,{module:compiled,exports:compiled.exports,require(name:string){assert.ok(Object.hasOwn(deps,name),name);return deps[name];}});
    await (compiled.exports as typeof import("../server/public-publish")).refreshPublicForm("own-id");
    assert.deepEqual(tags,[FORMS_PUBLIC_TAGS.form("own-id"),FORMS_PUBLIC_TAGS.all,...(usage.service_used?["service-list"]:[])]);
    assert.deepEqual(paths,[...(usage.service_used?["/en/services/airport-transfer","/es/services/traslado","/pt/services/transfer","/fr/services/transfert"]:[]),...(usage.real_estate_used?["/en/real-estate","/es/real-estate","/pt/real-estate","/fr/real-estate"]:[]),...(usage.guest_used?["/en/guests","/es/guests","/pt/guests","/fr/guests"]:[]),...(usage.about_used?["/en/about","/es/about","/pt/about","/fr/about"]:[]),...(usage.used?["/en:layout","/es:layout","/pt:layout","/fr:layout"]:[])]);
  }
});
