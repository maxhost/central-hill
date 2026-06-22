import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { mediaId, tStr } from "@core/validation/primitives";
import { between, faqGroupKey, fixed, iconCard } from "../schemas/_shared";
import { type FieldNode, applyDefaults, describe, emptyValue, humanizeKey } from "../admin/form-model";

/**
 * Slice `pages` backoffice (S12, ADR 0012) — the schema → form model. Pure (walks a
 * representative page schema, no DB / React). The schema is defined inline so this
 * machinery test stays independent of any single page's evolving content; it exercises
 * every FieldNode kind: media / string / multiline / fixed-count array / range array /
 * boolean. Run: `npx tsx --test src/slices/pages/tests/pages-admin.test.ts`.
 */

const tier = z.object({
  name: tStr({ max: 80 }),
  is_popular: z.boolean(),
  features: between(tStr({ max: 200 }), 1, 20),
});

const sampleSchema = z.object({
  hero: z.object({
    image_media_id: mediaId,
    headline: tStr({ max: 80 }),
    copy: tStr({ max: 600 }),
  }),
  why: z.object({ benefits: fixed(iconCard, 6) }),
  plans: z.object({ tiers: between(tier, 1, 6) }),
  faq_group_key: faqGroupKey,
});

const root = describe(sampleSchema);

function field(node: FieldNode, key: string): FieldNode {
  assert.equal(node.kind, "object");
  if (node.kind !== "object") throw new Error("not object");
  const found = node.fields.find((f) => f.key === key);
  assert.ok(found, `missing field ${key}`);
  return found.node;
}

test("describe maps a page schema to an object of sections", () => {
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
  const benefits = field(field(root, "why"), "benefits");
  assert.equal(benefits.kind, "array");
  if (benefits.kind === "array") {
    assert.equal(benefits.min, 6);
    assert.equal(benefits.max, 6);
  }
});

test("range arrays carry distinct min/max (plans tiers + tier features, client feedback B8)", () => {
  const tiers = field(field(root, "plans"), "tiers");
  assert.equal(tiers.kind, "array");
  if (tiers.kind !== "array") throw new Error("tiers not array");
  // Plans are freely addable/removable in the back office (1–6 columns).
  assert.equal(tiers.min, 1);
  assert.equal(tiers.max, 6);
  const features = field(tiers.element, "features");
  assert.equal(features.kind, "array");
  if (features.kind === "array") {
    assert.equal(features.min, 1);
    assert.equal(features.max, 20);
  }
});

test("faq_group_key maps to a select leaf sourced from faq_group", () => {
  const node = field(root, "faq_group_key");
  assert.equal(node.kind, "select");
  if (node.kind === "select") {
    assert.equal(node.source, "faq_group");
    assert.ok(node.hint && node.hint.length > 0); // .describe() flows through as the picker hint
  }
});

test("select leaf scaffolds + defaults to an empty string", () => {
  const empty = emptyValue(root) as { faq_group_key: unknown };
  assert.equal(empty.faq_group_key, "");
  const filled = applyDefaults(root, { faq_group_key: "owners" }) as { faq_group_key: unknown };
  assert.equal(filled.faq_group_key, "owners"); // stored selection preserved
  const blank = applyDefaults(root, {}) as { faq_group_key: unknown };
  assert.equal(blank.faq_group_key, ""); // missing → empty (no FAQ)
});

test("booleans are detected (tier.is_popular)", () => {
  const tiers = field(field(root, "plans"), "tiers");
  if (tiers.kind !== "array") throw new Error();
  assert.equal(field(tiers.element, "is_popular").kind, "boolean");
});

test("emptyValue scaffolds arrays to their min length", () => {
  const empty = emptyValue(root) as {
    hero: { image_media_id: string };
    why: { benefits: unknown[] };
    plans: { tiers: { features: unknown[]; is_popular: boolean }[] };
  };
  assert.equal(empty.why.benefits.length, 6); // fixed-count → exactly 6
  assert.equal(empty.plans.tiers.length, 1); // range (1–6) → scaffolds to min
  assert.equal(empty.plans.tiers[0]!.features.length, 1);
  assert.equal(empty.hero.image_media_id, "");
  assert.equal(empty.plans.tiers[0]!.is_popular, false);
});

test("applyDefaults preserves stored values and pads missing slots", () => {
  const partial = {
    hero: { headline: "Earn more" },
    why: { benefits: [] as unknown[] },
    plans: { tiers: [{ name: "Core" }, { name: "Prime" }] },
  };
  const filled = applyDefaults(root, partial) as {
    hero: { headline: string };
    why: { benefits: unknown[] };
    plans: { tiers: { name: string }[] };
  };
  assert.equal(filled.hero.headline, "Earn more");
  assert.equal(filled.why.benefits.length, 6); // fixed array padded to its length
  assert.equal(filled.plans.tiers.length, 2); // kept as stored (range min 1)
  assert.equal(filled.plans.tiers[0]!.name, "Core"); // kept
  assert.equal(filled.plans.tiers[1]!.name, "Prime"); // kept
});

test("humanizeKey makes editor labels", () => {
  assert.equal(humanizeKey("image_media_id"), "Image");
  assert.equal(humanizeKey("cta_label"), "Cta label");
  assert.equal(humanizeKey("headline"), "Headline");
});
