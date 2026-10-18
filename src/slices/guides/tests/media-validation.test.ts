import assert from "node:assert/strict";
import { test } from "node:test";
import {guideMediaErrors} from "../admin/media-validation";
test("image references require uploaded existing assets of the correct MIME; clearing is allowed",()=>{
  assert.deepEqual(guideMediaErrors({hero_media_id:null},new Map()),{});
  assert.ok(guideMediaErrors({hero_media_id:"missing"},new Map()).hero_media_id);
  for(const mime of ["video/mp4","application/pdf","text/html"]) assert.ok(guideMediaErrors({header_media_id:"asset"},new Map([["asset",{mime}]])).header_media_id);
  assert.deepEqual(guideMediaErrors({media_id:"asset"},new Map([["asset",{mime:"image/jpeg"}]])),{});
});
