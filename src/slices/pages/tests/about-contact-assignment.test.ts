import assert from "node:assert/strict";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { aboutSchema, defaultAbout } from "../schemas/about";
import { aboutContactFormId, preserveAboutContactAssignment, withoutAboutContactAssignment } from "../about-contact-content";
import { normalizeAbout, aboutTextPaths } from "../about-content";
import { validatePageLivePreview } from "../admin/live-preview-validation";

const a = "a8111111-1111-4111-8111-111111111111";
const b = "b8222222-2222-4222-8222-222222222222";
function content(id?: string | null) {
  const value = normalizeAbout(defaultAbout);
  if (id !== undefined) value.contact.form.form_id = id;
  return value;
}
test("About legacy absence stays absent and form selection is structural, never a translated text", () => {
  const parsed = aboutSchema.parse(defaultAbout);
  assert.equal(Object.hasOwn(parsed.contact.form, "form_id"), false);
  assert.equal(aboutSchema.safeParse(content(null)).success, true);
  assert.equal(aboutSchema.safeParse(content(a)).success, true);
  assert.equal(aboutSchema.parse(content("bad-ref")).contact.form.form_id, "bad-ref", "Malformed stored references remain visible for repair without discarding authored text");
  assert.equal(translatablePaths(aboutSchema).includes("contact.form.form_id"), false);
  assert.equal(aboutTextPaths(content(a)).includes("contact.form.form_id"), false);
});
test("old EN clients preserve saved selection; explicit null removes and a new ID replaces", () => {
  assert.equal(aboutContactFormId(preserveAboutContactAssignment(content(), content(a), "en")), a);
  assert.equal(aboutContactFormId(preserveAboutContactAssignment(content(null), content(a), "en")), null);
  assert.equal(aboutContactFormId(preserveAboutContactAssignment(content(b), content(a), "en")), b);
  assert.equal(Object.hasOwn(preserveAboutContactAssignment(content(), content(), "en").contact.form, "form_id"), false);
});
for (const locale of ["es", "pt", "fr"]) test(`${locale} cannot replace a reference; shared preservation does not rewrite its text`, () => {
  const payload = content(b);
  payload.contact.form.headline = `${locale} own title`;
  const preserved = preserveAboutContactAssignment(payload, content(a), locale);
  assert.equal(preserved.contact.form.form_id, a);
  assert.equal(preserved.contact.form.headline, `${locale} own title`);
  assert.equal(payload.contact.form.form_id, b, "Caller input remains untouched");
  assert.equal(Object.hasOwn(preserveAboutContactAssignment(payload, content(), locale).contact.form, "form_id"), false);
});
test("authenticated preview payload carries only the explicit EN reference, independent of target content", () => {
  const envelope = { schemaVersion: 1 as const, content: content(b), ogImageMediaId: null };
  const raw = { envelope, localMedia: {}, aboutContactFormId: a };
  assert.equal(validatePageLivePreview("about", raw, "http://localhost:3083")?.aboutContactFormId, a);
  assert.equal(validatePageLivePreview("about", { ...raw, aboutContactFormId: null }, "http://localhost:3083")?.aboutContactFormId, null);
  assert.equal(validatePageLivePreview("about", { ...raw, aboutContactFormId: "x".repeat(101) }, "http://localhost:3083"), null);
  assert.equal(validatePageLivePreview("about", { ...raw, recipient: "private@example.test" }, "http://localhost:3083"), null);
  assert.equal(validatePageLivePreview("home", raw, "http://localhost:3083"), null);
});

test("invalid manual assignment never replaces About localized public text", () => {
  for (const id of ["bad-ref", "x".repeat(101), 42, { invalid: true }, ["invalid"]]) {
    const raw = content();
    raw.contact.form.headline = "Authored localized contact heading";
    Object.assign(raw.contact.form, { form_id: id });
    const presented = aboutSchema.parse(withoutAboutContactAssignment(raw));
    assert.equal(presented.contact.form.headline, "Authored localized contact heading");
    assert.equal(Object.hasOwn(presented.contact.form, "form_id"), false);
    assert.deepEqual(raw.contact.form.form_id, id, "Read-only presentation never repairs stored data");
  }
});
