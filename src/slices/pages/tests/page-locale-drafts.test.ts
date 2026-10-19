import test from "node:test";
import assert from "node:assert/strict";
import { homeDraftSchema } from "../admin/editorial-validation";
import { homeSchema } from "../schemas/home";
import { applyDefaults, describe } from "../admin/form-model";
import { normalizeHome } from "../home-content";
import { sharedEnvelope, prepareTargetEnvelope } from "../editorial-content";
import type { PageEnvelope } from "../editorial-types";

test("Draft validation accepts unfinished text/links but preserves bounded structure and target shared values", () => {
  const content = normalizeHome(applyDefaults(describe(homeSchema), {}) as PageEnvelope["content"]);
  content.guests_pitch.benefits.forEach(item => item.icon_key = "check");
  content.services_carousel.assurances.forEach(item => item.icon_key = "check");
  assert.equal(homeDraftSchema.safeParse(content).success, true);
  assert.equal(homeSchema.safeParse(content).success, false);
  const envelope: PageEnvelope = { schemaVersion: 1, content, ogImageMediaId: null };
  const target = structuredClone(envelope);
  target.content.seo = { meta_title: "SEO español", meta_description: "Descripción" };
  target.content.hero.headline = "Otro título";
  assert.equal(sharedEnvelope(envelope), sharedEnvelope(target));
  target.content.hero.video_media_id = "46d4b557-b1f1-4ac2-96b3-a32004b68283";
  assert.notEqual(sharedEnvelope(envelope), sharedEnvelope(target));
  content.hero.headline = "x".repeat(161);
  assert.equal(homeDraftSchema.safeParse(content).success, false);
});

test("Preparing a fresh target follows stable IDs across reorder without losing its text", () => {
  const content = normalizeHome(applyDefaults(describe(homeSchema), {}) as PageEnvelope["content"]);
  const target: PageEnvelope = { schemaVersion: 1, content, ogImageMediaId: null };
  target.content.guests_pitch.benefits[0]!.title = "Primer beneficio";
  target.content.guests_pitch.benefits[1]!.title = "Segundo beneficio";
  const template = structuredClone(target);
  template.content.guests_pitch.benefits.reverse();
  template.content._list_ids!["guests_pitch.benefits"]!.reverse();
  template.content.guests_pitch.benefits.forEach(item => item.title = "English");
  const prepared = prepareTargetEnvelope(template, target);
  assert.equal(prepared.content.guests_pitch.benefits[3]!.title, "Primer beneficio");
  assert.equal(prepared.content.guests_pitch.benefits[2]!.title, "Segundo beneficio");
  assert.deepEqual(prepared.content._list_ids, template.content._list_ids);
  assert.equal(target.content.guests_pitch.benefits[0]!.title, "Primer beneficio");
});
