import test from "node:test";
import assert from "node:assert/strict";
import { homeIdentityErrors, homeSourceFields, homeTranslationField, normalizeHome, retireHomeIds } from "../home-content";
import { homeSchema, type HomeContent } from "../schemas/home";
import { applyDefaults, describe } from "../admin/form-model";
import { homeMediaErrors } from "../admin/home-media-validation";
function fixture():HomeContent {
 const data=applyDefaults(describe(homeSchema),{}) as HomeContent;
 data.stats={title:"Our figures",figures:[{to:"2",group:false,prefix:"",suffix:"",label:"Buildings"},{to:"5",group:false,prefix:"",suffix:"",label:"Years"}]};
 return normalizeHome(data);
}
test("Home stable identities preserve legacy keys when reordered",()=>{
 const data=fixture();assert.deepEqual(homeIdentityErrors(data),{});
 data.stats!.figures!.reverse();data._list_ids!["stats.figures"]!.reverse();
 assert.equal(homeTranslationField(data,"stats.figures.0.label"),"block:stats.figures.1.label");
 assert.equal(homeSourceFields(data)["block:stats.figures.1.label"],"Years");
});
test("Home additions use UUID identity and removed identities cannot revive",()=>{
 const previous=fixture();const data=structuredClone(previous);const id="345ecba8-58dd-4a4c-973c-b342872acdff";
 data.stats!.figures!.splice(0,1);data._list_ids!["stats.figures"]!.splice(0,1);
 const retired=retireHomeIds(data,previous);assert.deepEqual(retired._retired_ids,["stats.figures:legacy_0"]);
 retired.stats!.figures!.push({to:"1",group:false,prefix:"",suffix:"",label:"New"});retired._list_ids!["stats.figures"]!.push(id);
 assert.deepEqual(homeIdentityErrors(retired,data),{});assert.equal(homeTranslationField(retired,"stats.figures.1.label"),`block:stats.figures.@${id}.label`);
 retired._list_ids!["stats.figures"]![1]="legacy_0";assert.ok(Object.keys(homeIdentityErrors(retired,retireHomeIds(data,previous))).length);
});
test("Home media accepts video hero, mixed guests and image-only posters/OG",()=>{
 const data=fixture();const id="345ecba8-58dd-4a4c-973c-b342872acdff";data.hero.video_media_id=id;
 assert.deepEqual(homeMediaErrors(data,null,new Map([[id,{mime:"video/mp4"}]])),{});
 data.hero.poster_media_id=id;assert.ok(homeMediaErrors(data,null,new Map([[id,{mime:"video/mp4"}]]))["hero.poster_media_id"]);
 assert.ok(homeMediaErrors(data,id,new Map())["og_image_media_id"]);
});

test("Home contextual outline keeps public section order and every schema control reachable",async()=>{
 const { homeSections, homeEditorBindingIds }=await import("../admin/home-contextual");
 const sections=homeSections(describe(homeSchema),key=>key);
 assert.deepEqual(sections.map(s=>s.id),["hero","stats","guests_pitch","portfolio","services_carousel","faq","dual_cta","seo"]);
 for(const section of sections)for(const binding of section.bindings)assert.ok(homeEditorBindingIds.includes(binding.id),binding.id);
 assert.ok(sections.find(s=>s.id==="faq")?.bindings.some(b=>b.id==="faq_group_key"));
});


test("Home benefit and assurance identities follow moved content with legacy keys",()=>{
 const data=fixture();data.guests_pitch.benefits[0]!.title="First benefit";data.guests_pitch.benefits[1]!.title="Second benefit";
 data.services_carousel.assurances[0]!.label="First reassurance";data.services_carousel.assurances[1]!.label="Second reassurance";
 for(const path of ["guests_pitch.benefits","services_carousel.assurances"]){
 const list=path==="guests_pitch.benefits"?data.guests_pitch.benefits:data.services_carousel.assurances;
 [list[0],list[1]]=[list[1]!,list[0]!];const ids=data._list_ids![path]!;[ids[0],ids[1]]=[ids[1]!,ids[0]!];
 }
 assert.equal(homeTranslationField(data,"guests_pitch.benefits.0.title"),"block:guests_pitch.benefits.1.title");
 assert.equal(homeTranslationField(data,"guests_pitch.benefits.0.description"),"block:guests_pitch.benefits.1.description");
 assert.equal(homeTranslationField(data,"services_carousel.assurances.0.label"),"block:services_carousel.assurances.1.label");
 assert.equal(homeSourceFields(data)["block:guests_pitch.benefits.1.title"],"Second benefit");
 assert.equal(homeSourceFields(data)["block:services_carousel.assurances.1.label"],"Second reassurance");
 assert.deepEqual(homeIdentityErrors(data),{});
});
test("Stats-only metadata upgrades without collisions or repairing malformed IDs",()=>{
 const data=fixture();data._list_ids={"stats.figures":["legacy_0","legacy_1"]};data._retired_ids=["legacy_9"];
 const upgraded=normalizeHome(data);
 assert.deepEqual(upgraded._retired_ids,["stats.figures:legacy_9"]);
 assert.deepEqual(upgraded._list_ids!["guests_pitch.benefits"],["legacy_0","legacy_1","legacy_2","legacy_3"]);
 assert.deepEqual(homeIdentityErrors(upgraded),{});
 upgraded._list_ids!["guests_pitch.benefits"]=[];
 assert.ok(homeIdentityErrors(normalizeHome(upgraded))["guests_pitch.benefits"]);
 upgraded._retired_ids=["stats.figures:legacy_0"];
 assert.ok(homeIdentityErrors(upgraded)["stats.figures"]);
 assert.equal(homeIdentityErrors(upgraded)["services_carousel.assurances"],undefined);
});
