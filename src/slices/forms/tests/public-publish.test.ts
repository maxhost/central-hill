import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { sql } from "drizzle-orm";
import { FORMS_PUBLIC_TAGS } from "../public-types";

test("Form invalidation covers About in all four locales and independently retains header invalidation",async()=>{
  for(const usage of [{used:false,about_used:false},{used:false,about_used:true},{used:true,about_used:true}]) {
    const tags:string[]=[],paths:string[]=[];
    const deps:Record<string,unknown>={
      "server-only":{},"drizzle-orm":{sql},"@core/db/client":{db:{execute:async()=>({rows:[usage]})}},"@core/db/columns":{LOCALES:["en","es","pt","fr"]},
      "@core/revalidate":{updateTag:(tag:string)=>tags.push(tag),revalidatePath:(path:string,scope?:string)=>paths.push(path+(scope?`:${scope}`:""))},
      "@slices/settings/server-contract":{headerContactUsageGuard:()=>sql`false`},"@slices/pages/server-contract":{aboutContactUsageGuard:()=>sql`false`},"../public-types":{FORMS_PUBLIC_TAGS},
    };
    const compiled={exports:{}};
    const code=ts.transpileModule(readFileSync(new URL("../server/public-publish.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    runInNewContext(code,{module:compiled,exports:compiled.exports,require(name:string){assert.ok(Object.hasOwn(deps,name),name);return deps[name];}});
    await (compiled.exports as typeof import("../server/public-publish")).refreshPublicForm("own-id");
    assert.deepEqual(tags,[FORMS_PUBLIC_TAGS.form("own-id"),FORMS_PUBLIC_TAGS.all]);
    assert.deepEqual(paths,[...(usage.about_used?["/en/about","/es/about","/pt/about","/fr/about"]:[]),...(usage.used?["/en:layout","/es:layout","/pt:layout","/fr:layout"]:[])]);
  }
});
