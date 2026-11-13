import assert from "node:assert/strict";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { companySettingsInput } from "../validation";
import { companySettingsSaveInput } from "../admin/validation";
import { DEFAULT_GLOBALS } from "../defaults";

test("Owners email uses the user-supplied fallback and is independent of the guest address", () => {
  assert.equal(DEFAULT_GLOBALS.ownersEmail, "partners@centralhill.pt");
  assert.equal(DEFAULT_GLOBALS.email, "info@centralhill.pt");
});
test("Owners email distinguishes old-client omission, explicit clear and a trimmed address", () => {
  const field = companySettingsSaveInput.shape.owners_email;
  assert.equal(field.parse(undefined), undefined);
  assert.equal(field.parse(null), null);
  assert.equal(field.parse("  owner@example.test  "), "owner@example.test");
  assert.equal(companySettingsInput.shape.owners_email.parse("  owner@example.test  "), "owner@example.test");
});
test("Owners email rejects malformed/blank/newline addresses and enforces the 254 character bound", () => {
  const field = companySettingsSaveInput.shape.owners_email;
  for (const value of ["", "   ", "invalid", "owner@", "owner@example.test\nBCC:other@example.test"])
    assert.equal(field.safeParse(value).success, false, value);
  const max = "a".repeat(64) + "@" + ("b".repeat(63) + ".").repeat(2) + "c".repeat(57) + ".com";
  assert.equal(max.length, 254);
  assert.equal(field.safeParse(max).success, true);
  assert.equal(field.safeParse(max.replace(".com", "d.com")).success, false);
});
test("Owners email remains shared non-translatable contact data", () => {
  assert.equal(translatablePaths(companySettingsInput).includes("owners_email"), false);
});
