import assert from "node:assert/strict";
import test from "node:test";
import type { TranslationState } from "@core/i18n";
import { companySettingsSaveInput } from "../admin/validation";
import { isSettingsWebsiteField } from "../website-locale-types";
import { rawWebsiteTranslations, resolveWebsiteUrl } from "../server/website-locales";
const base = "https://website.example.invalid/en";
const row = (locale: "en" | "es" | "pt" | "fr", value: string, state: TranslationState = "approved") => ({ locale, field: "website_url", value, state });
test("legacy payloads may omit targets and new targets trim without copying EN", () => {
 const schema=companySettingsSaveInput.shape.website_translations;
 assert.equal(schema.parse(undefined),undefined);
 assert.deepEqual(schema.parse({es:" https://website.example.invalid/es?q=1#office ",pt:" ",fr:""}),{es:"https://website.example.invalid/es?q=1#office",pt:"",fr:""});
});
test("Website targets require complete known locale keys and HTTPS URLs within 300 characters", () => {
 const schema=companySettingsSaveInput.shape.website_translations;
 for(const es of["http://example.invalid","javascript:alert(1)","/es","https://example.invalid/"+"x".repeat(301)])assert.equal(schema.safeParse({es,pt:"",fr:""}).success,false);
 assert.equal(schema.safeParse({es:""}).success,false);
 assert.equal(schema.safeParse({es:"",pt:"",fr:"",en:base}).success,false);
});
test("raw inputs preserve pending targets and ignore EN and unrelated fields",()=>{
 assert.deepEqual(rawWebsiteTranslations([row("en",base),row("es","https://es.example.invalid","needs_review"),{locale:"fr",field:"office_hours_label",value:"Hours"}]),{es:"https://es.example.invalid",pt:"",fr:""});
});
test("public URL selects only an approved HTTPS target, else canonical inline EN",()=>{
 const rows=[row("en","https://stale.example.invalid"),row("es","https://es.example.invalid","needs_review"),row("pt","https://pt.example.invalid")];
 assert.equal(resolveWebsiteUrl(base,"en",rows),base);assert.equal(resolveWebsiteUrl(base,"es",rows),base);assert.equal(resolveWebsiteUrl(base,"pt",rows),"https://pt.example.invalid");assert.equal(resolveWebsiteUrl(base,"fr",rows),base);
});
test("EN clear hides untouched languages but does not suppress an owned target",()=>{
 const rows=[row("en","https://stale.example.invalid"),row("fr","https://fr.example.invalid")];
 assert.equal(resolveWebsiteUrl(null,"en",rows),null);assert.equal(resolveWebsiteUrl(null,"es",rows),null);assert.equal(resolveWebsiteUrl(null,"fr",rows),"https://fr.example.invalid");
});
test("invalid approved targets fall back while legacy inline URL stays authoritative",()=>{
 for(const value of["javascript:alert(1)","http://es.example.invalid"," ","https://example.invalid/"+"x".repeat(301)])assert.equal(resolveWebsiteUrl(base,"es",[row("es",value)]),base);
 assert.equal(resolveWebsiteUrl(" http://legacy.example.invalid ","es",[]),"http://legacy.example.invalid");
});
test("manual Website policy isolates exactly that Settings field",()=>{
 assert.equal(isSettingsWebsiteField("company_settings","website_url"),true);assert.equal(isSettingsWebsiteField("company_settings","stats.bookings.label"),false);assert.equal(isSettingsWebsiteField("nav_item","website_url"),false);
});
