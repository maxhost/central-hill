import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PhotoFeatureGrid } from "@core/ui/photo-feature-grid";
import { aboutAdapter } from "../adapters/about";
import { aboutDescriptor } from "../about-content";
import { aboutSchema } from "../schemas/about";
import { descriptorMediaIds, isEditableFieldPath } from "../admin/home-contextual";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

test("legacy contact cards stay valid and expose independent image fields with preview references", () => {
  const content = aboutAdapter.defaultContent();
  for (const card of content.contact.cards) delete card.image_media_id;
  assert.equal(aboutSchema.safeParse(content).success, true);
  for (let i = 0; i < content.contact.cards.length; i++) {
    assert.equal(isEditableFieldPath(aboutDescriptor.rootNode, `contact.cards.${i}.image_media_id`), true);
    content.contact.cards[i]!.image_media_id = uuid(i + 50);
  }
  const refs = aboutAdapter.collectMediaReferences(content, null);
  assert.deepEqual(refs.map(ref => ref.path), [
    "contact.cards.0.image_media_id", "contact.cards.1.image_media_id", "contact.cards.2.image_media_id",
  ]);
  assert.deepEqual(new Set(descriptorMediaIds(content, null, aboutDescriptor)), new Set(refs.map(ref => ref.id)));
  const assets = new Map(refs.map(ref => [ref.id, { mime: "image/jpeg" }]));
  assert.deepEqual(aboutAdapter.mediaErrors(content, null, assets), {});
  assets.set(uuid(50), { mime: "video/mp4" });
  assets.delete(uuid(51));
  assert.deepEqual(Object.keys(aboutAdapter.mediaErrors(content, null, assets)).sort(), ["contact.cards.0.image_media_id", "contact.cards.1.image_media_id"]);
});

test("photo contact cards retain one same-tab link and their editable action text over the photo", () => {
  const html = renderToStaticMarkup(createElement(PhotoFeatureGrid, { items: [{
    id: "owners", href: "/es/owners", title: "Propietarios", description: "Gestionamos tu propiedad.",
    image: "https://example.test/owners.jpg", linkLabel: "Habla con nosotros →",
  }] }));
  assert.equal((html.match(/<a\s/g) ?? []).length, 1);
  assert.match(html, /href="\/es\/owners"/);
  assert.ok(html.includes("owners.jpg"));
  assert.ok(html.includes("Habla con nosotros →"));
  assert.ok(html.includes("linear-gradient"));
  assert.doesNotMatch(html, /target=|<button/);
  const plain = renderToStaticMarkup(createElement(PhotoFeatureGrid, { items: [{ title: "Audience", description: "Description", linkLabel: "Unused" }] }));
  assert.doesNotMatch(plain, /Unused|<a\s/);
});
