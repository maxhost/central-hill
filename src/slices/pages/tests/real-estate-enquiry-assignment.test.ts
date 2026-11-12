import assert from "node:assert/strict";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { realEstateSchema } from "../schemas/real-estate";
import { realEstateAdapter, realEstateDraftSchema } from "../adapters/real-estate";
import { realEstateEnquiryFormId, preserveRealEstateEnquiryAssignment, withoutRealEstateEnquiryAssignment } from "../real-estate-enquiry-content";
import { realEstateTextPaths } from "../real-estate-content";
import { validatePageLivePreview } from "../admin/live-preview-validation";

const a = "a8111111-1111-4111-8111-111111111111";
const b = "b8222222-2222-4222-8222-222222222222";
function content(id?: string | null) {
  const value = realEstateAdapter.defaultContent();
  value.deal_enquiry = { headline: "Enquiry headline", lede: "Enquiry lede" };
  if (id !== undefined) value.deal_enquiry.form_id = id;
  return value;
}
test("Real Estate legacy absence stays absent and form selection is structural, never translated text", () => {
  assert.equal(Object.hasOwn(realEstateAdapter.defaultContent().deal_enquiry ?? {}, "form_id"), false);
  const parsed = realEstateDraftSchema.parse(content());
  assert.equal(Object.hasOwn(parsed.deal_enquiry!, "form_id"), false);
  assert.equal(realEstateDraftSchema.safeParse(content(null)).success, true);
  assert.equal(realEstateDraftSchema.safeParse(content(a)).success, true);
  assert.equal(realEstateDraftSchema.parse(content("bad-ref")).deal_enquiry?.form_id, "bad-ref");
  assert.equal(translatablePaths(realEstateSchema).includes("deal_enquiry.form_id"), false);
  assert.equal(realEstateTextPaths(content(a)).includes("deal_enquiry.form_id"), false);
});
test("old EN payload preserves saved selection; explicit null removes and new ID replaces", () => {
  assert.equal(realEstateEnquiryFormId(preserveRealEstateEnquiryAssignment(content(), content(a), "en")), a);
  assert.equal(realEstateEnquiryFormId(preserveRealEstateEnquiryAssignment(content(null), content(a), "en")), null);
  assert.equal(realEstateEnquiryFormId(preserveRealEstateEnquiryAssignment(content(b), content(a), "en")), b);
  const absentGroup = content(); delete absentGroup.deal_enquiry;
  assert.equal(realEstateEnquiryFormId(preserveRealEstateEnquiryAssignment(absentGroup, content(a), "en")), a);
  assert.equal(preserveRealEstateEnquiryAssignment(absentGroup, absentGroup, "en").deal_enquiry, undefined);
});
for (const locale of ["es", "pt", "fr"]) test(`${locale} cannot replace Real Estate form and retains its own dialog text`, () => {
  const payload = content(b);
  payload.deal_enquiry!.headline = `${locale} own title`;
  const preserved = preserveRealEstateEnquiryAssignment(payload, content(a), locale);
  assert.equal(preserved.deal_enquiry?.form_id, a);
  assert.equal(preserved.deal_enquiry?.headline, `${locale} own title`);
  assert.equal(payload.deal_enquiry?.form_id, b);
  assert.equal(Object.hasOwn(preserveRealEstateEnquiryAssignment(payload, content(), locale).deal_enquiry!, "form_id"), false);
});
test("Real Estate private preview carries explicit unsaved EN reference independently of target snapshot", () => {
  const envelope = { schemaVersion: 1 as const, content: content(b), ogImageMediaId: null };
  const raw = { envelope, localMedia: {}, realEstateEnquiryFormId: a };
  assert.equal(validatePageLivePreview("real_estate", raw, "http://localhost:3084")?.realEstateEnquiryFormId, a);
  assert.equal(validatePageLivePreview("real_estate", { ...raw, realEstateEnquiryFormId: null }, "http://localhost:3084")?.realEstateEnquiryFormId, null);
  assert.equal(validatePageLivePreview("real_estate", { ...raw, realEstateEnquiryFormId: "x".repeat(101) }, "http://localhost:3084"), null);
  assert.equal(validatePageLivePreview("real_estate", { ...raw, aboutContactFormId: a }, "http://localhost:3084"), null);
  assert.equal(validatePageLivePreview("about", raw, "http://localhost:3084"), null);
  assert.equal(validatePageLivePreview("home", raw, "http://localhost:3084"), null);
});
test("invalid manual Real Estate assignment cannot replace authored public text or repair stored data", () => {
  for (const id of ["bad-ref", "x".repeat(101), 42, { invalid: true }, ["invalid"]]) {
    const raw = content();
    Object.assign(raw.deal_enquiry!, { form_id: id });
    const presented = realEstateDraftSchema.parse(withoutRealEstateEnquiryAssignment(raw));
    assert.equal(presented.deal_enquiry?.headline, "Enquiry headline");
    assert.equal(presented.deal_enquiry?.lede, "Enquiry lede");
    assert.equal(Object.hasOwn(presented.deal_enquiry!, "form_id"), false);
    assert.deepEqual(raw.deal_enquiry?.form_id, id);
  }
});
