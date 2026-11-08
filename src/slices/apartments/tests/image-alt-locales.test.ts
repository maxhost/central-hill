import assert from "node:assert/strict";
import test from "node:test";
import { resolveMediaAlt } from "@core/media/alt";
import {
  checkApartmentEnvelope,
  emptyApartmentEnvelope,
  prepareApartmentTarget,
  sharedApartmentValuesMatch,
} from "../server/editorial-validation";
import {
  changePropertyField,
  type PropertyWorkspace,
} from "../admin/ui/property-editor-state";
const photo = "d3030000-0000-4000-8000-000000000001";
const replacement = "d3030000-0000-4000-8000-000000000002";

test("Apartment optional ALT maps preserve old snapshots, own languages and image identity", () => {
  const source = emptyApartmentEnvelope();
  source.content.cover_media_id = photo;
  assert.deepEqual(checkApartmentEnvelope(source).envelope, source);
  source.content.media_alts = { [photo]: "Living room" };
  const target = prepareApartmentTarget(source, null);
  assert.equal(target.content.media_alts?.[photo], "Living room");
  target.localeMode = "custom";
  target.content.media_alts = { [photo]: "Sala de estar" };
  assert.deepEqual(checkApartmentEnvelope(target).errors, {});
  assert.equal(sharedApartmentValuesMatch(source, target), true);
  source.content.media_alts[photo] = "New English";
  assert.equal(
    prepareApartmentTarget(source, target).content.media_alts?.[photo],
    "Sala de estar",
  );
  source.content.cover_media_id = replacement;
  const replaced = prepareApartmentTarget(source, target);
  assert.equal(
    resolveMediaAlt(
      replaced.content.media_alts,
      replaced.content.cover_media_id,
      "Name fallback",
    ),
    "Name fallback",
  );
});

test("Apartment ALT change freezes only its active locale and never mutates the publication", () => {
  const source = emptyApartmentEnvelope();
  source.content.cover_media_id = photo;
  source.content.media_alts = { [photo]: "English" };
  const states = Object.fromEntries(
    (["en", "es", "pt", "fr"] as const).map((locale) => {
      const working = {
        ...structuredClone(source),
        localeMode: locale === "en" ? "custom" : "inherit",
      };
      return [
        locale,
        {
          model: {
            locale,
            revision: 1,
            templateRevision: locale === "en" ? null : 1,
            published: structuredClone(source),
            draft: null,
            working,
          },
          baseline: structuredClone(working),
          errors: {},
          notice: "",
          conflict: false,
        },
      ];
    }),
  ) as PropertyWorkspace;
  const next = changePropertyField(states, "fr", "media_alts", {
    [photo]: "Séjour",
  });
  assert.equal(next.fr.model.working.localeMode, "custom");
  assert.equal(next.fr.model.working.content.media_alts?.[photo], "Séjour");
  assert.equal(next.fr.model.published?.content.media_alts?.[photo], "English");
  assert.equal(next.en, states.en);
  assert.equal(next.pt, states.pt);
});
