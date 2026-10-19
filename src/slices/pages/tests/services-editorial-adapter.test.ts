import assert from "node:assert/strict";
import test from "node:test";
import { servicesAdapter } from "../adapters/services";
import { servicesDescriptor, normalizeServices } from "../services-content";
import { defaultServices, servicesSchema } from "../schemas/services";
import { descriptorMediaIds, homeNode } from "../admin/home-contextual";
import {
  captureLegacyPending,
  prepareTargetEnvelope,
} from "../editorial-content";
import { overlayTranslations } from "../server/overlay";
import { orMessage } from "../ui/or-message";
import type { PageEnvelope } from "../editorial-types";

const ids = Array.from(
  { length: 5 },
  (_, index) => `11111111-1111-4111-8111-11111111111${index}`,
);

test("Services descriptor covers authored copy and five MIME-validated refs without materializing fallbacks", () => {
  const content = servicesAdapter.defaultContent();
  assert.deepEqual(servicesSchema.parse(defaultServices), {});
  assert.equal(content.hero?.headline, "");
  assert.equal(content.how_it_works?.items?.[0]?.icon_key, "");
  assert.equal(
    orMessage(content.hero?.headline, "Visitor locale title"),
    "Visitor locale title",
  );
  assert.deepEqual(servicesAdapter.identityErrors(content), {});
  assert.deepEqual(servicesAdapter.normalize(content), content);
  assert.equal(servicesDescriptor.maxLocalMedia, 5);
  assert.deepEqual(servicesDescriptor.externalSections, ["catalogue"]);
  const paths = servicesAdapter.textPaths(content);
  assert.ok(paths.includes("seo.meta_title"));
  assert.ok(paths.includes("intro.body"));
  assert.ok(paths.includes("how_it_works.items.2.title"));
  assert.ok(paths.includes("final_cta.media_alt"));
  assert.ok(paths.includes("final_cta.contact_note"));
  assert.ok(
    !paths.some(
      (path) => path.endsWith("media_id") || path.endsWith("icon_key"),
    ),
  );

  content.hero = { media_media_id: ids[0], poster_media_id: ids[1] };
  content.final_cta = { media_media_id: ids[2], poster_media_id: ids[3] };
  const refs = servicesAdapter.collectMediaReferences(content, ids[4]!);
  assert.equal(refs.length, 5);
  assert.deepEqual(new Set(refs.map((ref) => ref.id)), new Set(ids));
  assert.deepEqual(
    new Set(descriptorMediaIds(content, ids[4]!, servicesDescriptor)),
    new Set(ids),
  );
  const assets = new Map([
    [ids[0]!, { mime: "video/mp4" }],
    [ids[1]!, { mime: "image/jpeg" }],
    [ids[2]!, { mime: "application/json" }],
    [ids[3]!, { mime: "image/webp" }],
    [ids[4]!, { mime: "image/png" }],
  ]);
  assert.deepEqual(servicesAdapter.mediaErrors(content, ids[4]!, assets), {});
  assets.set(ids[1]!, { mime: "video/mp4" });
  assets.set(ids[4]!, { mime: "video/mp4" });
  assets.delete(ids[2]!);
  assert.deepEqual(
    Object.keys(servicesAdapter.mediaErrors(content, ids[4]!, assets)).sort(),
    ["final_cta.media_media_id", "hero.poster_media_id", "og_image_media_id"],
  );
});

test("Services bootstrap keeps numeric translation paths, three fixed steps and private pending copy", () => {
  const source = servicesSchema.parse({
    hero: { headline: "English heading" },
    how_it_works: {
      items: [{ title: "Request" }, { title: "Plan" }, { title: "Enjoy" }],
    },
  });
  const sourceBefore = structuredClone(source);
  const field = "how_it_works.items.1.title";
  assert.equal(
    servicesAdapter.translationField(source, field),
    `block:${field}`,
  );
  const localized = overlayTranslations(
    source,
    servicesDescriptor.textPatterns,
    (path) => (path === field ? "Planificar" : undefined),
  );
  const published: PageEnvelope<"services"> = {
    schemaVersion: 1,
    content: normalizeServices(localized),
    ogImageMediaId: null,
  };
  assert.equal(published.content.how_it_works?.items?.[1]?.title, "Planificar");
  assert.equal(published.content.hero?.headline, source.hero?.headline);
  assert.equal(published.content.intro?.headline, "");
  assert.deepEqual(source, sourceBefore);
  assert.deepEqual(servicesDescriptor.listPaths, []);
  const node = homeNode(servicesDescriptor.rootNode, "how_it_works.items");
  assert.equal(node?.kind, "array");
  if (node?.kind !== "array") throw new Error("Missing fixed Services steps");
  assert.equal(node.fixedOrder, true);
  assert.equal(node.min, 3);
  assert.equal(node.max, 3);
  assert.equal(
    servicesSchema.safeParse({
      how_it_works: { items: source.how_it_works!.items!.slice(0, 2) },
    }).success,
    false,
  );

  const draft = captureLegacyPending(
    published,
    [{ field: "block:how_it_works.items.2.body", value: "Pendiente" }],
    servicesDescriptor,
  )!;
  assert.equal(draft.content.how_it_works?.items?.[2]?.body, "Pendiente");
  assert.equal(published.content.how_it_works?.items?.[2]?.body, "");
  const template: PageEnvelope<"services"> = {
    ...published,
    content: normalizeServices(source),
  };
  const prepared = prepareTargetEnvelope(template, draft, servicesDescriptor);
  assert.equal(prepared.content.how_it_works?.items?.[1]?.title, "Planificar");
  assert.equal(prepared.content.how_it_works?.items?.[2]?.body, "Pendiente");
  assert.equal(prepared.content.how_it_works?.items?.length, 3);
  assert.ok(servicesAdapter.publishSchema.safeParse(prepared.content).success);
});
