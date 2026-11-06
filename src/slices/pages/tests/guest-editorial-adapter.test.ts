import test from "node:test";
import assert from "node:assert/strict";
import { translatablePaths } from "@core/validation/primitives";
import { guestSchema } from "../schemas/guest";
import { guestAdapter, guestDraftSchema } from "../adapters/guest";
import {
  guestDescriptor,
  guestIdentityErrors,
  guestFallbackIndex,
  guestTranslationField,
} from "../guest-content";
import { prepareTargetEnvelope, sharedEnvelope } from "../editorial-content";
import type { PageEnvelope } from "../editorial-types";

test("Guest adapter preserves editable copy, seven legacy destinations, localized Hero overrides and all sixteen media slots", () => {
  const content = guestAdapter.defaultContent();
  assert.equal(guestDraftSchema.safeParse(content).success, true);
  assert.equal(
    guestSchema.safeParse(content).success,
    false,
    "Publication keeps complete hidden URL validation",
  );
  for (const cta of [
    content.hero.cta,
    content.why.cta,
    content.portfolio.cta,
    content.services_teaser.cta,
    content.activities_teaser.cta,
    content.dual_cta.guest.cta,
    content.dual_cta.owner.cta,
  ])
    cta.url = "https://example.test/preserved-destination";
  assert.deepEqual(guestSchema.parse(content), content);
  assert.deepEqual(
    guestDescriptor.textPatterns,
    translatablePaths(guestSchema),
  );
  for (const path of [
    "welcome.image_alt",
    "services_teaser.items[].title",
    "activities_teaser.items[].description",
    "dual_cta.owner.contact.title",
    "dual_cta.guest.contact_line",
    "dual_cta.owner.contact_line",
    "testimonials.title",
    "faq.title",
  ])
    assert.ok(guestDescriptor.textPatterns.includes(path), path);
  const hidden: string[] = [];
  function walk(node: typeof guestDescriptor.rootNode, path = "") {
    if (node.kind === "hidden") {
      hidden.push(path);
      walk(node.node, path);
    }
    if (node.kind === "object")
      for (const { key, node: child } of node.fields)
        walk(child, path ? `${path}.${key}` : key);
    if (node.kind === "array") walk(node.element, `${path}[]`);
  }
  walk(guestDescriptor.rootNode);
  assert.equal(hidden.filter((path) => path.endsWith(".url")).length, 7);
  assert.ok(hidden.includes("hero.cta"));
  assert.ok(guestDescriptor.textPatterns.includes("hero.cta_url"));
  assert.ok(hidden.includes("_list_ids"));
  assert.ok(hidden.includes("_retired_ids"));
  assert.deepEqual(guestIdentityErrors(content), {});
  assert.deepEqual(
    [
      content.why.benefits.length,
      content.services_teaser.items.length,
      content.activities_teaser.items.length,
    ],
    [4, 6, 6],
  );
  const id = (index: number) =>
    `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
  const og = id(1);
  content.hero.video_media_id = id(2);
  content.hero.poster_media_id = id(3);
  content.welcome.image_media_id = id(4);
  content.services_teaser.items.forEach(
    (item, index) => (item.image_media_id = id(index + 5)),
  );
  content.activities_teaser.items.forEach(
    (item, index) => (item.image_media_id = id(index + 11)),
  );
  const refs = guestAdapter.collectMediaReferences(content, og);
  assert.equal(refs.length, 16);
  assert.equal(new Set(refs.map((ref) => ref.id)).size, 16);
  assert.equal(guestDescriptor.maxLocalMedia, 16);
  assert.equal(
    refs.every(
      (ref) =>
        ref.path === "og_image_media_id" ||
        guestDescriptor.mediaSlots.some(
          (slot) => slot.path === ref.path.replace(/\.\d+(?=\.|$)/g, "[]"),
        ),
    ),
    true,
  );
  const assets = new Map(
    refs.map((ref) => [
      ref.id,
      {
        mime:
          ref.kind === "video"
            ? "video/webm"
            : ref.kind === "mixed"
              ? "application/json"
              : "image/png",
      },
    ]),
  );
  assert.deepEqual(guestAdapter.mediaErrors(content, og, assets), {});
  assets.set(content.hero.video_media_id, { mime: "image/png" });
  assets.set(content.hero.poster_media_id, { mime: "video/mp4" });
  assets.set(content.services_teaser.items[0]!.image_media_id!, {
    mime: "application/pdf",
  });
  assert.deepEqual(
    Object.keys(guestAdapter.mediaErrors(content, og, assets)).sort(),
    [
      "hero.poster_media_id",
      "hero.video_media_id",
      "services_teaser.items.0.image_media_id",
    ],
  );
});

test("Guest teaser titles, descriptions, uploaded photos and stock fallbacks stay attached to their IDs", () => {
  const target: PageEnvelope<"guest"> = {
    schemaVersion: 1,
    content: guestAdapter.defaultContent(),
    ogImageMediaId: null,
  };
  target.content.services_teaser.items[0]!.title = "Traslado privado";
  target.content.services_teaser.items[0]!.description = "Descripción ES";
  target.content.services_teaser.items[0]!.image_media_id =
    "00000000-0000-4000-8000-000000000001";
  target.content.activities_teaser.items[0]!.title = "Primer paseo";
  const template = structuredClone(target);
  template.content.services_teaser.items.reverse();
  template.content._list_ids!["services_teaser.items"]!.reverse();
  template.content.activities_teaser.items.reverse();
  template.content._list_ids!["activities_teaser.items"]!.reverse();
  template.content.services_teaser.items[5]!.title = "English transfer";
  template.content.services_teaser.items[5]!.description =
    "English description";
  template.content.activities_teaser.items[5]!.title = "English activity";
  const prepared = prepareTargetEnvelope(template, target, guestDescriptor);
  assert.deepEqual(guestIdentityErrors(prepared.content, target.content), {});
  assert.equal(
    prepared.content.services_teaser.items[5]!.title,
    "Traslado privado",
  );
  assert.equal(
    prepared.content.services_teaser.items[5]!.description,
    "Descripción ES",
  );
  assert.equal(
    prepared.content.services_teaser.items[5]!.image_media_id,
    target.content.services_teaser.items[0]!.image_media_id,
  );
  assert.equal(
    prepared.content.activities_teaser.items[5]!.title,
    "Primer paseo",
  );
  assert.equal(
    guestFallbackIndex(prepared.content, "services_teaser.items", 5),
    0,
  );
  assert.equal(
    guestFallbackIndex(prepared.content, "activities_teaser.items", 0),
    5,
  );
  assert.equal(
    guestTranslationField(prepared.content, "services_teaser.items.5.title"),
    "block:services_teaser.items.0.title",
  );
  assert.equal(
    sharedEnvelope(prepared, guestDescriptor),
    sharedEnvelope(template, guestDescriptor),
  );
  const legacy = { ...target.content, _list_ids: undefined };
  assert.equal(guestFallbackIndex(legacy, "activities_teaser.items", 4), 4);
  const uuid = "00000000-0000-4000-8000-000000000099";
  prepared.content._list_ids!["services_teaser.items"]![0] = uuid;
  assert.equal(
    guestFallbackIndex(prepared.content, "services_teaser.items", 0),
    0,
  );
  assert.equal(
    guestTranslationField(
      prepared.content,
      "services_teaser.items.0.description",
    ),
    `block:services_teaser.items.@${uuid}.description`,
  );
});
