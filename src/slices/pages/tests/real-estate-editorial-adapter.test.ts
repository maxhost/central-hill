import test from "node:test";
import assert from "node:assert/strict";
import { translatablePaths } from "@core/validation/primitives";
import { realEstateSchema, defaultCapabilities, defaultDealStructures, defaultProcess, defaultTrackRecord } from "../schemas/real-estate";
import { realEstateAdapter, realEstateDraftSchema } from "../adapters/real-estate";
import { normalizeRealEstate, realEstateDescriptor, realEstateIdentityErrors, realEstateTranslationField, retireRealEstateIds } from "../real-estate-content";
import { editorialListScope } from "../editorial-identities";
import { prepareTargetEnvelope } from "../editorial-content";
import { capabilityStatementHref } from "../ui/capability-statement";
import { isEditableFieldPath } from "../admin/home-contextual";
import type { PageEnvelope } from "../editorial-types";

const id = (index: number) => `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;

test("Real Estate descriptor covers all existing arrays, copy, hidden fields, defaults and five typed media references", () => {
  const content = realEstateAdapter.defaultContent();
  assert.equal(realEstateDraftSchema.safeParse(content).success, true);
  assert.equal(realEstateSchema.safeParse(content).success, false, "Publication still requires valid URLs");
  assert.deepEqual(content.capabilities, defaultCapabilities);
  assert.deepEqual(content.deal_structures, defaultDealStructures);
  assert.deepEqual(content.process, defaultProcess);
  assert.deepEqual(content.track_record, defaultTrackRecord);
  for (const cta of [content.hero.cta_primary, content.hero.cta_secondary, content.partners.cta_primary, content.partners.cta_secondary, content.capabilities.cta, content.asset_management.cta]) cta.url = "https://example.test/unchanged";
  assert.deepEqual(realEstateSchema.parse(content), content, "Hidden URLs and private identity metadata round-trip");
  assert.equal(isEditableFieldPath(realEstateDescriptor.rootNode, "partners.cta_secondary.note"), false);
  assert.equal(isEditableFieldPath(realEstateDescriptor.rootNode, "deal_structures.models.0.points.0"), true);
  assert.deepEqual(realEstateDescriptor.textPatterns, translatablePaths(realEstateSchema));
  assert.equal(realEstateDescriptor.textPatterns.some(path => /_list_ids|_retired_ids|media_id|icon_key/.test(path)), false);
  const arrays: string[] = [];
  const hidden: string[] = [];
  function walk(node: typeof realEstateDescriptor.rootNode, path = "") {
    if (node.kind === "hidden") { hidden.push(path); return; }
    if (node.kind === "object") for (const field of node.fields) walk(field.node, path ? `${path}.${field.key}` : field.key);
    if (node.kind === "array") { arrays.push(path); walk(node.element, `${path}[]`); }
  }
  walk(realEstateDescriptor.rootNode);
  assert.deepEqual(arrays.sort(), [...realEstateDescriptor.listPaths].sort());
  assert.ok(hidden.includes("_list_ids") && hidden.includes("_retired_ids") && hidden.includes("hero.cta_secondary.url"));
  assert.deepEqual([content.partners.benefits.length, content.capabilities.benefits.length, content.asset_management.benefits.length, content.deal_structures.models.length, content.market.stats.length, content.market.fundamentals.body.length], [4, 3, 6, 3, 3, 2]);
  content.hero.image_media_id = id(1);
  content.hero.capability_statement_media_id = id(2);
  content.capabilities.image_media_id = id(3);
  content.asset_management.image_media_id = id(4);
  const refs = realEstateAdapter.collectMediaReferences(content, id(5));
  assert.equal(refs.length, realEstateDescriptor.maxLocalMedia);
  const assets = new Map(refs.map(ref => [ref.id, { mime: ref.kind === "pdf" ? "application/pdf" : ref.kind === "mixed" ? "video/mp4" : "image/webp" }]));
  assert.deepEqual(realEstateAdapter.mediaErrors(content, id(5), assets), {});
  assets.set(id(1), { mime: "application/pdf" });
  assets.set(id(3), { mime: "application/pdf" });
  assert.deepEqual(Object.keys(realEstateAdapter.mediaErrors(content, id(5), assets)).sort(), ["capabilities.image_media_id", "hero.image_media_id"]);
});

test("Real Estate model/point identities preserve target text across reorder and the capability PDF keeps its own CTA destination", () => {
  const content = normalizeRealEstate(realEstateAdapter.defaultContent());
  const target: PageEnvelope<"real_estate"> = { schemaVersion: 1, content, ogImageMediaId: null };
  target.content.deal_structures.models[0]!.name = "Modelo original";
  target.content.deal_structures.models[0]!.points[0] = "Primero";
  target.content.deal_structures.models[0]!.points[1] = "Segundo";
  const template = structuredClone(target);
  template.content.deal_structures.models.reverse();
  template.content._list_ids!["deal_structures.models"]!.reverse();
  template.content.deal_structures.models[2]!.points.reverse();
  template.content._list_ids!["deal_structures.models.@legacy_0.points"]!.reverse();
  template.content.deal_structures.models[2]!.name = "English";
  template.content.deal_structures.models[2]!.points.fill("English");
  assert.deepEqual(realEstateIdentityErrors(template.content, content), {});
  assert.equal(editorialListScope(template.content, "deal_structures.models.2.points", realEstateDescriptor), "deal_structures.models.@legacy_0.points");
  const prepared = prepareTargetEnvelope(template, target, realEstateDescriptor);
  assert.equal(prepared.content.deal_structures.models[2]!.name, "Modelo original");
  assert.equal(prepared.content.deal_structures.models[2]!.points.at(-1), "Primero");
  assert.equal(prepared.content.deal_structures.models[2]!.points.at(-2), "Segundo");
  assert.equal(realEstateTranslationField(prepared.content, "deal_structures.models.2.points.6"), "block:deal_structures.models.0.points.0");
  const next = structuredClone(content);
  next.deal_structures.models[0]!.points.shift();
  next._list_ids!["deal_structures.models.@legacy_0.points"]!.shift();
  const retired = retireRealEstateIds(next, content);
  assert.ok(retired._retired_ids!.includes("deal_structures.models.@legacy_0.points:legacy_0"));
  next.deal_structures.models[0]!.points.push("New point");
  next._list_ids!["deal_structures.models.@legacy_0.points"]!.push(id(99));
  assert.deepEqual(realEstateIdentityErrors(next, content), {});
  assert.equal(realEstateTranslationField(next, "deal_structures.models.0.points.6"), `block:deal_structures.models.0.points.@${id(99)}`);
  next.hero.capability_statement_media_id = id(2);
  const refs = realEstateAdapter.collectMediaReferences(next, null);
  assert.deepEqual(refs, [{ path: "hero.capability_statement_media_id", id: id(2), kind: "pdf" }]);
  const pdfUrl = "/media/capability.pdf";
  assert.equal(capabilityStatementHref({ mime: "application/pdf", url: pdfUrl }), pdfUrl);
  assert.equal(capabilityStatementHref({ mime: "image/png", url: "/media/hero.png" }), null);
  assert.equal(capabilityStatementHref(undefined), null, "No document retains the existing enquiry anchor fallback");
  assert.deepEqual(realEstateAdapter.mediaErrors(next, null, new Map([[id(2), { mime: "image/png" }]])), { "hero.capability_statement_media_id": "Select an uploaded file of the supported type." });
});
