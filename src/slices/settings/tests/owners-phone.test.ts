import assert from "node:assert/strict";
import test from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { companySettingsInput } from "../validation";
import { companySettingsSaveInput } from "../admin/validation";
import { DEFAULT_GLOBALS } from "../defaults";
test("Owners phone defaults to the number supplied by the user",()=>{
 assert.equal(DEFAULT_GLOBALS.ownersPhone,"+351 910 438 062");
});
test("old admin payloads may omit Owners phone while explicit null means clear",()=>{
 const field=companySettingsSaveInput.shape.owners_phone;
 assert.equal(field.parse(undefined),undefined);assert.equal(field.parse(null),null);
 assert.equal(field.parse("  +351 910 438 062  "),"+351 910 438 062");
});
test("Owners phone validates optional public input and bounded nonblank admin values",()=>{
 const pub=companySettingsInput.shape.owners_phone,admin=companySettingsSaveInput.shape.owners_phone;
 assert.equal(pub.parse(undefined),undefined);assert.equal(pub.parse("+351 910 438 062"),"+351 910 438 062");
 for(const value of["","  ","1","x".repeat(41)])assert.equal(admin.safeParse(value).success,false);
});
test("Owners phone is shared contact data rather than translatable copy",()=>{
 assert.equal(translatablePaths(companySettingsInput).includes("owners_phone"),false);
});

test("the initial contact form can be saved with its real existing widget account",()=>{
 const base=DEFAULT_GLOBALS;
 const result=companySettingsSaveInput.safeParse({email:base.email,phone:base.phone,
 whatsapp:base.whatsapp,owners_phone:base.ownersPhone,checkin_phone:base.checkinPhone,
 website_url:base.website,social:{instagram:null,facebook:null,linkedin:null,youtube:null,tiktok:null},
 stats:base.stats,office_address:base.officeAddress,office_hours:base.officeHours,
 office_hours_label:base.officeHoursLabel,currency:base.currency,default_og_image_media_id:null,
 avantio_account_id:base.avantio.accountId,avantio_widget_config:base.avantio.widgetConfig,
 show_building_location:base.showBuildingLocation,show_building_count:base.showBuildingCount,
 site_icons:base.icons});
 assert.equal(result.success,true);if(result.success){assert.equal(result.data.owners_phone,"+351 910 438 062");assert.equal(result.data.avantio_account_id,"bk_centralhill");}
});
