import assert from "node:assert/strict";
import test from "node:test";
import { approveField, resetField, saveField, clearField, approveEntity, generateEntityDrafts } from "../admin/actions";
import { generateDrafts } from "../server/generate";
test("legacy testimonial target actions reject before writing",async()=>{
 const id="e8300000-0000-4000-8000-000000000099",args=["testimonial",id,"quote","es"] as const;
 for(const result of[await approveField(...args),await resetField(...args),await saveField(...args,"Rejected legacy quote"),await clearField(...args),await approveEntity("testimonial",id),await generateEntityDrafts("testimonial",id,true)])assert.deepEqual(result,{ok:false,error:"validation"});
});
test("direct generic generation rejects testimonial content",async()=>{
 await assert.rejects(()=>generateDrafts("testimonial","e8300000-0000-4000-8000-000000000099",{overwrite:true}),/editor/);
});
