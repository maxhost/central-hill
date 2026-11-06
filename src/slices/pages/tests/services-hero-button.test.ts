import test from "node:test";
import assert from "node:assert/strict";
import { servicesAdapter } from "../adapters/services";
import { servicesSchema } from "../schemas/services";
import { servicesDescriptor } from "../services-content";
import { prepareTargetEnvelope, sameEditorialSnapshot, sharedEnvelope } from "../editorial-content";
import { isEditableFieldPath, pageSections } from "../admin/home-contextual";
import { validatePageLivePreview } from "../admin/live-preview-validation";
import type { PageEnvelope } from "../editorial-types";

test("Services Hero exposes localized label/URL inside its consolidated section", () => {
  const section = pageSections(servicesDescriptor, key => key).find(section => section.id === "hero")!;
  assert.equal(section.selectAsGroup, true);
  for (const path of ["hero.cta_label", "hero.cta_url"]) {
    assert.ok(servicesDescriptor.textPatterns.includes(path));
    assert.ok(isEditableFieldPath(servicesDescriptor.rootNode, path));
    assert.ok(section.bindings.some(binding => binding.id === path));
  }
  assert.equal(servicesSchema.safeParse({}).success, true);
  assert.equal(servicesSchema.safeParse({ hero: {} }).success, true);
});

test("Services booking overrides stay independent across EN/ES/PT/FR and retain shared media guards", () => {
  const source: PageEnvelope<"services"> = { schemaVersion: 1, content: { hero: { cta_label: "Book EN", cta_url: "https://booking.example.test/en" } }, ogImageMediaId: null };
  const before = structuredClone(source);
  for (const locale of ["en", "es", "pt", "fr"]) {
    const target = structuredClone(source);
    target.content.hero = { ...target.content.hero, cta_label: `Book ${locale}`, cta_url: `https://booking.example.test/${locale}?dates=1#stay` };
    assert.equal(sharedEnvelope(source, servicesDescriptor), sharedEnvelope(target, servicesDescriptor));
    const prepared = prepareTargetEnvelope(source, target, servicesDescriptor);
    assert.equal(prepared.content.hero?.cta_label, `Book ${locale}`);
    assert.equal(prepared.content.hero?.cta_url, `https://booking.example.test/${locale}?dates=1#stay`);
    assert.ok(validatePageLivePreview("services", { envelope: target, localMedia: {} }, "http://localhost:3071"));
    target.content.hero.media_media_id = "00000000-0000-4000-8000-000000000001";
    assert.notEqual(sharedEnvelope(source, servicesDescriptor), sharedEnvelope(target, servicesDescriptor));
  }
  assert.deepEqual(source, before);
});

test("legacy missing Services Hero/overrides stay absent and clean instead of inheriting EN", () => {
  const source: PageEnvelope<"services"> = { schemaVersion: 1, content: { hero: { cta_label: "New EN", cta_url: "https://example.test/new-en" } }, ogImageMediaId: null };
  for (const hero of [undefined, {}, { headline: "Legacy heading" }, { cta_label: "", cta_url: "" }]) {
    const target: PageEnvelope<"services"> = { schemaVersion: 1, content: hero === undefined ? {} : { hero }, ogImageMediaId: null };
    const prepared = prepareTargetEnvelope(source, target, servicesDescriptor);
    assert.equal(prepared.content.hero?.cta_label, hero?.cta_label);
    assert.equal(prepared.content.hero?.cta_url, hero?.cta_url);
    // Editor baselines scaffold optional sections and SEO before dirty comparison.
    assert.equal(sameEditorialSnapshot(
      { ...prepared, content: servicesAdapter.normalize(prepared.content) },
      { ...target, content: servicesAdapter.normalize(target.content) },
    ), true);
  }
});

test("Services Hero URLs permit HTTP(S)/blank and reject unsafe or malformed destinations", () => {
  for (const cta_url of [undefined, "", "https://example.test/fr/book?dates=1#stay", "http://localhost:3071/es"]) {
    assert.equal(servicesSchema.safeParse({ hero: { cta_label: "Book", cta_url } }).success, true);
    assert.equal(servicesAdapter.draftSchema.safeParse({ hero: { cta_url } }).success, true);
  }
  for (const cta_url of ["javascript:alert(1)", "data:text/html,test", "ftp://example.test/file", "not-a-url"]) {
    assert.equal(servicesSchema.safeParse({ hero: { cta_url } }).success, false, cta_url);
    assert.equal(servicesAdapter.draftSchema.safeParse({ hero: { cta_url } }).success, false, cta_url);
  }
  assert.equal(servicesSchema.safeParse({ hero: { cta_label: "x".repeat(81) } }).success, false);
});
