import test from "node:test";
import assert from "node:assert/strict";
import { translatablePaths } from "@core/validation/primitives";
import { buildingsAdapter } from "../adapters/buildings";
import { buildingsSchema, defaultBuildings } from "../schemas/buildings";
import {
  buildingsDescriptor,
  buildingsIdentityErrors,
  normalizeBuildings,
  retireBuildingsIds,
} from "../buildings-content";
import { describedStatFigureCells } from "../ui/stat-figure-value";
import { prepareTargetEnvelope } from "../editorial-content";
import type { PageEnvelope } from "../editorial-types";

test("Buildings defaults retain the existing public figures and every editorial/media field", () => {
  const content = buildingsAdapter.defaultContent();
  assert.equal(buildingsSchema.safeParse(content).success, true);
  assert.deepEqual(describedStatFigureCells(content.stats?.figures ?? []), describedStatFigureCells(defaultBuildings.stats?.figures ?? []));
  assert.deepEqual(
    buildingsDescriptor.textPatterns,
    translatablePaths(buildingsSchema),
  );
  for (const path of [
    "seo.meta_title",
    "hero.headline",
    "hero.contact.title",
    "owner_panel.contact_line",
    "stats.figures[].description",
    "calculator.contact_step.title",
    "calculator.done_step.body",
  ])
    assert.ok(buildingsDescriptor.textPatterns.includes(path), path);
  assert.deepEqual(buildingsIdentityErrors(content), {});
  assert.deepEqual(
    normalizeBuildings({})._list_ids,
    { "stats.figures": [] },
    "Valid legacy empty content keeps its absent figures",
  );
  const og = "00000000-0000-4000-8000-000000000001";
  content.hero!.image_media_id = "00000000-0000-4000-8000-000000000002";
  content.calculator!.media_media_id = "00000000-0000-4000-8000-000000000003";
  const refs = buildingsAdapter.collectMediaReferences(content, og);
  assert.equal(refs.length, 3);
  assert.equal(buildingsDescriptor.maxLocalMedia, 3);
  const assets = new Map(
    refs.map((ref) => [
      ref.id,
      {
        mime: ref.kind === "mixed" ? "application/zip+dotlottie" : "image/webp",
      },
    ]),
  );
  assert.deepEqual(buildingsAdapter.mediaErrors(content, og, assets), {});
  assets.set(content.hero!.image_media_id, { mime: "video/mp4" });
  assets.set(og, { mime: "application/pdf" });
  assert.deepEqual(
    Object.keys(buildingsAdapter.mediaErrors(content, og, assets)).sort(),
    ["hero.image_media_id", "og_image_media_id"],
  );
});

test("Buildings stats move their translations with identity while the catalogue stays outside snapshots", () => {
  const target: PageEnvelope<"buildings"> = {
    schemaVersion: 1,
    content: buildingsAdapter.defaultContent(),
    ogImageMediaId: null,
  };
  target.content.stats!.figures[0]!.label = "Reservas";
  target.content.stats!.figures[0]!.description = "Descripción original";
  const template = structuredClone(target);
  template.content.stats!.figures.reverse();
  template.content._list_ids!["stats.figures"]!.reverse();
  template.content.stats!.figures[2]!.label = "English";
  template.content.stats!.figures[2]!.description = "English description";
  const prepared = prepareTargetEnvelope(template, target, buildingsDescriptor);
  assert.equal(prepared.content.stats!.figures[2]!.label, "Reservas");
  assert.equal(
    prepared.content.stats!.figures[2]!.description,
    "Descripción original",
  );
  assert.equal(
    buildingsAdapter.translationField(
      prepared.content,
      "stats.figures.2.description",
    ),
    "block:stats.figures.0.description",
  );
  const removed = structuredClone(prepared.content);
  removed.stats!.figures.pop();
  removed._list_ids!["stats.figures"]!.pop();
  const retired = retireBuildingsIds(removed, prepared.content);
  assert.ok(retired._retired_ids!.includes("stats.figures:legacy_0"));
  retired.stats!.figures.push(
    structuredClone(target.content.stats!.figures[0]!),
  );
  retired._list_ids!["stats.figures"]!.push("legacy_0");
  assert.ok(buildingsIdentityErrors(retired, removed)["stats.figures"]);
  assert.ok(buildingsDescriptor.externalSections.includes("catalogue"));
  assert.equal(buildingsDescriptor.rootNode.kind, "object");
  if (buildingsDescriptor.rootNode.kind === "object")
    assert.equal(
      buildingsDescriptor.rootNode.fields.some((field) =>
        ["catalogue", "buildings", "apartments"].includes(field.key),
      ),
      false,
    );
  const snapshot = buildingsSchema.parse({
    ...prepared.content,
    catalogue: [
      { id: "independent-published-building", name: "Live catalogue" },
    ],
  });
  assert.equal(
    Object.hasOwn(snapshot, "catalogue"),
    false,
    "Published catalogue is read by its owning renderer, never frozen in editorial JSON",
  );
  assert.equal(
    buildingsAdapter
      .textPaths(snapshot)
      .some((path) => path.startsWith("catalogue")),
    false,
  );
});
