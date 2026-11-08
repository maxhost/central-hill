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
