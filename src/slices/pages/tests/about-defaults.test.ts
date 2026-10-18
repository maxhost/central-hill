import { test } from "node:test";
import assert from "node:assert/strict";
import { aboutEditorDefaults } from "../admin/about-defaults";
import { defaultAbout } from "../schemas/about";
test("absence uses full public defaults while invalid persisted source is blocked", () => {
  const absent = aboutEditorDefaults(undefined, false);
  assert.equal(absent.sourceStatus, "absent");
  assert.equal((absent.data as typeof defaultAbout).hero.headline, defaultAbout.hero.headline);
  assert.equal(absent.sourceInvalid, false);
  assert.equal(aboutEditorDefaults({}, true).sourceInvalid, true);
  assert.equal(aboutEditorDefaults(defaultAbout, true).sourceStatus, "valid");
});
