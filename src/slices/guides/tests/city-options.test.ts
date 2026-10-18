import assert from "node:assert/strict";
import {test} from "node:test";
import {guideTreeErrors} from "../admin/validation";
import type {GuidePageEdit} from "../admin/model";
const page:GuidePageEdit={id:"guide",city_id:"city",template:"custom",status:"draft",position:0,hero_media_id:null,og_image_media_id:null,title:"Guide",intro:null,meta_title:null,meta_description:null,slug:"guide",slugs:{en:"guide"},sections:[]};
test("all-status cities remain valid draft references while only published cities can publish",()=>{
 for(const status of ["draft","published","archived"] as const){
  const cities=[{id:"city",name:"City",slug:"city",status}];
  assert.equal(guideTreeErrors(page,cities).city_id,undefined);
  assert.equal(Boolean(guideTreeErrors({...page,status:"published"},cities).city_id),status!=="published");
 }
 assert.ok(guideTreeErrors(page,[]).city_id);
});
