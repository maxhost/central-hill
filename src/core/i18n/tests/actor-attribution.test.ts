import assert from "node:assert/strict";
import { test } from "node:test";
import { translationActorAttribution } from "../actor-attribution";

test("text auth actor is preserved verbatim instead of rejected or converted to a fictional UUID", () => {
  assert.deepEqual(translationActorAttribution("staff-textual-id"), {
    updated_by: null,
    updated_by_user_id: "staff-textual-id",
  });
});
test("UUID auth actor retains legacy attribution as well", () => {
  const id = "55555555-5555-4555-8555-555555555558";
  assert.deepEqual(translationActorAttribution(id), {
    updated_by: id,
    updated_by_user_id: id,
  });
});
test("unattributed system writes remain explicitly null", () => {
  assert.deepEqual(translationActorAttribution(), {
    updated_by: null,
    updated_by_user_id: null,
  });
});
