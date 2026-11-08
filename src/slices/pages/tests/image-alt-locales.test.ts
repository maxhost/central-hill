import assert from "node:assert/strict";
import test from "node:test";
import { mediaAltsSchema, resolveMediaAlt } from "@core/media/alt";
import { ownerMediaAltsSchema, rawOwnerMediaAlts, resolveOwnerMediaAlt, ownerMediaAltField } from "@core/media/owner-alt";
import { pageImageFields } from "../admin/image-alt-fields";
import { prepareTargetEnvelope, sharedEnvelope } from "../editorial-content";
import { validateEnvelope } from "../admin/editorial-validation";
import { homeAdapter } from "../adapters/home";
import { aboutAdapter } from "../adapters/about";
import { realEstateAdapter } from "../adapters/real-estate";
import type { PageEnvelope } from "../editorial-types";

const IMAGE = "d3000000-0000-4000-8000-000000000001";
const OTHER = "d3000000-0000-4000-8000-000000000002";

test("bounded image descriptions accept old absent maps and reject invalid identities/oversized text", () => {
  assert.deepEqual(mediaAltsSchema.parse({ [IMAGE]: " Courtyard " }), { [IMAGE]: "Courtyard" });
  for (const input of [{ invalid: "Text" }, { [IMAGE]: "x".repeat(501) }, { [IMAGE]: null }]) assert.equal(mediaAltsSchema.safeParse(input).success, false);
  assert.equal(ownerMediaAltsSchema.safeParse({ en: "", es: "", pt: "", fr: "" }).success, true);
  assert.equal(ownerMediaAltsSchema.safeParse({ en: "", es: "" }).success, false);
});
test("local image ALT follows image identity and never replaces the legacy fallback when blank", () => {
  const own = { [IMAGE]: "Patio en español" };
  assert.equal(resolveMediaAlt(own, IMAGE, "Legacy"), "Patio en español");
  assert.equal(resolveMediaAlt(own, OTHER, "Other image"), "Other image");
  assert.equal(resolveMediaAlt({ [IMAGE]: " " }, IMAGE, "Legacy"), "Legacy");
  assert.equal(resolveMediaAlt(undefined, IMAGE, "Legacy"), "Legacy");
});
test("Page ALT is localized while photo IDs stay guarded; prepared targets retain own descriptions", () => {
  const en: PageEnvelope = { schemaVersion: 1, content: homeAdapter.defaultContent(), ogImageMediaId: IMAGE, mediaAlts: { [IMAGE]: "English" } };
  const es = prepareTargetEnvelope(en, null, homeAdapter.descriptor);
  assert.deepEqual(es.mediaAlts, en.mediaAlts);
  es.mediaAlts![IMAGE] = "Español";
  assert.equal(en.mediaAlts![IMAGE], "English", "Target edits cannot mutate template objects");
  assert.equal(sharedEnvelope(es), sharedEnvelope(en));
  const next = structuredClone(en); next.mediaAlts![IMAGE] = "New English";
  const prepared = prepareTargetEnvelope(next, es, homeAdapter.descriptor);
  assert.equal(prepared.mediaAlts![IMAGE], "Español");
  prepared.ogImageMediaId = OTHER;
  assert.notEqual(sharedEnvelope(prepared), sharedEnvelope(en));
  const legacy = structuredClone(en); delete legacy.mediaAlts;
  assert.equal(Object.hasOwn(validateEnvelope(legacy).payload!, "mediaAlts"), false);
  assert.equal(validateEnvelope(es).errors.mediaAlts, undefined);
  assert.ok(Object.keys(validateEnvelope({ ...es, mediaAlts: { invalid: "Text" } }).errors).length);
});
test("existing Page sibling ALT fields pair to the same image, including nested certification logos and split photos", () => {
  const about = aboutAdapter.defaultContent();
  const slots = pageImageFields(aboutAdapter.descriptor.rootNode, about);
  assert.equal(slots.find(slot => slot.path.join(".") === "hero.image_media_id")?.inlineAltPath?.join("."), "hero.image_alt");
  assert.equal(slots.find(slot => slot.path.join(".") === "certifications.items.0.logo_media_id")?.inlineAltPath?.join("."), "certifications.items.0.logo_alt");
  const realEstate = realEstateAdapter.defaultContent();
  const re = pageImageFields(realEstateAdapter.descriptor.rootNode, realEstate);
  assert.equal(re.find(slot => slot.path.join(".") === "market.fundamentals.image_left_media_id")?.inlineAltPath?.join("."), "market.fundamentals.image_left_alt");
  const home = pageImageFields(homeAdapter.descriptor.rootNode, homeAdapter.defaultContent());
  assert.equal(home.some(slot => slot.accept === "video" || slot.accept === "document"), false);
});
test("non-tab controls show raw pending values and resolve approved target then EN then legacy", () => {
  const field = ownerMediaAltField(IMAGE);
  const rows = [
    { locale: "en" as const, field, value: "English photo", state: "draft" },
    { locale: "es" as const, field, value: "Pendiente", state: "needs_review" },
    { locale: "pt" as const, field, value: "Fotografia", state: "approved" },
  ];
  assert.deepEqual(rawOwnerMediaAlts(rows, IMAGE), { en: "English photo", es: "Pendiente", pt: "Fotografia", fr: "" });
  assert.equal(resolveOwnerMediaAlt(rows, IMAGE, "es", "Legacy"), "English photo");
  assert.equal(resolveOwnerMediaAlt(rows, IMAGE, "pt", "Legacy"), "Fotografia");
  assert.equal(resolveOwnerMediaAlt(rows, OTHER, "pt", "Legacy"), "Legacy");
  assert.equal(resolveOwnerMediaAlt(rows.filter(row => row.locale !== "en"), IMAGE, "pt", "Legacy"), "Fotografia");
});
