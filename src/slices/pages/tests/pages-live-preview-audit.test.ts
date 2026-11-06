import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { getEditorialAdapter } from "../server/editorial-adapters";
import { setPageField } from "../admin/field-update";
import { isEditableFieldPath } from "../admin/home-contextual";
import { validateEnvelope } from "../admin/editorial-validation";
import { validatePageLivePreview } from "../admin/live-preview-validation";
import { editorialAt, editorialTextPaths } from "../editorial-identities";
import { homeSet } from "../home-content";
import { prepareTargetEnvelope, sharedEnvelope } from "../editorial-content";
import type { EditorialPageKey, PageContentMap } from "../editorial-types";
import { ownersSchema } from "../schemas/owners";

const keys: EditorialPageKey[] = ["home", "owners", "buildings", "real_estate", "guest", "guides", "services", "about", "blog"];
function unwrap(schema: z.ZodType): z.ZodType {
  let node = schema;
  for (;;) {
    const inner = (node as { def?: { innerType?: z.ZodType } }).def?.innerType;
    if (!inner || inner === node) return node;
    node = inner;
  }
}
function optionalObjects(schema: z.ZodType, value: unknown, path: string[] = []): string[][] {
  const node = unwrap(schema);
  if (node instanceof z.ZodObject) {
    const object = value as Record<string, unknown> | undefined;
    return [
      ...(path.length && schema.isOptional() && object ? [path] : []),
      ...Object.entries(node.shape as Record<string, z.ZodType>).flatMap(([key, child]) => optionalObjects(child, object?.[key], [...path, key])),
    ];
  }
  if (node instanceof z.ZodArray && Array.isArray(value)) return value.flatMap((item, index) => optionalObjects(node.element as z.ZodType, item, [...path, String(index)]));
  return [];
}
function remove(root: unknown, path: string[]) {
  const parent = path.slice(0, -1).reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, root);
  if (parent && typeof parent === "object") delete (parent as Record<string, unknown>)[path.at(-1)!];
}

for (const key of keys) test(`${key}: valid scalar edits and absent optional groups preview in all four locales without changing shared fields or losing target copy`, () => {
  const adapter = getEditorialAdapter(key);
  const content = adapter.defaultContent();
  const original = structuredClone(content);
  const initial = { schemaVersion: 1 as const, content, ogImageMediaId: null };
  assert.deepEqual(validateEnvelope(initial, false, key).errors, {}, "Fresh defaults must be draft-valid");
  const paths = editorialTextPaths(content, adapter.descriptor).filter(path => isEditableFieldPath(adapter.descriptor.rootNode, path));
  let cases = 0;
  for (const removed of [null, ...optionalObjects(adapter.publishSchema, content)]) {
    const before = structuredClone(content);
    if (removed) {
      remove(before, removed);
      // Synthetic legacy fixture: derive identities from the remaining lists.
      remove(before, ["_list_ids"]);
      remove(before, ["_retired_ids"]);
    }
    const normalized = adapter.normalize(before);
    // Recover only identity metadata: some adapters scaffold optional content in
    // normalize(), which would hide the raw missing-parent scenario being tested.
    for (const field of ["_list_ids", "_retired_ids"]) {
      const metadata = (normalized as Record<string, unknown>)[field];
      if (metadata !== undefined) (before as Record<string, unknown>)[field] = metadata;
    }
    const envelope = { ...initial, content: before };
    assert.deepEqual(validateEnvelope(envelope, false, key).errors, {});
    const prefix = removed?.join(".");
    for (const path of paths) {
      if (prefix && (!path.startsWith(`${prefix}.`) || path.slice(prefix.length + 1).split(".").some(part => /^\d+$/.test(part)))) continue;
      for (const locale of ["en", "es", "pt", "fr"]) {
        const value = /\.(url|cta_url)$/.test(path) ? `https://example.test/${locale}/preview` : key === "guides" && path === "catalogue.headline" ? `Preview ${locale} {city}` : `Preview ${locale}`;
        const after = setPageField(before, adapter.descriptor.rootNode, path.split("."), value) as PageContentMap[EditorialPageKey];
        const candidate = { ...envelope, content: after };
        const context = `${key}/${locale}: ${path}, absent ${prefix ?? "none"}`;
        assert.deepEqual(validateEnvelope(candidate, false, key).errors, {}, context);
        assert.ok(validatePageLivePreview(key, { envelope: candidate, localMedia: {} }, "http://localhost:3071"), context);
        assert.deepEqual(adapter.identityErrors(after, before), {}, context);
        assert.equal(sharedEnvelope<EditorialPageKey>(candidate, adapter.descriptor), sharedEnvelope<EditorialPageKey>(envelope, adapter.descriptor), context);
        const prepared = prepareTargetEnvelope<EditorialPageKey>(envelope, candidate, adapter.descriptor);
        assert.equal(editorialAt(prepared.content, path), value, `Target copy must survive reopening: ${context}`);
        cases++;
      }
    }
  }
  assert.ok(cases > 0);
  assert.deepEqual(content, original);
});

