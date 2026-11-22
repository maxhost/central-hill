import assert from "node:assert/strict";
import { test } from "node:test";
import { feedbackMessage, uploadFeedback, uploadFailureCause, type FeedbackGroup } from "../ui/editor-feedback-copy";
const groups: FeedbackGroup[] = ["en", "es", "pt", "fr"].map(locale => ({ locale: locale as FeedbackGroup["locale"], issues: [{ path: "title", label: "Title", section: "Article", message: "Enter a title." }] }));
test("an action rejection names its locale and every other known locale", () => {
  for (const outcome of ["validation", "conflict", "server", "uncertain", "no_draft"] as const) {
    const message = feedbackMessage({ action: "publish", locale: "es", outcome, groups });
    for (const code of ["ES", "EN", "PT", "FR"]) assert.ok(message.includes(code), `${outcome} omits ${code}`);
    assert.ok(!message.includes("saved."));
  }
});
test("success belongs exclusively to its attempted locale despite other known errors", () => {
  assert.equal(feedbackMessage({ action: "publish", locale: "es", outcome: "success", groups }), "Changes published (ES only).");
  assert.equal(feedbackMessage({ action: "save", locale: "pt", outcome: "success", groups }), "Draft saved (PT).");
});
test("shared field notice requires a semantic shared change", () => {
  assert.equal(feedbackMessage({ action: "save", locale: "en", outcome: "success", sharedChanged: false }), "Draft saved (EN).");
  assert.match(feedbackMessage({ action: "save", locale: "en", outcome: "success", sharedChanged: true }), /Shared fields were also updated for all languages/);
});
test("commit warning remains success and distinguishes public refresh from editor readback", () => {
  assert.match(feedbackMessage({ action: "publish", locale: "fr", outcome: "success", refreshWarning: true }), /^Published \(FR\), but the public view/);
  assert.match(feedbackMessage({ action: "save", locale: "es", outcome: "success", refreshWarning: true, reloadRequired: true }), /^Draft saved \(ES\), but the latest editor state/);
});
test("uncertain transport does not promise rollback or suggest automatic retry", () => {
  const message = feedbackMessage({ action: "save", locale: "es", outcome: "uncertain" });
  assert.match(message, /could not confirm whether/);
  assert.match(message, /Reload to check before trying again/);
  assert.doesNotMatch(message, /has not been saved/);
});
test("upload feedback is localized to the selection and sanitizes failure stages", () => {
  assert.match(uploadFeedback("pt", ["cover.png", "gallery.png"]), /cover.png.*gallery.png.*PT/);
  assert.match(uploadFailureCause("finalize"), /transferred.*finalized/);
  for (const stage of ["presign", "put", "finalize"] as const) assert.doesNotMatch(uploadFailureCause(stage), /https?:|token|stack/);
});

test("cross-locale required uploads distinguish selection origins from the attempted draft", () => {
  const message = uploadFeedback("es", ["shared-cover.png", "spanish-image.png"], ["en", "es"]);
  assert.match(message, /“shared-cover.png” \(selected in EN; required for this ES draft\)/);
  assert.match(message, /“spanish-image.png” \(selected in ES; required for this ES draft\)/);
  assert.match(message, /Your ES draft has not been saved/);
  assert.doesNotMatch(message, /Your EN draft has not been saved/);
  assert.doesNotMatch(message, /independent|shared dependency/);
});
test("same-locale upload copy remains compatible and unknown origins are not invented", () => {
  assert.equal(uploadFeedback("es", ["cover.png"], ["es"]), uploadFeedback("es", ["cover.png"]));
  const mixed = uploadFeedback("es", ["known.png", "unknown.png"], ["en", undefined]);
  assert.match(mixed, /known.png” \(selected in EN/);
  assert.doesNotMatch(mixed, /unknown.png” \(selected/);
});
