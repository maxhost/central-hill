import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { applyDefaults, describe, emptyValue, type FieldNode } from "../admin/form-model";
import { OTHER_CARD_ID, SERVICES_CARD_IDS, resolveEditorLayout } from "../admin/layout";
import { defaultServices, servicesSchema } from "../schemas/services";

function at(root: FieldNode, keys: string[]): FieldNode {
  let node = root;
  for (const key of keys) {
    assert.equal(node.kind, "object", key);
    if (node.kind !== "object") throw new Error(`Not an object at ${key}`);
    const field = node.fields.find((field) => field.key === key);
    assert.ok(field, key);
    node = field.node;
  }
  return node;
}

test("Services layout covers each schema root once, in public order, with OG in SEO", () => {
  const layout = resolveEditorLayout("services", Object.keys(servicesSchema.shape));
  assert.ok(layout);
  const cards = layout.filter((item) => item.kind === "card");
  assert.deepEqual(cards.map((card) => card.id), SERVICES_CARD_IDS);
  assert.deepEqual(cards.flatMap((card) => card.paths), Object.keys(servicesSchema.shape));
  assert.equal(cards[0]?.hostsOgImage, true);
  assert.equal(cards.filter((card) => card.hostsOgImage).length, 1);
  const catalogue = layout.findIndex((item) => item.id === "services_catalogue");
  assert.equal(layout[catalogue - 1]?.id, "intro");
  assert.equal(layout[catalogue + 1]?.id, "how_it_works");
  const info = layout[catalogue];
  assert.ok(info?.kind === "info");
  assert.equal(info.note.link?.href, "/admin/services");
  assert.equal(cards.at(-1)?.note?.link?.href, "/admin/settings");
});

test("Services layout keeps future fields editable and SEO available without authored sections", () => {
  const layout = resolveEditorLayout("services", ["future_section"]);
  const cards = layout?.filter((item) => item.kind === "card");
  assert.deepEqual(cards?.map((card) => card.id), ["seo", OTHER_CARD_ID]);
  assert.deepEqual(cards?.at(-1)?.paths, ["future_section"]);
});

test("Services empty and legacy content scaffold into valid editable payloads with three steps", () => {
  const root = describe(servicesSchema);
  for (const initial of [undefined, defaultServices, { hero: { headline: "Our services" } }]) {
    const scaffold = applyDefaults(root, initial);
    const parsed = servicesSchema.safeParse(scaffold);
    assert.ok(parsed.success, JSON.stringify(parsed.error?.issues));
    assert.equal(parsed.data.how_it_works?.items?.length, 3);
  }
  assert.ok(servicesSchema.safeParse(emptyValue(root)).success);
  const stored = {
    how_it_works: { items: [
      { title: "Choose", icon_key: "home-simple" },
      { title: "Ask" },
      { title: "Enjoy" },
    ] },
  };
  const parsed = servicesSchema.parse(applyDefaults(root, stored));
  assert.deepEqual(parsed.how_it_works?.items?.map((item) => item.title), ["Choose", "Ask", "Enjoy"]);
  assert.equal(parsed.how_it_works?.items?.[0]?.icon_key, "home-simple");
});

test("Services steps have exactly three fixed positions; ordinary arrays keep existing controls", () => {
  const items = at(describe(servicesSchema), ["how_it_works", "items"]);
  assert.ok(items.kind === "array");
  assert.equal(items.fixedOrder, true);
  assert.equal(items.min, 3);
  assert.equal(items.max, 3);
  for (const count of [0, 2, 4]) {
    assert.equal(servicesSchema.safeParse({ how_it_works: { items: Array.from({ length: count }, () => ({})) } }).success, false);
  }
  for (const schema of [z.array(z.string()).length(3), z.array(z.string()).min(1).max(8)]) {
    const node = describe(schema);
    assert.ok(node.kind === "array");
    assert.equal(node.fixedOrder, undefined);
  }
  const wrapped = describe(z.array(z.string()).meta({ fixed_order: true }).optional());
  assert.ok(wrapped.kind === "array");
  assert.equal(wrapped.fixedOrder, true);
  const overridden = describe(z.array(z.string()).meta({ fixed_order: true }).optional().meta({ fixed_order: false }));
  assert.ok(overridden.kind === "array");
  assert.equal(overridden.fixedOrder, undefined);
});

test("Services visual controls accept animated media and image posters, without editable destinations", () => {
  const root = describe(servicesSchema);
  for (const section of ["hero", "final_cta"]) {
    const media = at(root, [section, "media_media_id"]);
    const poster = at(root, [section, "poster_media_id"]);
    assert.ok(media.kind === "media");
    assert.equal(media.accept, "animated");
    assert.ok(poster.kind === "media");
    assert.equal(poster.accept, "image");
    const alt = at(root, [section, "media_alt"]);
    assert.ok(alt.kind === "string" && alt.optional);
  }
  const walk = (node: FieldNode): void => {
    if (node.kind === "object") for (const field of node.fields) {
      assert.doesNotMatch(field.key, /(?:^|_)(?:url|href)$/);
      walk(field.node);
    }
    if (node.kind === "array") walk(node.element);
  };
  walk(root);
  assert.equal(servicesSchema.safeParse({ hero: { media_media_id: "not-a-uuid" } }).success, false);
  assert.equal(servicesSchema.safeParse({ hero: { headline: "x".repeat(201) } }).success, false);
  assert.equal(servicesSchema.safeParse({ final_cta: { contact_note: "x".repeat(241) } }).success, false);
});
