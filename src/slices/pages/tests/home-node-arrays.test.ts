import assert from "node:assert/strict";
import test from "node:test";
import { aboutDescriptor } from "../about-content";
import { defaultAbout } from "../schemas/about";
import { homeNode } from "../admin/home-contextual";
import { pageImageFields } from "../admin/image-alt-fields";
import type { FieldNode } from "../admin/form-model";

test("About certification logo ALT resolves to its real string field inside an array", () => {
  const items = homeNode(aboutDescriptor.rootNode, "certifications.items");
  assert.equal(items?.kind, "array");
  if (items?.kind !== "array" || items.element.kind !== "object") {
    assert.fail("About certification item must be an object array");
  }
  const logoAlt = items.element.fields.find(field => field.key === "logo_alt")?.node;
  assert.equal(logoAlt?.kind, "string");
  assert.equal(homeNode(aboutDescriptor.rootNode, "certifications.items.0.logo_alt"), logoAlt);
  assert.equal(homeNode(aboutDescriptor.rootNode, "certifications.items.2.logo_alt"), logoAlt);
});

test("every inline ALT path produced from real About images resolves without losing array positions", () => {
  const images = pageImageFields(aboutDescriptor.rootNode, defaultAbout);
  const altPaths = images.flatMap(image => image.inlineAltPath ? [image.inlineAltPath.join(".")] : []);
  assert.ok(altPaths.includes("certifications.items.0.logo_alt"));
  for (const path of altPaths) {
    assert.equal(homeNode(aboutDescriptor.rootNode, path)?.kind, "string", path);
  }
});

const leaf: FieldNode = { kind: "string", multiline: false, optional: false };
const nested: FieldNode = {
  kind: "object",
  fields: [{
    key: "rows",
    node: {
      kind: "array", min: 0, max: 12,
      element: {
        kind: "object",
        fields: [{
          key: "cells",
          node: { kind: "array", min: 0, max: 12, element: leaf },
        }],
      },
    },
  }],
};

test("nested numeric array segments reach the element schema", () => {
  assert.equal(homeNode(nested, "rows.1.cells.2"), leaf);
  const rows = homeNode(nested, "rows");
  assert.equal(rows?.kind, "array");
  if (rows?.kind !== "array") assert.fail("Expected rows array");
  assert.equal(homeNode(nested, "rows.0"), rows.element);
});

test("invalid array indices and unknown descendants return undefined", () => {
  for (const index of ["", "-1", "+1", "01", "1e2", "NaN", "Infinity", "9007199254740992", "name"]) {
    assert.equal(homeNode(nested, `rows.${index}.cells.0`), undefined, index);
  }
  assert.equal(homeNode(nested, "rows.0.missing"), undefined);
  assert.equal(homeNode(nested, "rows.0.cells.0.extra"), undefined);
  assert.equal(homeNode(nested, "rows.cells"), undefined);
});

test("existing object paths retain the same schema nodes", () => {
  const root = aboutDescriptor.rootNode;
  assert.equal(root.kind, "object");
  if (root.kind !== "object") assert.fail("Expected About object");
  const hero = root.fields.find(field => field.key === "hero")?.node;
  assert.equal(homeNode(root, "hero"), hero);
  assert.equal(hero?.kind, "object");
  if (hero?.kind !== "object") assert.fail("Expected Hero object");
  assert.equal(homeNode(root, "hero.headline"), hero.fields.find(field => field.key === "headline")?.node);
  assert.equal(homeNode(root, "hero.missing"), undefined);
  assert.equal(homeNode(root, ""), undefined);
});

test("numeric object keys remain object fields and hidden nodes do not unwrap", () => {
  const hidden: FieldNode = { kind: "hidden", node: nested };
  const root: FieldNode = { kind: "object", fields: [{ key: "0", node: leaf }, { key: "hidden", node: hidden }] };
  assert.equal(homeNode(root, "0"), leaf);
  assert.equal(homeNode(root, "hidden"), hidden);
  assert.equal(homeNode(root, "hidden.rows.0"), undefined);
});
