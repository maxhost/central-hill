import test from "node:test";
import assert from "node:assert/strict";
import { guestAdapter, guestDraftSchema } from "../adapters/guest";
import { guestSchema } from "../schemas/guest";
import { guestDescriptor } from "../guest-content";
import { prepareTargetEnvelope, sameEditorialSnapshot, sharedEnvelope } from "../editorial-content";
import { isEditableFieldPath, pageFieldLabel, pageSections } from "../admin/home-contextual";
import { validatePageLivePreview } from "../admin/live-preview-validation";
import type { PageEnvelope } from "../editorial-types";

const paths = ["dual_cta.guest.contact_line", "dual_cta.owner.contact_line"];
function envelope(): PageEnvelope<"guest"> {
  const content = guestAdapter.defaultContent();
  for (const cta of [content.hero.cta, content.why.cta, content.portfolio.cta, content.services_teaser.cta, content.activities_teaser.cta, content.dual_cta.guest.cta, content.dual_cta.owner.cta])
    cta.url = "https://example.test/fixed";
  return { schemaVersion: 1, content, ogImageMediaId: null };
}

test("both Guest contact lines are localized editable fields with explicit panel labels", () => {
  const section = pageSections(guestDescriptor, key => key).find(section => section.id === "dual_cta")!;
  assert.equal(section.selectAsGroup, true);
  for (const path of paths) {
    assert.ok(guestDescriptor.textPatterns.includes(path), path);
    assert.ok(isEditableFieldPath(guestDescriptor.rootNode, path), path);
    assert.ok(section.bindings.some(binding => binding.id === path), path);
  }
  assert.equal(pageFieldLabel(paths[0]!, key => key), "guest · contact_line");
  assert.equal(pageFieldLabel(paths[1]!, key => key), "owner · contact_line");
});

test("EN/ES/PT/FR contact overrides remain independent and preserve shared fields", () => {
  const source = envelope();
  source.content.dual_cta.guest.contact_line = "Guest EN";
  source.content.dual_cta.owner.contact_line = "Owner EN";
  const original = structuredClone(source);
  for (const locale of ["en", "es", "pt", "fr"]) {
    const target = structuredClone(source);
    target.content.dual_cta.guest.contact_line = `Guest ${locale} · guest@example.test`;
    target.content.dual_cta.owner.contact_line = `Owner ${locale} · WhatsApp +351 111 222 333`;
    assert.equal(sharedEnvelope(target, guestDescriptor), sharedEnvelope(source, guestDescriptor));
    const prepared = prepareTargetEnvelope(source, target, guestDescriptor);
    for (const side of ["guest", "owner"] as const)
      assert.equal(prepared.content.dual_cta[side].contact_line, target.content.dual_cta[side].contact_line);
    assert.ok(validatePageLivePreview("guest", { envelope: target, localMedia: {} }, "http://localhost:3071"));
  }
  assert.deepEqual(source, original);
});

test("legacy and blank contact overrides retain Settings fallback without inheriting EN or becoming dirty", () => {
  const legacy = envelope();
  for (const side of ["guest", "owner"] as const) delete legacy.content.dual_cta[side].contact_line;
  assert.equal(guestSchema.safeParse(legacy.content).success, true);
  const source = structuredClone(legacy);
  source.content.dual_cta.guest.contact_line = "New EN guest contact";
  source.content.dual_cta.owner.contact_line = "New EN owner contact";
  const prepared = prepareTargetEnvelope(source, legacy, guestDescriptor);
  assert.equal(prepared.content.dual_cta.guest.contact_line, undefined);
  assert.equal(prepared.content.dual_cta.owner.contact_line, undefined);
  assert.equal(sameEditorialSnapshot(prepared, legacy), true);
  const cleared = structuredClone(legacy);
  cleared.content.dual_cta.guest.contact_line = "";
  cleared.content.dual_cta.owner.contact_line = "   ";
  const reopened = prepareTargetEnvelope(source, cleared, guestDescriptor);
  assert.equal(reopened.content.dual_cta.guest.contact_line, "");
  assert.equal(reopened.content.dual_cta.owner.contact_line, "   ");
});

test("each contact line allows blank/300 characters and rejects overlong text in draft/publication", () => {
  for (const side of ["guest", "owner"] as const) {
    const { content } = envelope();
    for (const value of ["", " ", "x".repeat(300)]) {
      content.dual_cta[side].contact_line = value;
      assert.equal(guestSchema.safeParse(content).success, true);
      assert.equal(guestDraftSchema.safeParse(content).success, true);
    }
    content.dual_cta[side].contact_line = "x".repeat(301);
    assert.equal(guestSchema.safeParse(content).success, false);
    assert.equal(guestDraftSchema.safeParse(content).success, false);
  }
});
