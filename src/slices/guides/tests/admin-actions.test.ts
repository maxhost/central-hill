import assert from "node:assert/strict";
import {test} from "node:test";
import {runGuideWrite} from "../admin/model";
test("sequential failure reports confirmed steps, invalidates uncertain writes and retry keeps stable ID",async()=>{
  const rows=new Map<string,string>();let invalidations=0;let fail=true;
  const steps=[{name:"entity",run:async()=>{rows.set("stable-id","row");}},{name:"source",run:async()=>{if(fail)throw Error("network");rows.set("source","Title");}}];
  const first=await runGuideWrite("stable-id",steps,()=>{invalidations++;});
  assert.deepEqual(first,{ok:false,error:"partial_write",entityIds:["stable-id"],completedSteps:["entity"],failedStep:"source",reloadRequired:true});
  assert.equal(invalidations,1);fail=false;
  assert.deepEqual(await runGuideWrite("stable-id",steps,()=>{invalidations++;}),{ok:true,id:"stable-id"});
  assert.equal(rows.size,2);assert.equal(invalidations,2);
});
test("even first-step failure is uncertain, never false success or assumed rollback",async()=>{
  let invalidated=false;const result=await runGuideWrite("id",[{name:"entity",run:async()=>{throw Error("lost response");}}],()=>{invalidated=true;});
  assert.equal(result.ok,false);assert.equal(!result.ok&&result.error,"partial_write");assert.equal(invalidated,true);
});
test("cache failure after durable writes reports invalidation, not a failed source save",async()=>{
  const result=await runGuideWrite("id",[{name:"source",run:async()=>undefined}],()=>{throw Error("cache unavailable");});
  assert.equal(result.ok,false);
  if(!result.ok && result.error==="partial_write") { assert.deepEqual(result.completedSteps,["source"]);assert.equal(result.failedStep,"invalidate"); }
});
