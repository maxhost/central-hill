import assert from "node:assert/strict";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { guestSchema } from "../schemas/guest";
import { guestAdapter, guestDraftSchema } from "../adapters/guest";
import { guestContactFormId, preserveGuestContactAssignment, withoutGuestContactAssignment } from "../guest-contact-content";
import { guestTextPaths } from "../guest-content";
import { validatePageLivePreview } from "../admin/live-preview-validation";

const a = "a8111111-1111-4111-8111-111111111111";
const b = "b8222222-2222-4222-8222-222222222222";
function content(id?: string | null) {
  const value = guestAdapter.defaultContent();
  value.dual_cta.owner.contact = { title: "Owner dialog title", intro: "Owner dialog intro" };
  if (id !== undefined) value.dual_cta.owner.contact.form_id = id;
  return value;
}
test("Guest legacy absence stays absent and form selection is structural, never translated text", () => {
  assert.equal(Object.hasOwn(guestAdapter.defaultContent().dual_cta.owner.contact ?? {}, "form_id"), false);
  const parsed = guestDraftSchema.parse(content());
  assert.equal(Object.hasOwn(parsed.dual_cta.owner.contact!, "form_id"), false);
  assert.equal(guestDraftSchema.safeParse(content(null)).success, true);
  assert.equal(guestDraftSchema.safeParse(content(a)).success, true);
  assert.equal(guestDraftSchema.parse(content("bad-ref")).dual_cta.owner.contact?.form_id, "bad-ref");
  assert.equal(translatablePaths(guestSchema).includes("dual_cta.owner.contact.form_id"), false);
  assert.equal(guestTextPaths(content(a)).includes("dual_cta.owner.contact.form_id"), false);
});
test("old EN payload preserves saved selection; explicit null removes and new ID replaces", () => {
  assert.equal(guestContactFormId(preserveGuestContactAssignment(content(), content(a), "en")), a);
  assert.equal(guestContactFormId(preserveGuestContactAssignment(content(null), content(a), "en")), null);
  assert.equal(guestContactFormId(preserveGuestContactAssignment(content(b), content(a), "en")), b);
  const absentGroup = content(); delete absentGroup.dual_cta.owner.contact;
  assert.equal(guestContactFormId(preserveGuestContactAssignment(absentGroup, content(a), "en")), a);
  assert.equal(preserveGuestContactAssignment(absentGroup, absentGroup, "en").dual_cta.owner.contact, undefined);
});
for (const locale of ["es", "pt", "fr"]) test(`${locale} cannot replace Guest form and retains its own dialog text`, () => {
  const payload = content(b);
  payload.dual_cta.owner.contact!.title = `${locale} own title`;
  const preserved = preserveGuestContactAssignment(payload, content(a), locale);
  assert.equal(preserved.dual_cta.owner.contact?.form_id, a);
  assert.equal(preserved.dual_cta.owner.contact?.title, `${locale} own title`);
  assert.equal(payload.dual_cta.owner.contact?.form_id, b);
  assert.equal(Object.hasOwn(preserveGuestContactAssignment(payload, content(), locale).dual_cta.owner.contact!, "form_id"), false);
});
test("Guest private preview carries explicit unsaved EN reference independently of target snapshot", () => {
  const envelope = { schemaVersion: 1 as const, content: content(b), ogImageMediaId: null };
  const raw = { envelope, localMedia: {}, guestContactFormId: a };
  assert.equal(validatePageLivePreview("guest", raw, "http://localhost:3084")?.guestContactFormId, a);
  assert.equal(validatePageLivePreview("guest", { ...raw, guestContactFormId: null }, "http://localhost:3084")?.guestContactFormId, null);
  assert.equal(validatePageLivePreview("guest", { ...raw, guestContactFormId: "x".repeat(101) }, "http://localhost:3084"), null);
  assert.equal(validatePageLivePreview("guest", { ...raw, aboutContactFormId: a }, "http://localhost:3084"), null);
  assert.equal(validatePageLivePreview("about", raw, "http://localhost:3084"), null);
  assert.equal(validatePageLivePreview("home", raw, "http://localhost:3084"), null);
});
test("invalid manual Guest assignment cannot replace authored public text or repair stored data", () => {
  for (const id of ["bad-ref", "x".repeat(101), 42, { invalid: true }, ["invalid"]]) {
    const raw = content();
    Object.assign(raw.dual_cta.owner.contact!, { form_id: id });
    const presented = guestDraftSchema.parse(withoutGuestContactAssignment(raw));
    assert.equal(presented.dual_cta.owner.contact?.title, "Owner dialog title");
    assert.equal(presented.dual_cta.owner.contact?.intro, "Owner dialog intro");
    assert.equal(Object.hasOwn(presented.dual_cta.owner.contact!, "form_id"), false);
    assert.deepEqual(raw.dual_cta.owner.contact?.form_id, id);
  }
});
