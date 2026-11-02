import test from "node:test";
import assert from "node:assert/strict";
import { translatablePaths } from "@core/validation/primitives";
import {
  realEstateSchema,
  defaultCapabilities,
  defaultDealStructures,
  defaultProcess,
  defaultTrackRecord,
} from "../schemas/real-estate";
import {
  realEstateAdapter,
  realEstateDraftSchema,
} from "../adapters/real-estate";
import {
  normalizeRealEstate,
  realEstateDescriptor,
  realEstateIdentityErrors,
  realEstateTranslationField,
  retireRealEstateIds,
  realEstateAssetFallbackIndex,
  realEstateProcessFallbackIndex,
} from "../real-estate-content";
import { editorialListScope } from "../editorial-identities";
import { prepareTargetEnvelope } from "../editorial-content";
import { capabilityStatementHref } from "../ui/capability-statement";
import {
  descriptorMediaIds,
  isEditableFieldPath,
} from "../admin/home-contextual";
import type { PageEnvelope } from "../editorial-types";

const id = (index: number) =>
  `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;

test("Real Estate descriptor covers all arrays, copy, hidden fields, defaults and maximum typed media references", () => {
  const content = realEstateAdapter.defaultContent();
  assert.equal(realEstateDraftSchema.safeParse(content).success, true);
  assert.equal(
    realEstateSchema.safeParse(content).success,
    false,
    "Publication still requires valid URLs",
  );
  assert.deepEqual(content.capabilities, defaultCapabilities);
  assert.deepEqual(content.deal_structures, defaultDealStructures);
  assert.deepEqual(content.process, defaultProcess);
  assert.deepEqual(content.track_record, defaultTrackRecord);
  for (const cta of [
    content.hero.cta_primary,
    content.hero.cta_secondary,
    content.partners.cta_primary,
    content.partners.cta_secondary,
    content.capabilities.cta,
    content.asset_management.cta,
  ])
    cta.url = "https://example.test/unchanged";
  assert.deepEqual(
    realEstateSchema.parse(content),
    content,
    "Hidden URLs and private identity metadata round-trip",
  );
  assert.equal(
    isEditableFieldPath(
      realEstateDescriptor.rootNode,
      "partners.cta_secondary.note",
    ),
    false,
  );
  assert.equal(
    isEditableFieldPath(
      realEstateDescriptor.rootNode,
      "deal_structures.models.0.points.0",
    ),
    true,
  );
  assert.deepEqual(
    realEstateDescriptor.textPatterns,
    translatablePaths(realEstateSchema),
  );
  assert.equal(
    realEstateDescriptor.textPatterns.some((path) =>
      /_list_ids|_retired_ids|media_id|icon_key/.test(path),
    ),
    false,
  );
  const arrays: string[] = [];
  const hidden: string[] = [];
  function walk(node: typeof realEstateDescriptor.rootNode, path = "") {
    if (node.kind === "hidden") {
      hidden.push(path);
      return;
    }
    if (node.kind === "object")
      for (const field of node.fields)
        walk(field.node, path ? `${path}.${field.key}` : field.key);
    if (node.kind === "array") {
      arrays.push(path);
      walk(node.element, `${path}[]`);
    }
  }
  walk(realEstateDescriptor.rootNode);
  assert.deepEqual(arrays.sort(), [...realEstateDescriptor.listPaths].sort());
  assert.ok(
    hidden.includes("_list_ids") &&
      hidden.includes("_retired_ids") &&
      hidden.includes("hero.cta_secondary.url"),
  );
  assert.deepEqual(
    [
      content.partners.benefits.length,
      content.capabilities.benefits.length,
      content.asset_management.benefits.length,
      content.deal_structures.models.length,
      content.market.stats.length,
      content.market.fundamentals.body.length,
    ],
    [4, 3, 6, 3, 3, 2],
  );
  content.hero.image_media_id = id(1);
  content.hero.capability_statement_media_id = id(2);
  content.capabilities.image_media_id = id(3);
  content.asset_management.image_media_id = id(4);
  content.asset_management.benefits.forEach((item, index) => {
    item.image_media_id = id(6 + index);
  });
  content.market.fundamentals.image_left_media_id = id(12);
  content.market.fundamentals.image_right_media_id = id(13);
  while (content.process.steps.length < 8)
    content.process.steps.push(structuredClone(content.process.steps[0]!));
  content.process.steps.forEach((step, index) => {
    step.image_media_id = id(30 + index);
  });
  const refs = realEstateAdapter.collectMediaReferences(content, id(5));
  assert.equal(refs.length, realEstateDescriptor.maxLocalMedia);
  const assets = new Map(
    refs.map((ref) => [
      ref.id,
      {
        mime:
          ref.kind === "pdf"
            ? "application/pdf"
            : ref.kind === "mixed"
              ? "video/mp4"
              : "image/webp",
      },
    ]),
  );
  assert.deepEqual(realEstateAdapter.mediaErrors(content, id(5), assets), {});
  assets.set(id(1), { mime: "application/pdf" });
  assets.set(id(3), { mime: "application/pdf" });
  assert.deepEqual(
    Object.keys(realEstateAdapter.mediaErrors(content, id(5), assets)).sort(),
    ["capabilities.image_media_id", "hero.image_media_id"],
  );
});

test("Process gallery exposes optional step images and translated alts with image-only preview references", () => {
  const content = realEstateAdapter.defaultContent();
  assert.equal(realEstateDraftSchema.safeParse(content).success, true);
  assert.equal(realEstateAdapter.collectMediaReferences(content, null).length, 0);
  for (const field of ["headline", "subheadline", "cta.label"])
    assert.equal(isEditableFieldPath(realEstateDescriptor.rootNode, `process.${field}`), true);
  for (let index = 0; index < content.process.steps.length; index++) {
    for (const field of ["image_media_id", "image_alt", "title", "description"])
      assert.equal(isEditableFieldPath(realEstateDescriptor.rootNode, `process.steps.${index}.${field}`), true);
    content.process.steps[index]!.image_media_id = id(40 + index);
  }
  const refs = realEstateAdapter.collectMediaReferences(content, null);
  assert.equal(refs.length, 5);
  assert.ok(refs.every((ref) => ref.kind === "image"));
  assert.deepEqual(new Set(descriptorMediaIds(content, null, realEstateDescriptor)), new Set(refs.map((ref) => ref.id)));
  assert.ok(realEstateDescriptor.textPatterns.includes("process.steps[].image_alt"));
  const assets = new Map(refs.map((ref) => [ref.id, { mime: "image/jpeg" }]));
  assert.deepEqual(realEstateAdapter.mediaErrors(content, null, assets), {});
  assets.set(id(40), { mime: "video/mp4" });
  assets.delete(id(41));
  assert.deepEqual(Object.keys(realEstateAdapter.mediaErrors(content, null, assets)).sort(), [
    "process.steps.0.image_media_id", "process.steps.1.image_media_id",
  ]);
  content.process.steps[0]!.image_media_id = "";
  assert.equal(realEstateAdapter.collectMediaReferences(content, null).length, 4);
});

test("Process photos and translated text follow stable steps across reorder and locale draft preparation", () => {
  const content = normalizeRealEstate(realEstateAdapter.defaultContent());
  content.process.steps[0]!.image_media_id = id(50);
  content.process.steps[0]!.image_alt = "Asset assessment";
  const target: PageEnvelope<"real_estate"> = {
    schemaVersion: 1, content: structuredClone(content), ogImageMediaId: null,
  };
  target.content.process.steps[0]!.title = "Evaluación del activo";
  target.content.process.steps[0]!.description = "Descripción traducida";
  target.content.process.steps[0]!.image_alt = "Evaluación en Lisboa";
  const template = structuredClone(target);
  template.content.process.steps.reverse();
  template.content._list_ids!["process.steps"]!.reverse();
  assert.deepEqual(realEstateIdentityErrors(template.content, content), {});
  assert.equal(realEstateProcessFallbackIndex(template.content, 4), 0);
  assert.equal(realEstateProcessFallbackIndex(template.content, 0), 4);
  const prepared = prepareTargetEnvelope(template, target, realEstateDescriptor);
  assert.deepEqual(prepared.content.process.steps[4], target.content.process.steps[0]);
  assert.equal(realEstateTranslationField(prepared.content, "process.steps.4.image_alt"), "block:process.steps.0.image_alt");
});

test("Market Fundamentals exposes two optional image pickers with collected, image-only media and translatable alts", () => {
  const content = realEstateAdapter.defaultContent();
  for (const side of ["left", "right"] as const) {
    delete content.market.fundamentals[`image_${side}_media_id`];
    delete content.market.fundamentals[`image_${side}_alt`];
  }
  assert.equal(
    realEstateDraftSchema.safeParse(content).success,
    true,
    "old snapshots remain valid",
  );
  for (const [index, side] of (["left", "right"] as const).entries()) {
    const path = `market.fundamentals.image_${side}_media_id`;
    assert.equal(
      isEditableFieldPath(realEstateDescriptor.rootNode, path),
      true,
    );
    assert.equal(
      isEditableFieldPath(
        realEstateDescriptor.rootNode,
        `market.fundamentals.image_${side}_alt`,
      ),
      true,
    );
    content.market.fundamentals[`image_${side}_media_id`] = id(30 + index);
    assert.ok(
      realEstateDescriptor.textPatterns.includes(
        `market.fundamentals.image_${side}_alt`,
      ),
    );
  }
  const refs = realEstateAdapter.collectMediaReferences(content, null);
  assert.equal(refs.length, 2);
  assert.ok(refs.every((ref) => ref.kind === "image"));
  assert.deepEqual(
    new Set(descriptorMediaIds(content, null, realEstateDescriptor)),
    new Set([id(30), id(31)]),
  );
  const assets = new Map([
    [id(30), { mime: "image/jpeg" }],
    [id(31), { mime: "image/webp" }],
  ]);
  assert.deepEqual(realEstateAdapter.mediaErrors(content, null, assets), {});
  assets.set(id(30), { mime: "video/mp4" });
  assets.delete(id(31));
  assert.deepEqual(
    Object.keys(realEstateAdapter.mediaErrors(content, null, assets)).sort(),
    [
      "market.fundamentals.image_left_media_id",
      "market.fundamentals.image_right_media_id",
    ],
  );
});

test("Asset cards preserve legacy content and expose per-card media, icons and translated copy in the editor", () => {
  const legacy = realEstateAdapter.defaultContent();
  for (const item of legacy.asset_management.benefits) {
    delete item.image_media_id;
    delete item.image_alt;
  }
  assert.equal(realEstateDraftSchema.safeParse(legacy).success, true);
  assert.equal(
    isEditableFieldPath(
      realEstateDescriptor.rootNode,
      "asset_management.image_media_id",
    ),
    false,
  );
  for (let index = 0; index < 6; index++) {
    for (const field of [
      "image_media_id",
      "image_alt",
      "icon_key",
      "title",
      "description",
    ])
      assert.equal(
        isEditableFieldPath(
          realEstateDescriptor.rootNode,
          `asset_management.benefits.${index}.${field}`,
        ),
        true,
      );
    legacy.asset_management.benefits[index]!.image_media_id = id(10 + index);
  }
  const references = realEstateAdapter.collectMediaReferences(legacy, null);
  assert.equal(references.length, 6);
  assert.ok(references.every((ref) => ref.kind === "image"));
  assert.deepEqual(
    new Set(descriptorMediaIds(legacy, null, realEstateDescriptor)),
    new Set(references.map((ref) => ref.id)),
  );
  const assets = new Map(
    references.map((ref) => [ref.id, { mime: "image/jpeg" }]),
  );
  assert.deepEqual(realEstateAdapter.mediaErrors(legacy, null, assets), {});
  assets.set(id(10), { mime: "video/mp4" });
  assets.delete(id(11));
  assert.deepEqual(
    Object.keys(realEstateAdapter.mediaErrors(legacy, null, assets)).sort(),
    [
      "asset_management.benefits.0.image_media_id",
      "asset_management.benefits.1.image_media_id",
    ],
  );
  legacy.asset_management.benefits[0]!.image_media_id = "";
  assert.equal(
    realEstateAdapter.collectMediaReferences(legacy, null).length,
    5,
  );
});

test("Asset-card images, text, alt copy and fallback identities survive reorder and language preparation", () => {
  const content = normalizeRealEstate(realEstateAdapter.defaultContent());
  content.asset_management.benefits[0]!.image_media_id = id(20);
  content.asset_management.benefits[0]!.image_alt = "Original alt";
  const target: PageEnvelope<"real_estate"> = {
    schemaVersion: 1,
    content: structuredClone(content),
    ogImageMediaId: null,
  };
  target.content.asset_management.benefits[0]!.title = "Apartamento";
  target.content.asset_management.benefits[0]!.image_alt = "Interior traducido";
  const template = structuredClone(target);
  template.content.asset_management.benefits.reverse();
  template.content._list_ids!["asset_management.benefits"]!.reverse();
  assert.deepEqual(realEstateIdentityErrors(template.content, content), {});
  assert.equal(realEstateAssetFallbackIndex(template.content, 5), 0);
  assert.equal(realEstateAssetFallbackIndex(template.content, 0), 5);
  const prepared = prepareTargetEnvelope(
    template,
    target,
    realEstateDescriptor,
  );
  const last = prepared.content.asset_management.benefits[5]!;
  assert.equal(last.title, "Apartamento");
  assert.equal(last.image_alt, "Interior traducido");
  assert.equal(last.image_media_id, id(20));
  assert.equal(
    realEstateTranslationField(
      prepared.content,
      "asset_management.benefits.5.image_alt",
    ),
    "block:asset_management.benefits.0.image_alt",
  );
});

test("Real Estate model/point identities preserve target text across reorder and the capability PDF keeps its own CTA destination", () => {
  const content = normalizeRealEstate(realEstateAdapter.defaultContent());
  const target: PageEnvelope<"real_estate"> = {
    schemaVersion: 1,
    content,
    ogImageMediaId: null,
  };
  target.content.deal_structures.models[0]!.name = "Modelo original";
  target.content.deal_structures.models[0]!.points[0] = "Primero";
  target.content.deal_structures.models[0]!.points[1] = "Segundo";
  const template = structuredClone(target);
  template.content.deal_structures.models.reverse();
  template.content._list_ids!["deal_structures.models"]!.reverse();
  template.content.deal_structures.models[2]!.points.reverse();
  template.content._list_ids![
    "deal_structures.models.@legacy_0.points"
  ]!.reverse();
  template.content.deal_structures.models[2]!.name = "English";
  template.content.deal_structures.models[2]!.points.fill("English");
  assert.deepEqual(realEstateIdentityErrors(template.content, content), {});
  assert.equal(
    editorialListScope(
      template.content,
      "deal_structures.models.2.points",
      realEstateDescriptor,
    ),
    "deal_structures.models.@legacy_0.points",
  );
  const prepared = prepareTargetEnvelope(
    template,
    target,
    realEstateDescriptor,
  );
  assert.equal(
    prepared.content.deal_structures.models[2]!.name,
    "Modelo original",
  );
  assert.equal(
    prepared.content.deal_structures.models[2]!.points.at(-1),
    "Primero",
  );
  assert.equal(
    prepared.content.deal_structures.models[2]!.points.at(-2),
    "Segundo",
  );
  assert.equal(
    realEstateTranslationField(
      prepared.content,
      "deal_structures.models.2.points.6",
    ),
    "block:deal_structures.models.0.points.0",
  );
  const next = structuredClone(content);
  next.deal_structures.models[0]!.points.shift();
  next._list_ids!["deal_structures.models.@legacy_0.points"]!.shift();
  const retired = retireRealEstateIds(next, content);
  assert.ok(
    retired._retired_ids!.includes(
      "deal_structures.models.@legacy_0.points:legacy_0",
    ),
  );
  next.deal_structures.models[0]!.points.push("New point");
  next._list_ids!["deal_structures.models.@legacy_0.points"]!.push(id(99));
  assert.deepEqual(realEstateIdentityErrors(next, content), {});
  assert.equal(
    realEstateTranslationField(next, "deal_structures.models.0.points.6"),
    `block:deal_structures.models.0.points.@${id(99)}`,
  );
  next.hero.capability_statement_media_id = id(2);
  const refs = realEstateAdapter.collectMediaReferences(next, null);
  assert.deepEqual(refs, [
    { path: "hero.capability_statement_media_id", id: id(2), kind: "pdf" },
  ]);
  const pdfUrl = "/media/capability.pdf";
  assert.equal(
    capabilityStatementHref({ mime: "application/pdf", url: pdfUrl }),
    pdfUrl,
  );
  assert.equal(
    capabilityStatementHref({ mime: "image/png", url: "/media/hero.png" }),
    null,
  );
  assert.equal(
    capabilityStatementHref(undefined),
    null,
    "No document retains the existing enquiry anchor fallback",
  );
  assert.deepEqual(
    realEstateAdapter.mediaErrors(
      next,
      null,
      new Map([[id(2), { mime: "image/png" }]]),
    ),
    {
      "hero.capability_statement_media_id":
        "Select an uploaded file of the supported type.",
    },
  );
});
