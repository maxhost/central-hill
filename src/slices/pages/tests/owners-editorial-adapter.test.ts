import test from "node:test";
import assert from "node:assert/strict";
import { translatablePaths } from "@core/validation/primitives";
import { ownersSchema } from "../schemas/owners";
import { ownersAdapter, ownersDraftSchema } from "../adapters/owners";
import {
  normalizeOwners,
  ownersDescriptor,
  ownersFallbackIndex,
  ownersIdentityErrors,
  ownersTranslationField,
  retireOwnersIds,
} from "../owners-content";
import { editorialAt, editorialListScope } from "../editorial-identities";
import { prepareTargetEnvelope } from "../editorial-content";
import type { PageEnvelope } from "../editorial-types";

test("Owners adapter covers existing copy, hidden values, list cardinalities and all ten media slots", () => {
  const content = ownersAdapter.defaultContent();
  assert.equal(ownersDraftSchema.safeParse(content).success, true);
  assert.equal(
    ownersSchema.safeParse(content).success,
    false,
    "Publication retains complete URL validation",
  );
  content.why.cta_primary.url = "https://example.test/primary";
  content.why.cta_secondary.url = "https://example.test/secondary";
  content.services.cta.url = "https://example.test/services";
  content.dashboard.cta.url = "https://example.test/dashboard";
  if (content.plans.helpers[0]!.cta)
    content.plans.helpers[0]!.cta.url = "https://example.test/helper";
  content.plans.tiers[0]!.commission = "12%";
  assert.deepEqual(
    ownersSchema.parse(content),
    content,
    "Hidden URLs, commission and metadata survive validation",
  );
  assert.deepEqual(
    ownersDescriptor.textPatterns,
    translatablePaths(ownersSchema),
  );
  const hidden: string[] = [];
  function walk(node: typeof ownersDescriptor.rootNode, path = "") {
    if (node.kind === "hidden") {
      hidden.push(path);
      walk(node.node, path);
    }
    if (node.kind === "object")
      for (const { key, node: child } of node.fields)
        walk(child, path ? `${path}.${key}` : key);
    if (node.kind === "array") walk(node.element, `${path}[]`);
  }
  walk(ownersDescriptor.rootNode);
  assert.ok(hidden.includes("why.cta_primary.url"));
  assert.ok(hidden.includes("plans.tiers[].commission"));
  assert.ok(hidden.includes("_list_ids"));
  assert.equal(
    ownersDescriptor.textPatterns.some(
      (path) =>
        path.includes("_list_ids") ||
        path.includes("image_media_id") ||
        path.includes("icon_key"),
    ),
    false,
  );
  assert.deepEqual(
    [
      content.why.benefits.length,
      content.services.benefits.length,
      content.journey.steps.length,
      content.dashboard.benefits.length,
      content.plans.helpers.length,
    ],
    [6, 4, 5, 4, 1],
  );
  const id = (index: number) =>
    `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
  const og = id(1);
  content.hero.image_media_id = id(2);
  content.services.image_media_id = id(3);
  content.dashboard.image_media_id = id(4);
  content.journey.steps.forEach(
    (step, index) => (step.image_media_id = id(index + 5)),
  );
  content.final_cta ??= { image_media_id: "" };
  content.final_cta.image_media_id = id(10);
  const refs = ownersAdapter.collectMediaReferences(content, og);
  assert.equal(refs.length, 10);
  assert.equal(new Set(refs.map((ref) => ref.id)).size, 10);
  assert.equal(ownersDescriptor.maxLocalMedia, 10);
  assert.equal(
    refs.every(
      (ref) =>
        ref.path === "og_image_media_id" ||
        ownersDescriptor.mediaSlots.some(
          (slot) => slot.path === ref.path.replace(/\.\d+(?=\.|$)/g, "[]"),
        ),
    ),
    true,
  );
  const assets = new Map(
    refs.map((ref) => [
      ref.id,
      { mime: ref.kind === "mixed" ? "application/json" : "image/png" },
    ]),
  );
  assert.deepEqual(ownersAdapter.mediaErrors(content, og, assets), {});
  assets.set(content.hero.image_media_id, { mime: "video/mp4" });
  assets.set(og, { mime: "application/pdf" });
  assets.delete(content.journey.steps[0]!.image_media_id);
  const errors = ownersAdapter.mediaErrors(content, og, assets);
  assert.deepEqual(Object.keys(errors).sort(), [
    "hero.image_media_id",
    "journey.steps.0.image_media_id",
    "og_image_media_id",
  ]);
});

test("Owners plans/string features and Journey fallbacks follow identity through reorder and retirement", () => {
  const raw = ownersAdapter.defaultContent();
  raw.plans.tiers.push(structuredClone(raw.plans.tiers[0]!));
  raw.plans.tiers.forEach((tier) => (tier.features = ["One", "Two"]));
  delete raw._list_ids;
  const content = normalizeOwners(raw);
  const target: PageEnvelope<"owners"> = {
    schemaVersion: 1,
    content,
    ogImageMediaId: null,
  };
  target.content.plans.tiers[0]!.name = "Plan primero";
  target.content.plans.tiers[0]!.features = ["Primera", "Segunda"];
  target.content.journey.steps[0]!.title = "Primer paso";
  const template = structuredClone(target);
  template.content.plans.tiers.reverse();
  template.content._list_ids!["plans.tiers"]!.reverse();
  template.content.plans.tiers[1]!.features.reverse();
  template.content._list_ids!["plans.tiers.@legacy_0.features"]!.reverse();
  template.content.journey.steps.reverse();
  template.content._list_ids!["journey.steps"]!.reverse();
  template.content.plans.tiers[1]!.name = "English";
  template.content.plans.tiers[1]!.features = ["Second", "First"];
  template.content.journey.steps[4]!.title = "English";
  assert.deepEqual(ownersIdentityErrors(template.content, target.content), {});
  assert.equal(
    editorialListScope(
      template.content,
      "plans.tiers.1.features",
      ownersDescriptor,
    ),
    "plans.tiers.@legacy_0.features",
  );
  const prepared = prepareTargetEnvelope(template, target, ownersDescriptor);
  assert.equal(prepared.content.plans.tiers[1]!.name, "Plan primero");
  assert.deepEqual(prepared.content.plans.tiers[1]!.features, [
    "Segunda",
    "Primera",
  ]);
  assert.equal(prepared.content.journey.steps[4]!.title, "Primer paso");
  assert.equal(ownersFallbackIndex(prepared.content, 4), 0);
  assert.equal(ownersFallbackIndex(prepared.content, 0), 4);
  assert.equal(
    ownersFallbackIndex({ ...content, _list_ids: undefined }, 3),
    3,
    "Legacy public content keeps positional fallbacks",
  );
  assert.equal(
    ownersTranslationField(prepared.content, "plans.tiers.1.features.0"),
    "block:plans.tiers.0.features.1",
  );
  const next = structuredClone(content);
  next.plans.tiers[0]!.features.shift();
  next._list_ids!["plans.tiers.@legacy_0.features"]!.shift();
  const retired = retireOwnersIds(next, content);
  assert.ok(
    retired._retired_ids!.includes("plans.tiers.@legacy_0.features:legacy_0"),
  );
  const reused = structuredClone(retired);
  reused.plans.tiers[0]!.features.push("Reused");
  reused._list_ids!["plans.tiers.@legacy_0.features"]!.push("legacy_0");
  assert.ok(ownersIdentityErrors(reused, retired)["plans.tiers.0.features"]);
  const uuid = "00000000-0000-4000-8000-000000000099";
  next._list_ids!["journey.steps"]![0] = uuid;
  assert.equal(ownersFallbackIndex(next, 0), 0);
  assert.equal(
    ownersTranslationField(next, "journey.steps.0.title"),
    `block:journey.steps.@${uuid}.title`,
  );
  assert.equal(typeof editorialAt(next, "plans.tiers.0.features.0"), "string");
});
