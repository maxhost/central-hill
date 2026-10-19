import test from "node:test";
import assert from "node:assert/strict";
import {
  captureLegacyPending,
  prepareTargetEnvelope,
  sameEditorialSnapshot,
} from "../editorial-content";
import {
  normalizeEditorial,
  editorialTranslationField,
} from "../editorial-identities";
import type { PageEditorialDescriptor } from "../editorial-adapter-types";
import type { PageEnvelope } from "../editorial-types";
import { ownersSchema } from "../schemas/owners";
import { applyDefaults, describe } from "../admin/form-model";
import { translatablePaths } from "@core/validation/primitives";

test("Representative Owners bootstrap captures pending copy privately and retains nested legacy identity after reorder", () => {
  const descriptor: PageEditorialDescriptor = {
    key: "owners",
    title: "Owners",
    publicPath: "/owners",
    rootNode: describe(ownersSchema),
    textPatterns: translatablePaths(ownersSchema),
    listPaths: ["plans.tiers", "plans.tiers[].features"],
    mediaSlots: [],
    maxLocalMedia: 10,
    externalSections: [],
  };
  const raw = applyDefaults(descriptor.rootNode, {}) as PageEnvelope<"owners">["content"];
  raw.plans.tiers.push({ ...structuredClone(raw.plans.tiers[0]!), features: ["Second EN feature"] });
  const content = normalizeEditorial(raw, descriptor);
  const published: PageEnvelope<"owners"> = {
    schemaVersion: 1,
    content,
    ogImageMediaId: null,
  };
  const reorderedKeys: PageEnvelope<"owners"> = {
    ogImageMediaId: published.ogImageMediaId,
    content: Object.fromEntries(Object.entries(published.content).reverse()) as typeof published.content,
    schemaVersion: 1,
  };
  assert.equal(sameEditorialSnapshot(published, reorderedKeys), true, "Key order cannot create unsaved work");
  const pending = captureLegacyPending(
    published,
    [
      { field: "block:plans.tiers.0.features.0", value: "Servicio pendiente" },
      { field: "block:seo.meta_title", value: "SEO pendiente" },
    ],
    descriptor,
  )!;
  assert.equal(published.content.plans.tiers[0]!.features[0], "");
  assert.equal(
    pending.content.plans.tiers[0]!.features[0],
    "Servicio pendiente",
  );
  assert.equal(pending.content.seo?.meta_title, "SEO pendiente");
  const template = structuredClone(published);
  template.content.plans.tiers.reverse();
  (template.content as typeof content)._list_ids!["plans.tiers"]!.reverse();
  assert.equal(sameEditorialSnapshot(template, published), false, "List order remains an editorial change");
  const prepared = prepareTargetEnvelope(template, pending, descriptor);
  assert.equal(
    prepared.content.plans.tiers.at(-1)!.features[0],
    "Servicio pendiente",
  );
  assert.equal(
    editorialTranslationField(
      prepared.content,
      `plans.tiers.${prepared.content.plans.tiers.length - 1}.features.0`,
      descriptor,
    ),
    "block:plans.tiers.0.features.0",
  );
});
