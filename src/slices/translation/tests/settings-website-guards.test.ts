import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, loadTranslationRows, setSourceContent, setTargetTranslation } from "@core/i18n";
import { approveField, resetField, saveField, clearField, approveEntity } from "../admin/actions";
import { getEntityTranslations, getTranslationInbox } from "../admin/queries";
import { generateDrafts } from "../server/generate";
test("legacy individual Website actions reject without writing",async()=>{
 const args=["company_settings","e8510000-0000-4000-8000-000000000099","website_url","es"]as const;
 for(const result of[await approveField(...args),await resetField(...args),await saveField(...args,"https://rejected.example.invalid"),await clearField(...args)])assert.deepEqual(result,{ok:false,error:"validation"});
});
test("bulk review and generation preserve Website rows while other Settings copy remains available",async()=>{
 assert.equal(new URL(process.env.DATABASE_URL??"http://invalid.test").hostname,"propertylocalesqa.local");
 assert.deepEqual((await db.execute(sql`select current_database()as db,current_user as role`)).rows[0],{db:"propertylocalesqa",role:"propertylocalesqa"});
 const id=randomUUID(),type="company_settings";assert.equal((await loadTranslationRows({type,id})).length,0);
 const websiteRows=async()=>(await loadTranslationRows({type,id})).filter(r=>r.field==="website_url").sort((a,b)=>a.locale.localeCompare(b.locale));
 try{
  await setSourceContent(type,id,{website_url:"https://legacy.example.invalid/en","stats.bookings.label":"Own legacy stat"});
  await setTargetTranslation(type,id,"website_url","es","https://owned.example.invalid/es",{sourceValue:"https://legacy.example.invalid/en",state:"needs_review"});
  await setTargetTranslation(type,id,"stats.bookings.label","es","Own pending stat",{sourceValue:"Own legacy stat",state:"needs_review"});
  const before=await websiteRows();assert.deepEqual(await approveEntity(type,id),{ok:true});assert.deepEqual(await websiteRows(),before);
  const summary=await generateDrafts(type,id,{locales:["es"],overwrite:true});assert.equal(summary.provider,"identity");assert.equal(summary.total,1);assert.deepEqual(await websiteRows(),before);
  const review=await getEntityTranslations(type,id);assert.deepEqual(review?.fields.map(r=>r.field),["stats.bookings.label"]);
  const inbox=await getTranslationInbox({entityType:type});assert.equal(inbox.items.find(r=>r.entityId===id)?.fieldCount,1);
 }finally{await deleteContent(type,id);assert.equal((await loadTranslationRows({type,id})).length,0);}
});
