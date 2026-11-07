import assert from "node:assert/strict";
import test from "node:test";
import { testimonialSaveInput } from "../admin/validation";
import { isTestimonialEditorialEntity, getTestimonialEditorialRedirect } from "../server/editorial-translation-policy";
const valid = { audience:"guest",rating:5,author_name:"Synthetic Guest",author_country:"PT",property_location:null,position:0,status:"published",quote:" English quote " };
test("old quote payloads remain valid and omit targets",()=>{
 const input=testimonialSaveInput.parse(valid);assert.equal(input.quote,"English quote");assert.equal(input.translations,undefined);
});
test("target quotes trim and preserve explicit blanks",()=>{
 const input=testimonialSaveInput.parse({...valid,translations:{es:" ES quote ",pt:"  ",fr:" FR quote "}});
 assert.deepEqual(input.translations,{es:"ES quote",pt:"",fr:"FR quote"});
});
test("English quote is required after trim",()=>{
 for(const quote of[""," ","\n\t"])assert.equal(testimonialSaveInput.safeParse({...valid,quote}).success,false);
});
test("quote length limits cover every authored language",()=>{
 assert.equal(testimonialSaveInput.safeParse({...valid,quote:"x".repeat(1001)}).success,false);
 for(const locale of["es","pt","fr"])assert.equal(testimonialSaveInput.safeParse({...valid,translations:{es:"",pt:"",fr:"",[locale]:"x".repeat(1001)}}).success,false);
 assert.equal(testimonialSaveInput.safeParse({...valid,translations:{es:"x".repeat(1000),pt:"",fr:""}}).success,true);
});
test("present targets require the three known locales",()=>{
 for(const translations of[{es:"ES"},{es:"",pt:"",fr:"",en:"EN"}])assert.equal(testimonialSaveInput.safeParse({...valid,translations}).success,false);
});
test("legacy review policy redirects only valid testimonial identities",()=>{
 const id="e8310000-0000-4000-8000-000000000001";
 assert.equal(isTestimonialEditorialEntity("testimonial"),true);assert.equal(isTestimonialEditorialEntity("faq_item"),false);
 assert.equal(getTestimonialEditorialRedirect("testimonial",id),`/admin/testimonials/${id}`);
 assert.equal(getTestimonialEditorialRedirect("testimonial","bad"),null);assert.equal(getTestimonialEditorialRedirect("city",id),null);
});
