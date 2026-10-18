import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveServiceCopy,
  serviceCopySchema,
  serviceCopySourceFields,
} from "../copy";
test("copy uses scalar fields and clears explicitly absent overrides", () => {
  const fields = serviceCopySourceFields({ optionsTitle: "  Your menu  " });
  assert.equal(fields["copy:optionsTitle"], "Your menu");
  assert.equal(fields["copy:ratesTitle"], null);
});
test("copy validates placeholders, unknown keys and length", () => {
  assert.equal(
    serviceCopySchema.safeParse({ enquiryTitle: "Request {name}" }).success,
    true,
  );
  for (const value of [
    { enquiryTitle: "Request" },
    { enquiryTitle: "{name} {name}" },
    { optionsTitle: "{bad}" },
    { arbitrary: "Text" },
    { optionsTitle: "a".repeat(201) },
  ])
    assert.equal(serviceCopySchema.safeParse(value).success, false);
});
test("malformed approved target falls back per-field without losing valid localized labels", () => {
  const local: Record<string, string> = {
    "copy:enquiryTitle": "{wrong}",
    "copy:optionsTitle": "Su menú",
  };
  const source: Record<string, string> = {
    "copy:enquiryTitle": "Request {name}",
  };
  const copy = resolveServiceCopy(
    (key) => local[key],
    (key) => source[key],
  );
  assert.equal(copy.enquiryTitle, "Request {name}");
  assert.equal(copy.optionsTitle, "Su menú");
  assert.equal(copy.ratesTitle, undefined);
});
