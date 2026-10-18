import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizedRecommendationScope, recommendationScopeKey } from "../server/recommendation-scope";

test("recommendation cache separates global and empty, canonicalizes city scope", () => {
  assert.equal(recommendationScopeKey(), "global");
  assert.equal(recommendationScopeKey({ cityIds: [] }), "[]");
  assert.deepEqual(normalizedRecommendationScope({ cityIds: ["b", "a", "a"] }), ["a", "b"]);
  assert.equal(recommendationScopeKey({ cityIds: ["b", "a"] }), recommendationScopeKey({ cityIds: ["a", "b"] }));
});
