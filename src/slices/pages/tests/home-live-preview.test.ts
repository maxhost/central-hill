import test from "node:test";
import assert from "node:assert/strict";
import { validateHomeLivePreview } from "../admin/live-preview-validation";
import { applyDefaults, describe } from "../admin/form-model";
import { homeSchema } from "../schemas/home";
import { normalizeHome } from "../home-content";
import type { HomeLivePreviewInput } from "../editorial-types";
function fixture(): HomeLivePreviewInput {
  const content = normalizeHome(applyDefaults(describe(homeSchema), {}) as HomeLivePreviewInput["envelope"]["content"]);
  content.guests_pitch.benefits.forEach(item => item.icon_key = "check");
  content.services_carousel.assurances.forEach(item => item.icon_key = "check");
  return { envelope: { schemaVersion: 1, content, ogImageMediaId: null }, localMedia: {} };
}
const origin = "http://127.0.0.1:3067";
const id = "46d4b557-b1f1-4ac2-96b3-a32004b68283";
test("Live preview accepts bounded unfinished draft state while rejecting malformed content and identities", () => {
  const value = fixture();
  assert.ok(validateHomeLivePreview(value, origin));
  value.envelope.content.hero.headline = "Typing unsaved text";
  assert.equal(validateHomeLivePreview(value, origin)?.envelope.content.hero.headline, "Typing unsaved text");
  const valid = structuredClone(value);
  value.envelope.content.hero.headline = "x".repeat(161);
  assert.equal(validateHomeLivePreview(value, origin), null);
  valid.envelope.content._list_ids!["guests_pitch.benefits"]![1] = "legacy_0";
  assert.equal(validateHomeLivePreview(valid, origin), null);
  assert.equal(validateHomeLivePreview({ ...fixture(), localMedia: [], unexpected: true }, origin), null);
});
test("Queued references accept only same-origin blobs with matching UUID, slot MIME and bounded metadata", () => {
  const value = fixture();
  value.envelope.content.guests_pitch.image_media_id = id;
  value.localMedia[id] = { id, url: `blob:${origin}/${id}`, width: null, height: null, mime: "image/png", name: "local.png" };
  assert.ok(validateHomeLivePreview(value, origin));
  for (const url of [`blob:https://other.test/${id}`, "https://example.test/image.png", "javascript:alert(1)", "blob:null/123", `blob:${origin}/${id}#fragment`]) {
    assert.equal(validateHomeLivePreview({ ...value, localMedia: { [id]: { ...value.localMedia[id], url } } }, origin), null);
  }
  assert.equal(validateHomeLivePreview(value, undefined), null);
  assert.equal(validateHomeLivePreview({ ...value, localMedia: { [id]: { ...value.localMedia[id], mime: "image/svg+xml" } } }, origin), null);
  assert.equal(validateHomeLivePreview({ ...value, localMedia: { [id]: { ...value.localMedia[id], width: 30000 } } }, origin), null);
  value.envelope.content.hero.poster_media_id = id;
  value.localMedia[id]!.mime = "video/mp4";
  assert.equal(validateHomeLivePreview(value, origin), null);
});
