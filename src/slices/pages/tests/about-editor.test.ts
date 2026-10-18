import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultAbout, aboutSchema, type AboutContent } from "../schemas/about";
import { ABOUT_LIST_PATHS, aboutAt, aboutIdentityErrors, aboutTranslationField, normalizeAbout } from "../about-content";
import { type FieldNode, applyDefaults, describe, updateAboutList } from "../admin/form-model";

const NEW_ID = "ef777a96-7357-4e1b-9e61-f53dba53c110";
const source = () => normalizeAbout(defaultAbout) as unknown as Record<string, unknown>;

test("every About list moves content and identity together without mutating the source", () => {
  for (const path of ABOUT_LIST_PATHS) {
    const before = source();
    const original = structuredClone(before);
    const items = aboutAt(before, path) as unknown[];
    const after = updateAboutList(before, path, { action: "move", index: 0, to: 1 });
    assert.deepEqual(before, original);
    assert.deepEqual((aboutAt(after, path) as unknown[])[1], items[0]);
    assert.equal((after._list_ids as Record<string, string[]>)[path]![1], "legacy_0");
    assert.equal(aboutTranslationField(after as unknown as AboutContent, `${path}.1.title`), `block:${path}.0.title`);
    assert.deepEqual(aboutIdentityErrors(after as unknown as AboutContent), {});
  }
});

test("paragraph operations preserve strings and allocate new translation identity", () => {
  const before = source();
  const added = updateAboutList(before, "story.narrative", { action: "add", value: "New paragraph", id: NEW_ID });
  const rows = aboutAt(added, "story.narrative") as unknown[];
  assert.equal(rows.at(-1), "New paragraph");
  assert.ok(rows.every((row) => typeof row === "string"));
  assert.equal(aboutTranslationField(added as unknown as AboutContent, "story.narrative.3"), `block:story.narrative.@${NEW_ID}`);
  const removed = updateAboutList(added, "story.narrative", { action: "remove", index: 0 });
  assert.equal((removed._list_ids as Record<string, string[]>)["story.narrative"]![0], "legacy_1");
  assert.deepEqual(aboutIdentityErrors(removed as unknown as AboutContent), {});
});

test("moving contact cards preserves each card destination and unrelated unsaved fields", () => {
  const before = source();
  before.hero = { ...(before.hero as object), headline: "Unsaved new title" };
  const after = updateAboutList(before, "contact.cards", { action: "move", index: 0, to: 2 });
  assert.equal((aboutAt(after, "contact.cards") as AboutContent["contact"]["cards"])[2]!.destination, "buildings");
  assert.equal((aboutAt(after, "contact.cards") as AboutContent["contact"]["cards"])[0]!.destination, "real_estate");
  assert.equal(after.hero, before.hero);
  assert.equal(aboutAt(after, "hero.headline"), "Unsaved new title");
});

test("invalid operations and missing identities leave content intact", () => {
  const before = source();
  assert.equal(updateAboutList(before, "hero", { action: "remove", index: 0 }), before);
  assert.equal(updateAboutList(before, "stats", { action: "move", index: 0, to: 50 }), before);
  assert.equal(updateAboutList(before, "stats", { action: "remove", index: -1 }), before);
  const broken = { ...before, _list_ids: {} };
  assert.equal(updateAboutList(broken, "stats", { action: "add", id: NEW_ID, value: {} }), broken);
});

test("legacy scaffolding preserves absent identity records and optional destinations", () => {
  const data = applyDefaults(describe(aboutSchema), defaultAbout) as AboutContent;
  assert.equal(data._list_ids, undefined);
  assert.equal(data.contact.cards[0]!.destination, undefined);
  assert.ok(aboutSchema.safeParse(data).success);
  const normalized = normalizeAbout(defaultAbout);
  const edited = applyDefaults(describe(aboutSchema), normalized) as AboutContent;
  assert.deepEqual(edited._list_ids, normalized._list_ids);
});

test("About identity metadata stays hidden and media accepts the expanded formats", () => {
  const node = describe(aboutSchema);
  assert.equal(node.kind, "object");
  if (node.kind !== "object") return;
  assert.equal(node.fields.find((field) => field.key === "_list_ids")!.node.kind, "hidden");
  for (const section of ["story", "organisation", "community"]) {
    const child: FieldNode = node.fields.find((field) => field.key === section)!.node;
    assert.equal(child.kind, "object");
    if (child.kind !== "object") continue;
    const media: FieldNode = child.fields.find((field) => field.key === "image_media_id")!.node;
    assert.equal(media.kind, "media");
    if (media.kind === "media") assert.equal(media.accept, "animated");
  }
});
