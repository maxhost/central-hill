import test from "node:test";
import assert from "node:assert/strict";
import { ownersAdapter } from "../adapters/owners";
import { getEditorialAdapter } from "../server/editorial-adapters";
import { editorialPageKeys } from "../editorial-registry";
import type { PageEnvelope } from "../editorial-types";
import { pageLivePreviewMediaErrors, validatePageLivePreview } from "../admin/live-preview-validation";

const missing = "00000000-0000-4000-8000-000000000001";
const uploaded = "00000000-0000-4000-8000-000000000002";
function owners(): PageEnvelope<"owners"> {
  const content = ownersAdapter.defaultContent();
  content.hero.image_media_id = missing;
  content.stats = [{ to: "25", label: "Original figure", prefix: "", suffix: "%", group: false }];
  delete content._list_ids;
  return { schemaVersion: 1, content: ownersAdapter.normalize(content), ogImageMediaId: null };
}

test("Owners missing legacy Hero image allows live Hero and Figures edits in each locale", () => {
  for (const locale of ["en", "es", "pt", "fr"]) {
    const envelope = owners();
    envelope.content.hero.headline = `Hero ${locale}`;
    envelope.content.stats_title = `Figures ${locale}`;
    envelope.content.stats[0]!.to = "987";
    envelope.content.stats[0]!.label = `Figure ${locale}`;
    assert.ok(validatePageLivePreview("owners", { envelope, localMedia: {} }, "http://localhost:3071"));
    assert.deepEqual(pageLivePreviewMediaErrors("owners", envelope, new Map()), {});
    assert.ok(ownersAdapter.mediaErrors(envelope.content, null, new Map())["hero.image_media_id"],
      "Save/Publish continue to reject an unresolved asset");
  }
});

test("missing assets do not hide unsupported MIME on available assets or invalid references", () => {
  const envelope = owners();
  envelope.content.final_cta = { image_media_id: uploaded };
  const assets = new Map([[uploaded, { mime: "video/mp4" }]]);
  assert.deepEqual(Object.keys(pageLivePreviewMediaErrors("owners", envelope, assets)), ["final_cta.image_media_id"]);
  assets.set(uploaded, { mime: "image/jpeg" });
  assert.deepEqual(pageLivePreviewMediaErrors("owners", envelope, assets), {});
  assets.set(missing, { mime: "application/pdf" });
  assert.deepEqual(Object.keys(pageLivePreviewMediaErrors("owners", envelope, assets)), ["hero.image_media_id"]);
  envelope.content.hero.image_media_id = "invalid";
  assert.ok(pageLivePreviewMediaErrors("owners", envelope, new Map())["hero.image_media_id"]);
  assert.equal(validatePageLivePreview("owners", { envelope, localMedia: {} }, "http://localhost:3071"), null);
});

test("a pending local Hero upload keeps its type and origin validation", () => {
  const envelope = owners();
  const local = { id: missing, url: `blob:http://localhost:3071/${uploaded}`, width: 100, height: 100, mime: "image/jpeg" };
  const check = (media: typeof local) => validatePageLivePreview("owners", { envelope, localMedia: { [missing]: media } }, "http://localhost:3071");
  assert.ok(check(local));
  assert.equal(check({ ...local, mime: "video/mp4" }), null);
  assert.equal(check({ ...local, url: `blob:http://other.test/${uploaded}` }), null);
});

test("every Page applies missing OG fallback without weakening available OG type checks", () => {
  for (const key of editorialPageKeys) {
    const adapter = getEditorialAdapter(key);
    const envelope = { schemaVersion: 1 as const, content: adapter.defaultContent(), ogImageMediaId: missing };
    assert.deepEqual(pageLivePreviewMediaErrors(key, envelope, new Map()), {}, key);
    assert.ok(pageLivePreviewMediaErrors(key, envelope, new Map([[missing, { mime: "video/mp4" }]]))["og_image_media_id"], key);
  }
});
