import assert from "node:assert/strict";
import { test } from "node:test";
import { applyGuideSectionPresentation, parseGuidePresentation, isGuideModuleVisible } from "../presentation";
import type { GuideSection } from "../contract";
const section: GuideSection = {id:"section",layout:"featured_places",title:"Title",body:"Body",localTip:"Tip",headerImage:{url:"https://example.test/photo",width:1200,height:900,alt:"Photo",blurhash:null},cta:{label:"Book",url:"https://example.test"},places:[]};
test("missing/invalid/legacy configuration preserves public content",()=>{
  for(const raw of [null,undefined,{version:2},{version:1,unknown:true},{version:1}]) assert.deepEqual(applyGuideSectionPresentation(section,raw),section);
  assert.equal(parseGuidePresentation({version:1,modules:{unexpected:true}}),null);
});
test("independent modules hide without mutating source; section hide is reversible",()=>{
  const flags={version:1,modules:{body:false,image:false,local_tip:false,cta:false}};
  assert.deepEqual(applyGuideSectionPresentation(section,flags),{...section,body:null,headerImage:null,localTip:null,cta:null});
  assert.equal(section.body,"Body");assert.equal(section.cta?.label,"Book");
  assert.equal(applyGuideSectionPresentation(section,{version:1,enabled:false}),null);
  assert.deepEqual(applyGuideSectionPresentation(section,{version:1,enabled:true}),section);
  assert.equal(isGuideModuleVisible({version:1,modules:{places:false}},"places"),false);
});
