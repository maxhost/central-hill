import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAbout, aboutTranslationField } from "../about-content";
import { defaultAbout } from "../schemas/about";
import { translatablePathsByPage } from "../schemas";
import { overlayTranslations } from "../server/overlay";
test("approved legacy targets follow stable identity across paragraph moves and clears", () => {
  const c = normalizeAbout(defaultAbout);
  c.story.narrative.reverse(); c._list_ids!["story.narrative"]!.reverse();
  const translated = overlayTranslations(c, translatablePathsByPage.about, path => ({ "block:story.narrative.0": "ES A", "block:story.narrative.2": "ES C" })[aboutTranslationField(c, path) as "block:story.narrative.0"]);
  assert.deepEqual((translated as typeof c).story.narrative, ["ES C", defaultAbout.story.narrative[1], "ES A"]);
  const cleared = overlayTranslations(c, translatablePathsByPage.about, () => undefined) as typeof c;
  assert.equal(cleared.story.narrative[2], defaultAbout.story.narrative[0]);
});
