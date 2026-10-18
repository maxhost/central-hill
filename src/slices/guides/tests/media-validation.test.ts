import assert from "node:assert/strict";
import { test } from "node:test";
import {guideMediaErrors} from "../admin/media-validation";
test("image references require uploaded existing assets of the correct MIME; clearing is allowed",()=>{
  assert.deepEqual(guideMediaErrors({hero_media_id:null},new Map()),{});
  for (const key of ["hero_media_id", "og_image_media_id", "header_media_id", "media_id"]) {
    assert.ok(guideMediaErrors({[key]:"missing"},new Map())[key]);
    assert.ok(guideMediaErrors({[key]:"asset"},new Map([["asset",{mime:"video/mp4"}]]))[key]);
  }
  for(const mime of ["video/mp4","application/pdf","text/html"]) assert.ok(guideMediaErrors({header_media_id:"asset"},new Map([["asset",{mime}]])).header_media_id);
  assert.deepEqual(guideMediaErrors({media_id:"asset"},new Map([["asset",{mime:"image/jpeg"}]])),{});
});

test("complete tree reports exact nested place and section image error paths",async()=>{
  const {guideTreeMediaErrors,guideTreeMediaReferences}=await import("../admin/media-validation");
  const page:import("../admin/model").GuidePageEdit={id:"page",city_id:"city",template:"custom",status:"published",position:0,title:"Guide",intro:null,meta_title:null,meta_description:null,hero_media_id:"shared",og_image_media_id:null,slug:"guide",slugs:{en:"guide"},sections:[{
    id:"section",guide_page_id:"page",position:0,layout:"standard",title:"Section",body:"Body",local_tip:null,cta_label:null,cta_url:null,presentation:null,header_media_id:"shared",places:[{id:"place",guide_section_id:"section",position:0,name:"Place",description:null,category:null,address:null,phone:null,price_tier:null,opening_hours:null,latitude:null,longitude:null,website_url:null,booking_url:null,media_id:"missing"}],
  }]};
  const refs=guideTreeMediaReferences(page);
  assert.equal(refs.length,3);
  const errors=guideTreeMediaErrors(page,new Map([["shared",{mime:"image/jpeg"}]]));
  assert.deepEqual(Object.keys(errors),["sections.section.places.place.media_id"]);
});
