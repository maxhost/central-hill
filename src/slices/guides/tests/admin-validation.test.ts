import assert from "node:assert/strict";
import { test } from "node:test";
import { guidePageMutation, guideSectionMutation, guidePlaceMutation, isExactGuideOrder, guideTreeErrors, guidePlaceErrors } from "../admin/validation";
import type { GuidePageEdit, GuideSectionEdit } from "../admin/model";
const id = "11111111-1111-4111-8111-111111111111";
test("patch omission preserves fields; explicit undefined and foreign/unknown columns fail", () => {
  assert.equal(guidePageMutation.safeParse({ id, changes: {}, source: {} }).success, true);
  for (const raw of [{id,changes:{city_id:undefined},source:{}},{id,changes:{city_id:id,guide_page_id:id},source:{}},{id,changes:{},source:{title:" "}}]) assert.equal(guidePageMutation.safeParse(raw).success, false);
  assert.equal(guideSectionMutation.safeParse({id,changes:{},source:{body:null}}).success,true);
});
test("HTTP(S) only, exact order and coordinate boundaries", () => {
  for(const value of ["javascript:alert(1)","data:text/html,hello","file:///tmp/test","/relative","https://user:password@example.test"])
    assert.equal(guidePlaceMutation.safeParse({id,changes:{website_url:value},source:{}}).success,false);
  assert.equal(guidePlaceMutation.safeParse({id,changes:{booking_url:"https://example.test/book",latitude:0,longitude:0},source:{}}).success,true);
  assert.equal(guidePlaceMutation.safeParse({id,changes:{latitude:91},source:{}}).success,false);
  assert.equal(isExactGuideOrder(["a","b"],["b","a"]),true);
  for(const ids of [["a"],["a","a"],["a","foreign"],["a","b","c"]]) assert.equal(isExactGuideOrder(["a","b"],ids),false);
});
const section: GuideSectionEdit = { id,guide_page_id:id,position:0,layout:"standard",header_media_id:null,cta_url:null,presentation:null,title:"Section",body:"Body",local_tip:null,cta_label:null,places:[] };
const page: GuidePageEdit={id,city_id:id,template:"custom",status:"published",position:0,hero_media_id:null,og_image_media_id:null,title:"Guide",intro:null,meta_title:null,meta_description:null,slug:"guide",slugs:{en:"guide"},sections:[section]};
const cities=[{id,name:"City",slug:"city",status:"published" as const}];
test("effective published tree rejects last-module/section removal and incomplete enabled module",()=>{
  assert.deepEqual(guideTreeErrors(page,cities),{});
  assert.ok(Object.keys(guideTreeErrors({...page,sections:[]},cities)).length);
  assert.ok(Object.keys(guideTreeErrors({...page,sections:[{...section,presentation:{version:1,modules:{body:false}}}]},cities)).length);
  assert.ok(Object.keys(guideTreeErrors({...page,sections:[{...section,presentation:{version:1,modules:{places:true}}}]},cities)).length);
  assert.deepEqual(guideTreeErrors({...page,status:"draft",sections:[{...section,presentation:{version:1,modules:{places:true}}}]},cities),{});
});
test("unpublished/missing cities cannot publish; hidden sections can be prepared incomplete",()=>{
  assert.ok(guideTreeErrors(page,[{...cities[0]!,status:"draft"}]).city_id);
  assert.ok(guideTreeErrors({...page,status:"draft"},[]).city_id);
  assert.deepEqual(guideTreeErrors({...page,sections:[section,{...section,id:"other",body:null,presentation:{version:1,enabled:false,modules:{places:true}}}]},cities),{});
});
test("legacy invisible fields validate and zero coordinates remain valid",()=>{
  const place={id,guide_section_id:id,position:0,name:"Place",description:null,category:null,address:null,phone:null,price_tier:null,opening_hours:"Tuesdays",latitude:0,longitude:0,website_url:"https://example.test",booking_url:null,media_id:null};
  assert.deepEqual(guidePlaceErrors(place),{});
  assert.ok(guidePlaceErrors({...place,longitude:null}).latitude);
});
