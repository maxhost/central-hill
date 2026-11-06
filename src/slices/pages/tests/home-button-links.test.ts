import test from "node:test";
import assert from "node:assert/strict";
import { translatablePaths } from "@core/validation/primitives";
import { homeSchema } from "../schemas/home";
import { homeDraftSchema } from "../adapters/home";
import { applyDefaults, describe } from "../admin/form-model";
import { homeButtonFields, homeSections } from "../admin/home-contextual";
import { normalizeHome, homeAt, homeSet } from "../home-content";
import { prepareTargetEnvelope, sameEditorialSnapshot, sharedEnvelope } from "../editorial-content";
import type { PageEnvelope } from "../editorial-types";

const urls = ["hero.cta_primary.url", "guests_pitch.cta.url", "dual_cta.guest.cta_url"];
function fixture(): PageEnvelope {
  const content = normalizeHome(applyDefaults(describe(homeSchema), {}) as PageEnvelope["content"]);
  content.guests_pitch.benefits.forEach(item => item.icon_key = "check");
  content.services_carousel.assurances.forEach(item => item.icon_key = "check");
  urls.forEach(path => homeSet(content, path, "https://example.test/en/book"));
  return { schemaVersion: 1, content, ogImageMediaId: null };
}

test("All three Home destinations belong to their locale and retain values on template adoption", () => {
  const english = fixture();
  const original = structuredClone(english);
  const paths = translatablePaths(homeSchema);
  urls.forEach(path => assert.ok(paths.includes(path), path));
  assert.ok(!paths.includes("hero.cta_secondary.url"));
  for (const locale of ["es", "pt", "fr"]) {
    const target = structuredClone(english);
    urls.forEach(path => homeSet(target.content, path, `https://example.test/${locale}/book`));
    target.content.hero.cta_primary.label = `Book ${locale}`;
    target.content.guests_pitch.cta.label = `Stay ${locale}`;
    target.content.dual_cta.guest.cta_label = `Guest ${locale}`;
    assert.equal(sharedEnvelope(target), sharedEnvelope(english), "Targets may edit these URLs");
    const prepared = prepareTargetEnvelope(english, target);
    urls.forEach(path => assert.equal(homeAt(prepared.content, path), `https://example.test/${locale}/book`));
    assert.equal(prepared.content.hero.cta_primary.label, `Book ${locale}`);
    assert.equal(prepared.content.guests_pitch.cta.label, `Stay ${locale}`);
    assert.equal(prepared.content.dual_cta.guest.cta_label, `Guest ${locale}`);
    target.content.hero.poster_media_id = "46d4b557-b1f1-4ac2-96b3-a32004b68283";
    assert.notEqual(sharedEnvelope(target), sharedEnvelope(english), "Media remain shared");
  }
  assert.deepEqual(english, original, "Other languages must not mutate EN");
});

test("Old and blank closing guest URLs preserve fallback rather than inherit an EN override", () => {
  const english = fixture();
  const target = fixture();
  delete target.content.dual_cta.guest.cta_url;
  assert.equal(homeSchema.safeParse(target.content).success, true, "Existing snapshots stay valid");
  const prepared = prepareTargetEnvelope(english, target);
  assert.equal(prepared.content.dual_cta.guest.cta_url, undefined);
  assert.equal(sameEditorialSnapshot(prepared, target), true, "Opening an old locale must not create unsaved work");
  target.content.dual_cta.guest.cta_url = "";
  assert.equal(prepareTargetEnvelope(english, target).content.dual_cta.guest.cta_url, "");
  assert.equal(homeSchema.safeParse(target.content).success, true);
  assert.equal(sharedEnvelope(english), sharedEnvelope(target));
});

test("URL validation permits HTTP(S), unfinished blank drafts and optional fallback but rejects unsafe targets", () => {
  for (const path of urls) {
    const { content } = fixture();
    for (const value of ["https://example.test/es/book?a=1#dates", "http://localhost:3071/es"]) {
      homeSet(content, path, value);
      assert.equal(homeSchema.safeParse(content).success, true, path);
    }
    for (const value of ["javascript:alert(1)", "data:text/html,test", "not-a-url"]) {
      homeSet(content, path, value);
      assert.equal(homeDraftSchema.safeParse(content).success, false, path);
      assert.equal(homeSchema.safeParse(content).success, false, path);
    }
    homeSet(content, path, "");
    assert.equal(homeDraftSchema.safeParse(content).success, true, path);
    assert.equal(homeSchema.safeParse(content).success, path === "dual_cta.guest.cta_url", path);
  }
});

test("Selecting either button field exposes its label and URL while ordinary fields stay independent", () => {
  const sections = homeSections(describe(homeSchema), key => key);
  for (const path of urls) {
    const label = path === "dual_cta.guest.cta_url" ? "dual_cta.guest.cta_label" : path.replace(/\.url$/, ".label");
    assert.deepEqual(homeButtonFields(label), [label, path]);
    assert.deepEqual(homeButtonFields(path), [label, path]);
    const section = sections.find(section => section.bindings.some(binding => binding.id === label))!;
    assert.deepEqual(section.bindings.filter(binding => homeButtonFields(label).includes(binding.id)).map(binding => binding.id), [label, path]);
  }
  assert.deepEqual(homeButtonFields("hero.cta_secondary.label"), ["hero.cta_secondary.label"]);
  assert.deepEqual(homeButtonFields("guests_pitch.badge.label"), ["guests_pitch.badge.label"]);
});
