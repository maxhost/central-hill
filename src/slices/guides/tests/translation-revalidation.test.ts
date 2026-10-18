import assert from "node:assert/strict";
import {test} from "node:test";
import {isGuideTranslationEntity} from "../presentation";
test("translation invalidation recognizes every Guides tree level and excludes unrelated slices",()=>{
  for(const type of ["guide_page","guide_section","guide_place"]) assert.equal(isGuideTranslationEntity(type),true);
  for(const type of ["page_content","city","service","media_asset","guide","guide_page-list",""]) assert.equal(isGuideTranslationEntity(type),false);
});
