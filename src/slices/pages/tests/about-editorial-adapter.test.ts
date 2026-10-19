import test from "node:test";
import assert from "node:assert/strict";
import { translatablePaths } from "@core/validation/primitives";
import { aboutSchema, defaultAbout } from "../schemas/about";
import { aboutAdapter } from "../adapters/about";
import {
  ABOUT_LIST_PATHS,
  aboutAt,
  aboutDescriptor,
  normalizeAbout,
  aboutIdentityErrors,
  aboutTranslationField,
  retireAboutIds,
} from "../about-content";
import { prepareTargetEnvelope } from "../editorial-content";
import { aboutAudienceImage, aboutContactHref } from "../ui/about-presentation";
import type { PageEnvelope } from "../editorial-types";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

test("About adapter preserves eight bounded lists, rejects malformed authored metadata and validates 29 media references", () => {
  const content = aboutAdapter.defaultContent();
  assert.equal(aboutSchema.safeParse(content).success, true);
  assert.deepEqual(aboutIdentityErrors(content), {});
  assert.deepEqual(Object.keys(content._list_ids!), [...ABOUT_LIST_PATHS]);
  const root = aboutDescriptor.rootNode;
  assert.equal(root.kind, "object");
  function listBounds(path: string) {
    let node = root;
    for (const key of path.split(".")) {
      if (node.kind !== "object") throw new Error(`Expected object for ${path}`);
      node = node.fields.find(field => field.key === key)!.node;
    }
    if (node.kind !== "array") throw new Error(`Expected array for ${path}`);
    return [node.min, node.max];
  }
  assert.deepEqual(ABOUT_LIST_PATHS.map(listBounds), [[1, 8], [0, 8], [1, 12], [1, 12], [1, 12], [1, 12], [1, 8], [1, 12]]);
  assert.deepEqual(normalizeAbout(content), content, "Existing list identities survive normalization byte-for-byte");
  assert.deepEqual(aboutDescriptor.textPatterns, translatablePaths(aboutSchema));
  assert.equal(aboutDescriptor.textPatterns.includes("certifications.items[].issuer"), false);
  assert.equal(aboutDescriptor.textPatterns.includes("certifications.items[].logo_alt"), true);
  assert.equal(content.hero.headline, defaultAbout.hero.headline);
  assert.deepEqual(content.contact.cards.map(card => card.destination), ["buildings", "owners", "real_estate"]);
  const malformed = structuredClone(content);
  delete malformed._list_ids!["community.copy"];
  assert.ok(aboutIdentityErrors(normalizeAbout(malformed))["community.copy"], "Authored metadata holes are never repaired");
  content.serve.audiences = Array.from({ length: 12 }, (_, i) => ({ ...content.serve.audiences[0]!, image_media_id: uuid(i + 5) }));
  content.certifications.items = Array.from({ length: 12 }, (_, i) => ({ ...content.certifications.items[0]!, logo_media_id: uuid(i + 17) }));
  content.hero.image_media_id = uuid(1);
  content.story.image_media_id = uuid(2);
  content.organisation.image_media_id = uuid(3);
  content.community.image_media_id = uuid(4);
  const og = uuid(29);
  const refs = aboutAdapter.collectMediaReferences(content, og);
  assert.equal(refs.length, 29);
  assert.equal(new Set(refs.map(ref => ref.id)).size, 29);
  assert.equal(aboutDescriptor.maxLocalMedia, 29);
  const assets = new Map(refs.map(ref => [ref.id, { mime: ref.kind === "mixed" ? "video/mp4" : "image/png" }]));
  assert.deepEqual(aboutAdapter.mediaErrors(content, og, assets), {});
  assets.set(content.hero.image_media_id, { mime: "video/mp4" });
  assets.set(content.certifications.items[0]!.logo_media_id, { mime: "application/json" });
  assets.delete(content.serve.audiences[0]!.image_media_id);
  assets.set(og, { mime: "video/mp4" });
  assert.deepEqual(Object.keys(aboutAdapter.mediaErrors(content, og, assets)).sort(), ["certifications.items.0.logo_media_id", "hero.image_media_id", "og_image_media_id", "serve.audiences.0.image_media_id"]);
});

test("About target preparation follows paragraph, audience and contact identities through reorder and retirement", () => {
  const target: PageEnvelope<"about"> = { schemaVersion: 1, content: aboutAdapter.defaultContent(), ogImageMediaId: null };
  target.content.story.narrative[0] = "Primer párrafo";
  target.content.serve.audiences[0]!.title = "Huéspedes";
  target.content.contact.cards[0]!.title = "Una estancia";
  const template = structuredClone(target);
  for (const path of ["story.narrative", "serve.audiences", "contact.cards"]) {
    (aboutAt(template.content, path) as unknown[]).reverse();
    template.content._list_ids![path]!.reverse();
  }
  template.content.story.narrative[2] = "English paragraph";
  template.content.serve.audiences[2]!.title = "English audience";
  template.content.contact.cards[2]!.title = "English contact";
  const prepared = prepareTargetEnvelope(template, target, aboutDescriptor);
  assert.deepEqual(aboutIdentityErrors(prepared.content, target.content), {});
  assert.equal(prepared.content.story.narrative[2], "Primer párrafo");
  assert.equal(prepared.content.serve.audiences[2]!.title, "Huéspedes");
  assert.equal(prepared.content.contact.cards[2]!.title, "Una estancia");
  assert.equal(aboutTranslationField(prepared.content, "story.narrative.2"), "block:story.narrative.0");
  assert.equal(aboutAudienceImage(undefined, 2, ["photo0", "photo1", "photo2"], prepared.content._list_ids!["serve.audiences"]![2]), "photo0");
  assert.equal(aboutContactHref(prepared.content.contact.cards[2]!, "es"), "/es/buildings");
  const next = structuredClone(prepared.content);
  next.story.narrative.pop();
  next._list_ids!["story.narrative"]!.pop();
  const retired = retireAboutIds(next, prepared.content);
  assert.ok(retired._retired_ids!.includes("story.narrative:legacy_0"));
  retired.story.narrative.push("Reused");
  retired._list_ids!["story.narrative"]!.push("legacy_0");
  assert.ok(aboutIdentityErrors(retired, next)["story.narrative"]);
  const newCard = { ...next.contact.cards[0]!, destination: "buildings" as const };
  next.contact.cards.push(newCard);
  next._list_ids!["contact.cards"]!.push(uuid(99));
  assert.deepEqual(aboutIdentityErrors(next, prepared.content), {});
  assert.equal(aboutTranslationField(next, "contact.cards.3.title"), `block:contact.cards.@${uuid(99)}.title`);
});
