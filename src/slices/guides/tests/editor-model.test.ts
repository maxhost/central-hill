import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newGuide,
  newSection,
  newPlace,
  pagePatch,
  sectionPatch,
  placePatch,
  patchIsDirty,
  moveItem,
} from "../admin/ui/editor-model";
const pageId = "10000000-0000-4000-8000-000000000001",
  sectionId = "10000000-0000-4000-8000-000000000002",
  placeId = "10000000-0000-4000-8000-000000000003";
test("saving page source omits unchanged source, children and localized slugs", () => {
  const base = {
    ...newGuide(pageId),
    title: "Original",
    slugs: {
      en: "original",
      pt: "original-pt",
      es: "original-es",
      fr: "original-fr",
    },
    sections: [newSection(sectionId, pageId, 0)],
  };
  const patch = pagePatch({ ...base, title: "Changed", sections: [] }, base);
  assert.deepEqual(patch.source, { title: "Changed" });
  assert.deepEqual(patch.changes, {});
  assert.equal(patch.slugs, undefined);
  assert.equal("sections" in patch, false);
  assert.deepEqual(
    pagePatch({ ...base, slugs: { ...base.slugs, en: "new" } }, base).slugs,
    { en: "new" },
  );
});
test("clearing optional source is explicit null and module disable retains data", () => {
  const base = {
    ...newSection(sectionId, pageId, 0),
    body: "Keep",
    local_tip: "Tip",
    presentation: null,
  };
  const patch = sectionPatch(
    {
      ...base,
      local_tip: null,
      presentation: { version: 1, modules: { body: false } },
    },
    base,
  );
  assert.deepEqual(patch.source, { local_tip: null });
  assert.equal("body" in patch.source, false);
  assert.deepEqual(patch.changes, {
    presentation: { version: 1, modules: { body: false } },
  });
});
test("retry keeps IDs, new sections hidden and place patches never recreate persisted children", () => {
  const section = newSection(sectionId, pageId, 0),
    place = newPlace(placeId, sectionId, 0);
  assert.deepEqual(section.presentation, { version: 1, enabled: false });
  assert.equal(sectionPatch(section).id, sectionPatch(section).id);
  assert.equal(placePatch(place).id, placeId);
  assert.equal(placePatch(place).create, true);
  assert.equal(patchIsDirty(placePatch(place, place)), false);
  assert.deepEqual(
    placePatch({ ...place, address: "New address" }, place).changes,
    { address: "New address" },
  );
  assert.deepEqual(
    placePatch({ ...place, address: "New address" }, place).source,
    {},
  );
});
test("order keeps exact membership and assigns contiguous positions without changing input", () => {
  const items = [
    { id: "a", position: 9 },
    { id: "b", position: 30 },
  ];
  assert.deepEqual(moveItem(items, "b", -1), [
    { id: "b", position: 0 },
    { id: "a", position: 1 },
  ]);
  assert.deepEqual(items, [
    { id: "a", position: 9 },
    { id: "b", position: 30 },
  ]);
  assert.equal(moveItem(items, "a", -1), items);
  assert.equal(moveItem(items, "absent", 1), items);
});
