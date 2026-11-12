import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { z } from "zod";
import ts from "typescript";
import { mediaAltsSchema } from "@core/media/alt";
import { realEstateAdapter } from "../adapters/real-estate";
import { getEditorialAdapter } from "../server/editorial-adapters";
import { sharedEnvelope } from "../editorial-content";
import { realEstateMediaErrors, retainRealEstateHeroFallback } from "../admin/real-estate-media-validation";
import type { PageEnvelope } from "../editorial-types";

const missing = "8c343da2-a2bd-4ff1-9416-9e0bc9a2a7a0";
const other = "00000000-0000-4000-8000-000000000002";
function envelope(): PageEnvelope<"real_estate"> {
  const content = realEstateAdapter.defaultContent();
  content.hero.image_media_id = missing;
  for (const cta of [content.hero.cta_primary, content.hero.cta_secondary, content.partners.cta_primary, content.partners.cta_secondary, content.capabilities!.cta, content.asset_management.cta]) cta.url = "https://example.test/fixed";
  return { schemaVersion: 1, content, ogImageMediaId: null };
}
function validation(assets: ReadonlyMap<string, { mime: string }>) {
  const deps: Record<string, unknown> = {
    zod: { z }, "@core/media/alt": { mediaAltsSchema }, "../server/editorial-adapters": { getEditorialAdapter },
    "../editorial-content": { sharedEnvelope }, "./real-estate-media-validation": { retainRealEstateHeroFallback },
    "../adapters/home": {}, "@core/media": { loadMedia: async () => assets },
  };
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL("../admin/editorial-validation.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, { module: compiled, exports: compiled.exports, require: (name: string) => { assert.ok(Object.hasOwn(deps, name), name); return deps[name]; } });
  return compiled.exports as typeof import("../admin/editorial-validation");
}
test("Real Estate unrelated Save draft and Publish preserve the exact unresolved Hero and public fallback", async () => {
  const previous = envelope(), edited = structuredClone(previous);
  edited.content.deal_enquiry = { headline: "Enquiry edited independently", form_id: other };
  const original = structuredClone(edited);
  assert.ok(realEstateMediaErrors(edited.content, null, new Map())["hero.image_media_id"], "The base media policy still rejects an unresolved reference");
  for (const publication of [false, true]) {
    const result = await validation(new Map()).validateDraftMutation(edited, previous, "en", publication, "real_estate", previous);
    assert.deepEqual(Object.keys(result.errors), []);
    assert.equal(result.payload?.content.hero.image_media_id, missing);
    assert.equal(result.payload?.content.deal_enquiry?.form_id, other);
  }
  assert.deepEqual(edited, original, "Validation never repairs the stored reference or edits input");
});
test("new or changed missing Hero references are rejected", async () => {
  const previous = envelope(), next = structuredClone(previous);
  previous.content.hero.image_media_id = "";
  assert.ok((await validation(new Map()).validateDraftMutation(next, previous, "en", false, "real_estate", previous)).errors["hero.image_media_id"]);
  previous.content.hero.image_media_id = other;
  assert.ok((await validation(new Map()).validateDraftMutation(next, previous, "en", true, "real_estate", previous)).errors["hero.image_media_id"]);
});
test("malformed retained Hero and available unsupported MIME remain rejected", async () => {
  const previous = envelope(), next = structuredClone(previous);
  previous.content.hero.image_media_id = next.content.hero.image_media_id = "invalid";
  assert.ok((await validation(new Map()).validateDraftMutation(next, previous, "en", false, "real_estate", previous)).errors["hero.image_media_id"]);
  for (const mime of ["video/mp4", "application/pdf"]) {
    const en = envelope();
    assert.ok((await validation(new Map([[missing, { mime }]])).validateDraftMutation(en, en, "en", true, "real_estate", en)).errors["hero.image_media_id"]);
  }
  const uppercase = envelope(); uppercase.content.hero.image_media_id = missing.toUpperCase();
  assert.ok((await validation(new Map([[missing, { mime: "application/pdf" }]])).validateDraftMutation(uppercase, uppercase, "en", true, "real_estate", uppercase)).errors["hero.image_media_id"], "Canonical DB key cannot be mistaken for an unresolved uppercase reference");
});
test("other unresolved media and OG remain errors while the retained Hero alone is exempt", async () => {
  const en = envelope();
  en.content.market.fundamentals.image_left_media_id = other;
  en.ogImageMediaId = other;
  const result = await validation(new Map()).validateDraftMutation(en, en, "en", false, "real_estate", en);
  assert.deepEqual(Object.keys(result.errors).sort(), ["market.fundamentals.image_left_media_id", "og_image_media_id"]);
});
test("Owners keeps strict Save draft and Publish validation for its existing unresolved Hero", async () => {
  const en: PageEnvelope<"owners"> = { schemaVersion: 1, content: getEditorialAdapter("owners").defaultContent(), ogImageMediaId: null };
  en.content.hero.image_media_id = missing;
  for (const cta of [en.content.why.cta_primary, en.content.why.cta_secondary, en.content.services.cta, en.content.dashboard.cta, ...en.content.plans.helpers.flatMap(helper => helper.cta ? [helper.cta] : [])]) cta.url = "https://example.test/fixed";
  for (const publication of [false, true]) {
    const result = await validation(new Map()).validateDraftMutation(en, en, "en", publication, "owners", en);
    assert.ok(result.errors["hero.image_media_id"]);
  }
});

test("a draft cannot self-authorize a new missing Hero without the matching published authority", async () => {
  const published = envelope(); published.content.hero.image_media_id = other;
  const injectedDraft = envelope();
  const original = structuredClone(injectedDraft);
  for (const publication of [false, true]) {
    const withDifferentPublished = await validation(new Map()).validateDraftMutation(injectedDraft, injectedDraft, "en", publication, "real_estate", published);
    assert.ok(withDifferentPublished.errors["hero.image_media_id"], "A new orphan cannot borrow authority from itself");
    const noPublished = await validation(new Map()).validateDraftMutation(injectedDraft, injectedDraft, "en", publication, "real_estate", null);
    assert.ok(noPublished.errors["hero.image_media_id"], "No published baseline means no exemption");
  }
  assert.deepEqual(injectedDraft, original);
});