test("Optional-group preparation cannot fabricate array rows or overwrite scalar/null ancestors", () => {
  const value: Record<string, unknown> = { rows: [], scalar: "unchanged", nullish: null };
  homeSet(value, "missing.title", undefined, true);
  homeSet(value, "newRows.0.title", "Unsafe row", true);
  homeSet(value, "rows.0.title", "Unsafe row", true);
  homeSet(value, "rows.0", "Unsafe row", true);
  homeSet(value, "scalar.title", "Wrong", true);
  homeSet(value, "nullish.title", "Wrong", true);
  assert.deepEqual(value, { rows: [], scalar: "unchanged", nullish: null });
  homeSet(value, "legacy.title", "No implicit creation");
  assert.equal(Reflect.get(value, "legacy"), undefined);
  homeSet(value, "allowed.title", "Target text", true);
  assert.deepEqual(Reflect.get(value, "allowed"), { title: "Target text" });
});

test("Publish accepts label-only fixed Owners helper CTA; nonempty media and structural guards remain strict", () => {
  const helper = ownersSchema.shape.plans.shape.helpers.element.shape.cta.unwrap();
  assert.equal(helper.safeParse({ label: "Ask us" }).success, true);
  const buildings = getEditorialAdapter("buildings");
  const before = buildings.normalize({});
  const envelope = { schemaVersion: 1 as const, content: before, ogImageMediaId: null };
  const changed = setPageField(before, buildings.descriptor.rootNode, ["hero", "image_media_id"], "46d4b557-b1f1-4ac2-96b3-a32004b68283") as typeof before;
  assert.notEqual(sharedEnvelope<"buildings">(envelope, buildings.descriptor), sharedEnvelope<"buildings">({ ...envelope, content: changed }, buildings.descriptor));
  const removed = setPageField(changed, buildings.descriptor.rootNode, ["hero", "image_media_id"], "") as typeof before;
  assert.notEqual(sharedEnvelope<"buildings">({ ...envelope, content: changed }, buildings.descriptor), sharedEnvelope<"buildings">({ ...envelope, content: removed }, buildings.descriptor));
});

test("Explicit invalid input retains preview validation rather than bypassing it", () => {
  const home = getEditorialAdapter("home");
  const content = home.defaultContent();
  const invalid = setPageField(content, home.descriptor.rootNode, ["hero", "headline"], "x".repeat(161));
  const payload = (value: unknown) => ({ envelope: { schemaVersion: 1, content: value, ogImageMediaId: null }, localMedia: {} });
  assert.equal(validatePageLivePreview("home", payload(invalid), "http://localhost:3071"), null);
  const url = setPageField(content, home.descriptor.rootNode, ["hero", "cta_primary", "url"], "javascript:alert(1)");
  assert.equal(validatePageLivePreview("home", payload(url), "http://localhost:3071"), null);
  assert.ok(validatePageLivePreview("home", payload(content), "http://localhost:3071"));
});
