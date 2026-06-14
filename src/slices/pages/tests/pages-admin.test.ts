import assert from "node:assert/strict";
import { test } from "node:test";
import { ownersSchema } from "../schemas/owners";
import { type FieldNode, applyDefaults, describe, emptyValue, humanizeKey } from "../admin/form-model";

/**
 * Slice `pages` backoffice (S12, ADR 0012) — the schema → form model. Pure (walks a
 * real page schema, no DB / React). Run:
 * `npx tsx --test src/slices/pages/tests/pages-admin.test.ts`.
 */

const root = describe(ownersSchema);

function field(node: FieldNode, key: string): FieldNode {
  assert.equal(node.kind, "object");
  if (node.kind !== "object") throw new Error("not object");
  const found = node.fields.find((f) => f.key === key);
  assert.ok(found, `missing field ${key}`);
  return found.node;
}

test("describe maps the owners schema to an object of sections", () => {
  assert.equal(root.kind, "object");
  if (root.kind !== "object") return;
  const keys = root.fields.map((f) => f.key);
  assert.ok(keys.includes("hero"));
  assert.ok(keys.includes("plans"));
});

test("media + string leaves are detected", () => {
  const hero = field(root, "hero");
  assert.equal(field(hero, "image_media_id").kind, "media");
  assert.equal(field(hero, "headline").kind, "string");
  const copy = field(hero, "copy");
  assert.equal(copy.kind, "string");
  if (copy.kind === "string") assert.equal(copy.multiline, true); // max 600 → textarea
});

test("fixed-count arrays carry min === max", () => {
  const plans = field(root, "plans");
  const tiers = field(plans, "tiers");
  assert.equal(tiers.kind, "array");
  if (tiers.kind === "array") {
    assert.equal(tiers.min, 3);
    assert.equal(tiers.max, 3);
  }
});

test("range arrays carry distinct min/max (tier features 6–8)", () => {
  const tiers = field(field(root, "plans"), "tiers");
  if (tiers.kind !== "array") throw new Error("tiers not array");
  const features = field(tiers.element, "features");
  assert.equal(features.kind, "array");
  if (features.kind === "array") {
    assert.equal(features.min, 6);
    assert.equal(features.max, 8);
  }
});

test("booleans are detected (tier.is_popular)", () => {
  const tiers = field(field(root, "plans"), "tiers");
  if (tiers.kind !== "array") throw new Error();
  assert.equal(field(tiers.element, "is_popular").kind, "boolean");
});

test("emptyValue scaffolds fixed arrays to their length", () => {
  const empty = emptyValue(root) as {
    hero: { image_media_id: string };
    plans: { tiers: { features: unknown[]; is_popular: boolean }[] };
  };
  assert.equal(empty.plans.tiers.length, 3);
  assert.equal(empty.plans.tiers[0]!.features.length, 6);
  assert.equal(empty.hero.image_media_id, "");
  assert.equal(empty.plans.tiers[0]!.is_popular, false);
});

test("applyDefaults preserves stored values and pads missing slots", () => {
  const partial = { hero: { headline: "Earn more" }, plans: { tiers: [{ name: "Solo" }] } };
  const filled = applyDefaults(root, partial) as {
    hero: { headline: string };
    plans: { tiers: { name: string }[] };
  };
  assert.equal(filled.hero.headline, "Earn more");
  assert.equal(filled.plans.tiers.length, 3); // padded to fixed length
  assert.equal(filled.plans.tiers[0]!.name, "Solo"); // kept
  assert.equal(filled.plans.tiers[1]!.name, ""); // padded empty
});

test("humanizeKey makes editor labels", () => {
  assert.equal(humanizeKey("image_media_id"), "Image");
  assert.equal(humanizeKey("cta_label"), "Cta label");
  assert.equal(humanizeKey("headline"), "Headline");
});
