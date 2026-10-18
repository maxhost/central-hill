import { test } from "node:test";
import assert from "node:assert/strict";
import { ABOUT_LIST_PATHS, aboutAt, aboutIdentityErrors, aboutSourceFields, aboutTranslationField, normalizeAbout, retireAboutIds } from "../about-content";
import { defaultAbout, aboutSchema } from "../schemas/about";
const id = "5b9e5930-34db-436e-a2a1-b1655d8b6643";
test("legacy keys and destinations remain anchored to original identities through reorder", () => {
  const c = normalizeAbout(defaultAbout);
  assert.deepEqual(aboutIdentityErrors(c), {});
  [c.contact.cards[0], c.contact.cards[1]] = [c.contact.cards[1]!, c.contact.cards[0]!];
  [c._list_ids!["contact.cards"]![0], c._list_ids!["contact.cards"]![1]] = ["legacy_1", "legacy_0"];
  assert.equal(c.contact.cards[0]!.destination, "owners");
  assert.equal(aboutTranslationField(c, "contact.cards.0.title"), "block:contact.cards.1.title");
  assert.equal(aboutSourceFields(c)["block:contact.cards.1.title"], "Own a Property?");
});
test("all collections receive identities including string paragraphs and empty stats", () => {
  const c = normalizeAbout(defaultAbout);
  for (const path of ABOUT_LIST_PATHS) assert.equal(c._list_ids![path]!.length, (aboutAt(c, path) as unknown[]).length);
  assert.equal(aboutTranslationField(c, "story.narrative.2"), "block:story.narrative.2");
  assert.equal(aboutTranslationField(c, "hero.headline"), "block:hero.headline");
});
test("new items never inherit retired translations, even after delete and add", () => {
  const before = normalizeAbout(defaultAbout);
  const next = structuredClone(before);
  next.values.items.splice(1, 1);
  next._list_ids!["values.items"]!.splice(1, 1);
  next.values.items.push({ title: "New", description: "New content" });
  next._list_ids!["values.items"]!.push(id);
  const saved = retireAboutIds(next, before);
  assert.deepEqual(aboutIdentityErrors(saved, before), {});
  assert.equal(aboutSourceFields(saved)[`block:values.items.@${id}.title`], "New");
  assert.equal(aboutSourceFields(saved)["block:values.items.1.title"], undefined);
  const reused = structuredClone(saved);
  reused._list_ids!["values.items"]![3] = "legacy_1";
  assert.ok(aboutIdentityErrors(reused, saved)["values.items"]);
});
test("missing, duplicate and unknown metadata is rejected; authored legacy slots cannot be invented", () => {
  const before = normalizeAbout(defaultAbout);
  const missing = structuredClone(before); delete missing._list_ids;
  assert.ok(aboutIdentityErrors(missing, before)._source);
  const duplicate = structuredClone(before); duplicate._list_ids!.stats![1] = "legacy_0";
  assert.ok(aboutIdentityErrors(duplicate, before).stats);
  const invented = structuredClone(before); invented._list_ids!.stats![1] = "legacy_999";
  assert.ok(aboutIdentityErrors(invented, before).stats);
  assert.ok(aboutSchema.safeParse(defaultAbout).success);
});
