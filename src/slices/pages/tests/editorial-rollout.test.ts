import test from "node:test";
import assert from "node:assert/strict";
import { pageSections } from "../admin/home-contextual";
import { sameEditorialSnapshot } from "../editorial-content";
import { guidesAdapter } from "../adapters/guides";
import { validEditorialSurface } from "../server/editorial-policy";

test("Shared preview surfaces are allowlisted and collapse hides only bindings without changing the snapshot", () => {
  const descriptor = guidesAdapter.descriptor;
  const content = guidesAdapter.defaultContent();
  const envelope = { schemaVersion: 1 as const, content, ogImageMediaId: null };
  const before = structuredClone(envelope);
  assert.equal(descriptor.sectionPreviews?.guide_aside, "shared_aside");
  assert.equal(validEditorialSurface("guides", "shared_aside"), true);
  assert.equal(validEditorialSurface("blog", "shared_aside"), true);
  assert.equal(validEditorialSurface("about", "shared_aside"), false);
  assert.equal(validEditorialSurface("blog", "unexpected"), false);
  content.city_filter = { ...content.city_filter, enabled: false, note: "Retained filter copy" };
  const collapsed = pageSections(descriptor, key => key, content).find(section => section.id === "city_filter")!;
  assert.deepEqual(collapsed.bindings.map(binding => binding.id), ["city_filter.enabled"]);
  content.city_filter.enabled = true;
  assert.ok(pageSections(descriptor, key => key, content).find(section => section.id === "city_filter")!.bindings.some(binding => binding.id === "city_filter.note"));
  assert.equal(content.city_filter.note, "Retained filter copy");
  assert.ok(sameEditorialSnapshot(before, { ogImageMediaId: null, content: before.content, schemaVersion: 1 }));
  assert.equal(sameEditorialSnapshot(before, envelope), false);
});
