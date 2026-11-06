import test from "node:test";
import assert from "node:assert/strict";
import { guestAdapter, guestDraftSchema } from "../adapters/guest";
import { guestSchema } from "../schemas/guest";
import { guestDescriptor } from "../guest-content";
import { prepareTargetEnvelope, sameEditorialSnapshot, sharedEnvelope } from "../editorial-content";
import { pageSections, isEditableFieldPath } from "../admin/home-contextual";
import { validatePageLivePreview } from "../admin/live-preview-validation";
import type { PageEnvelope } from "../editorial-types";

function envelope(): PageEnvelope<"guest"> {
  return { schemaVersion: 1, content: guestAdapter.defaultContent(), ogImageMediaId: null };
}

test("Guest Hero label and URL are editable locale fields while fixed destinations remain shared", () => {
  const source = envelope();
  source.content.hero.cta_label = "Book EN";
  source.content.hero.cta_url = "https://example.test/en/book";
  const original = structuredClone(source);
  const section = pageSections(guestDescriptor, key => key).find(section => section.id === "hero")!;
  assert.equal(section.selectAsGroup, true);
  for (const path of ["hero.cta_label", "hero.cta_url"]) {
    assert.ok(guestDescriptor.textPatterns.includes(path));
    assert.ok(section.bindings.some(binding => binding.id === path));
    assert.ok(isEditableFieldPath(guestDescriptor.rootNode, path));
  }
  assert.ok(!guestDescriptor.textPatterns.includes("why.cta.url"));
  assert.equal(isEditableFieldPath(guestDescriptor.rootNode, "why.cta.url"), false);
  for (const locale of ["es", "pt", "fr"]) {
    const target = structuredClone(source);
    target.content.hero.cta_label = `Book ${locale}`;
    target.content.hero.cta_url = `https://example.test/${locale}/book?dates=1#stay`;
    assert.equal(sharedEnvelope(target, guestDescriptor), sharedEnvelope(source, guestDescriptor));
    const prepared = prepareTargetEnvelope(source, target, guestDescriptor);
    assert.equal(prepared.content.hero.cta_label, target.content.hero.cta_label);
    assert.equal(prepared.content.hero.cta_url, target.content.hero.cta_url);
    assert.ok(validatePageLivePreview("guest", { envelope: target, localMedia: {} }, "http://localhost:3071"));
    target.content.why.cta.url = "https://example.test/changed-fixed-url";
    assert.notEqual(sharedEnvelope(target, guestDescriptor), sharedEnvelope(source, guestDescriptor));
  }
  assert.deepEqual(source, original);
});

test("Guest Hero draft URL allows unfinished blank values and rejects unsafe destinations", () => {
  const { content } = envelope();
  for (const cta of [content.hero.cta, content.why.cta, content.portfolio.cta, content.services_teaser.cta, content.activities_teaser.cta, content.dual_cta.guest.cta, content.dual_cta.owner.cta])
    cta.url = "https://example.test/fixed";
  for (const url of ["https://example.test/fr/book?dates=1#stay", "http://localhost:3071/es"]) {
    content.hero.cta_url = url;
    assert.equal(guestSchema.safeParse(content).success, true);
    assert.equal(guestDraftSchema.safeParse(content).success, true);
  }
  for (const url of ["javascript:alert(1)", "data:text/html,test", "ftp://example.test/file", "not-a-url"]) {
    content.hero.cta_url = url;
    assert.equal(guestSchema.safeParse(content).success, false, url);
    assert.equal(guestDraftSchema.safeParse(content).success, false, url);
  }
  content.hero.cta_url = "";
  assert.equal(guestDraftSchema.safeParse(content).success, true);
  assert.equal(guestSchema.safeParse(content).success, true, "Blank restores the booking fallback");
  const source: PageEnvelope<"guest"> = { schemaVersion: 1, content, ogImageMediaId: null };
  const target = structuredClone(source);
  target.content.hero.cta_label = "";
  assert.equal(prepareTargetEnvelope(source, target, guestDescriptor).content.hero.cta_label, "");
  assert.equal(prepareTargetEnvelope(source, target, guestDescriptor).content.hero.cta_url, "");
});


test("Legacy Guest snapshots retain booking fallbacks and do not inherit a new EN override", () => {
  const source = envelope();
  source.content.hero.cta = { label: "Browse Our Apartments", url: "https://example.test/en/buildings" };
  source.content.hero.cta_label = "New EN booking";
  source.content.hero.cta_url = "https://example.test/en/new-booking";
  const legacy = envelope();
  legacy.content.hero.cta = structuredClone(source.content.hero.cta);
  delete legacy.content.hero.cta_label;
  delete legacy.content.hero.cta_url;
  const prepared = prepareTargetEnvelope(source, legacy, guestDescriptor);
  assert.equal(prepared.content.hero.cta_label, undefined);
  assert.equal(prepared.content.hero.cta_url, undefined);
  assert.deepEqual(prepared.content.hero.cta, legacy.content.hero.cta);
  assert.equal(sameEditorialSnapshot(prepared, legacy), true);
  assert.ok(!isEditableFieldPath(guestDescriptor.rootNode, "hero.cta.label"));
  assert.ok(!guestDescriptor.textPatterns.includes("hero.cta.url"));
});
