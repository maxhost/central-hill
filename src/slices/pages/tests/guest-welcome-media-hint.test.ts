import test from "node:test";
import assert from "node:assert/strict";
import { guestSchema } from "../schemas/guest";
import { describe } from "../admin/form-model";

test("Welcome upload hint describes the same fixed centred frame on mobile and desktop", () => {
  const root = describe(guestSchema);
  assert.equal(root.kind, "object");
  if (root.kind !== "object") return;
  const welcome = root.fields.find(field => field.key === "welcome")?.node;
  assert.equal(welcome?.kind, "object");
  if (welcome?.kind !== "object") return;
  const media = welcome.fields.find(field => field.key === "image_media_id")?.node;
  assert.equal(media?.kind, "media");
  if (media?.kind !== "media") return;
  assert.equal(media.accept, "animated");
  assert.match(media.hint || "", /stays 3:2 on desktop, tablet and mobile/);
  assert.match(media.hint || "", /centred cover crop/);
  assert.match(media.hint || "", /text and logos.*central safe area/);
  assert.doesNotMatch(media.hint || "", /280|540×380/);
});
