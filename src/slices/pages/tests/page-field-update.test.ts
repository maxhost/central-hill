import test from "node:test";
import assert from "node:assert/strict";
import { setPageField } from "../admin/field-update";
import { validatePageLivePreview } from "../admin/live-preview-validation";
import { buildingsDescriptor, normalizeBuildings } from "../buildings-content";
import { buildingsSchema } from "../schemas/buildings";
import { describe } from "../admin/form-model";
import { guidesSchema } from "../schemas/guides";
import { homeSchema } from "../schemas/home";
import { homeAdapter } from "../adapters/home";
import { sharedEnvelope } from "../editorial-content";
import type { PageEnvelope } from "../editorial-types";

const preview = (content: unknown) => ({ envelope: { schemaVersion: 1, content, ogImageMediaId: null }, localMedia: {} });
test("Buildings EN: first Hero title edit on a legacy absent Hero renders without saving", () => {
  const before = normalizeBuildings({});
  const sparse = { ...before, hero: { headline: "Mi titulo" } };
  const hero = buildingsSchema.shape.hero.unwrap();
  const oldHero = hero.extend({ image_media_id: hero.shape.image_media_id.unwrap() });
  assert.equal(oldHero.safeParse(sparse.hero).success, false, "Previous contract required a hidden empty sibling");
  const after = setPageField(before, buildingsDescriptor.rootNode, ["hero", "headline"], "Mi titulo") as typeof before;
  assert.equal(after.hero?.headline, "Mi titulo");
  assert.equal(after.hero?.image_media_id, undefined, "Fallback media stays absent in legacy/target snapshots");
  assert.ok(validatePageLivePreview("buildings", preview(after), "http://localhost:3071"));
  assert.equal(before.hero, undefined, "Never mutate the persisted baseline");
  assert.equal(after.calculator, undefined, "Do not initialize unrelated absent sections");
  assert.deepEqual(after._list_ids, before._list_ids);
});

test("An already sparse local Hero recovers on the next edit without reloading or losing its text", () => {
  const before = { ...normalizeBuildings({}), hero: { headline: "Mi titulo", copy: "Local subtitle" } };
  const after = setPageField(before, buildingsDescriptor.rootNode, ["hero", "headline"], "Mi titulo actualizado");
  const parsed = buildingsSchema.parse(after);
  assert.equal(parsed.hero?.headline, "Mi titulo actualizado");
  assert.equal(parsed.hero?.copy, "Local subtitle");
  assert.equal(parsed.hero?.image_media_id, undefined);
  assert.deepEqual(before.hero, { headline: "Mi titulo", copy: "Local subtitle" });
});

test("Nested contact edits create only the required ancestor media fallback and preserve existing assets", () => {
  const before = normalizeBuildings({});
  const contact = setPageField(before, buildingsDescriptor.rootNode, ["hero", "contact", "label"], "Contact me") as typeof before;
  assert.equal(buildingsSchema.safeParse(contact).success, true);
  assert.equal(contact.hero?.contact?.label, "Contact me");
  const id = "46d4b557-b1f1-4ac2-96b3-a32004b68283";
  const withMedia = { ...contact, hero: { ...contact.hero!, image_media_id: id } };
  const changed = setPageField(withMedia, buildingsDescriptor.rootNode, ["hero", "headline"], "Mi titulo") as typeof before;
  assert.equal(changed.hero?.image_media_id, id);
  assert.equal(changed.hero?.contact?.label, "Contact me");
});

test("Unrelated optional flags and containers keep their absent semantics", () => {
  const before = { guide_aside: { image_media_id: "", title: "Stay", cta_label: "Book" } };
  const after = setPageField(before, describe(guidesSchema), ["city_filter", "label"], "City") as typeof before & { city_filter: { label: string; enabled?: boolean } };
  assert.deepEqual(after.city_filter, { label: "City" });
  assert.equal(after.city_filter.enabled, undefined, "Absent enabled still means true");
  assert.equal(guidesSchema.safeParse(after).success, true);
  assert.deepEqual(before, { guide_aside: { image_media_id: "", title: "Stay", cta_label: "Book" } });
});

test("Home target text/URL edits preserve an optional absent poster and shared-field equality", () => {
  const before: PageEnvelope = { schemaVersion: 1, content: homeAdapter.defaultContent(), ogImageMediaId: null };
  before.content.guests_pitch.benefits.forEach(item => item.icon_key = "check");
  before.content.services_carousel.assurances.forEach(item => item.icon_key = "check");
  before.content.hero.cta_primary.url = "https://example.test/en/book";
  before.content.guests_pitch.cta.url = "https://example.test/en/stay";
  delete before.content.hero.poster_media_id;
  assert.equal(homeSchema.safeParse(before.content).success, true);
  let content = setPageField(before.content, homeAdapter.descriptor.rootNode, ["hero", "cta_primary", "label"], "Reservar") as typeof before.content;
  content = setPageField(content, homeAdapter.descriptor.rootNode, ["hero", "cta_primary", "url"], "https://example.test/es/book") as typeof content;
  assert.equal(Object.hasOwn(content.hero, "poster_media_id"), false);
  assert.equal(homeSchema.safeParse(content).success, true);
  assert.equal(sharedEnvelope(before), sharedEnvelope({ ...before, content }));
  assert.equal(before.content.hero.cta_primary.url, "https://example.test/en/book");
});
