import assert from "node:assert/strict";
import test from "node:test";
import { resolveMediaAlt } from "@core/media/alt";
import {
  checkBuildingEnvelope,
  sharedBuildingValuesMatch,
} from "../server/editorial-validation";
import {
  emptyBuildingEnvelope,
  prepareBuildingTarget,
  changeBuildingField,
  type BuildingWorkspace,
} from "../admin/ui/property-editor-state";

const photo = "d3020000-0000-4000-8000-000000000001";
const other = "d3020000-0000-4000-8000-000000000002";

test("Building ALT is localized content, validated optionally and stable across gallery reorder", () => {
  const source = emptyBuildingEnvelope(photo);
  source.content.gallery = [photo, other];
  assert.deepEqual(checkBuildingEnvelope(source).envelope, source);
  const own = structuredClone(source);
  own.localeMode = "custom";
  own.content.media_alts = {
    [photo]: "Vista de la plaza",
    [other]: "Patio interior",
  };
  assert.deepEqual(checkBuildingEnvelope(own).errors, {});
  assert.equal(sharedBuildingValuesMatch(source, own), true);
  source.content.gallery.reverse();
  source.content.media_alts = { [photo]: "English new text" };
  const next = prepareBuildingTarget(source, own);
  assert.deepEqual(next.content.gallery, [other, photo]);
  assert.equal(
    resolveMediaAlt(
      next.content.media_alts,
      next.content.gallery[0],
      "Fallback",
    ),
    "Patio interior",
  );
  assert.equal(next.content.media_alts?.[photo], "Vista de la plaza");
});

test("editing only Building ALT takes ownership of that locale without altering shared or published values", () => {
  const source = emptyBuildingEnvelope(photo);
  source.content.cover_media_id = photo;
  source.content.media_alts = { [photo]: "English" };
  const states = Object.fromEntries(
    (["en", "es", "pt", "fr"] as const).map((locale) => [
      locale,
      {
        model: {
          locale,
          revision: 1,
          templateRevision: locale === "en" ? null : 1,
          draft: null,
          published: structuredClone(source),
          working: {
            ...structuredClone(source),
            localeMode: locale === "en" ? "custom" : "inherit",
          },
        },
        errors: {},
        notice: "",
        conflict: false,
      },
    ]),
  ) as BuildingWorkspace;
  const next = changeBuildingField(states, "es", "media_alts", {
    [photo]: "Propio",
  });
  assert.equal(next.es.model.working.localeMode, "custom");
  assert.equal(next.es.model.working.content.media_alts?.[photo], "Propio");
  assert.equal(next.es.model.published?.content.media_alts?.[photo], "English");
  assert.equal(next.en, states.en);
  assert.equal(next.pt, states.pt);
  const en = {
    ...structuredClone(source),
    content: { ...source.content, media_alts: { [photo]: "Later English" } },
  };
  assert.equal(
    prepareBuildingTarget(en, next.es.model.working).content.media_alts?.[
      photo
    ],
    "Propio",
  );
  assert.equal(
    prepareBuildingTarget(en, states.pt.model.working).content.media_alts?.[
      photo
    ],
    "Later English",
  );
});
