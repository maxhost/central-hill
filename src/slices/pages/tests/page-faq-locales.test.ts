import assert from "node:assert/strict";
import { test } from "node:test";
import { translatablePaths } from "@core/validation/primitives";
import { getEditorialAdapter } from "../server/editorial-adapters";
import type { EditorialPageKey, PageEnvelope } from "../editorial-types";
import {
  prepareTargetEnvelope,
  sameEditorialSnapshot,
  sharedEnvelope,
} from "../editorial-content";
import { homeAt, homeSet } from "../home-content";
import { editorialTextPaths } from "../editorial-identities";

const faqPages = ["home", "owners", "real_estate", "guest", "about"] as const;
function envelope<K extends EditorialPageKey>(key: K): PageEnvelope<K> {
  return {
    schemaVersion: 1,
    content: getEditorialAdapter(key).defaultContent(),
    ogImageMediaId: null,
  };
}

for (const key of faqPages) {
  test(`${key}: FAQ references are per-locale values, never translated prose or inherited EN`, () => {
    const adapter = getEditorialAdapter(key);
    const descriptor = adapter.descriptor;
    assert.deepEqual(descriptor.localeReferencePaths, ["faq_group_key"]);
    assert.equal(
      translatablePaths(adapter.publishSchema).includes("faq_group_key"),
      false,
    );
    const en = envelope(key);
    homeSet(en.content, "faq_group_key", "buying-en", true);
    const before = structuredClone(en);
    assert.equal(
      homeAt(
        prepareTargetEnvelope(en, null, descriptor).content,
        "faq_group_key",
      ),
      undefined,
    );
    for (const choice of ["buying-es", "", undefined]) {
      const target = structuredClone(en);
      homeSet(target.content, "faq_group_key", choice, true);
      const ownCopy = editorialTextPaths(target.content, descriptor).find(
        (path) => typeof homeAt(target.content, path) === "string",
      );
      assert.ok(ownCopy);
      homeSet(target.content, ownCopy, "Own localized copy", true);
      const prepared = prepareTargetEnvelope(en, target, descriptor);
      assert.equal(homeAt(prepared.content, "faq_group_key"), choice);
      assert.equal(homeAt(prepared.content, ownCopy), "Own localized copy");
      homeSet(en.content, "faq_group_key", "different-en", true);
      assert.equal(
        homeAt(
          prepareTargetEnvelope(en, prepared, descriptor).content,
          "faq_group_key",
        ),
        choice,
      );
      assert.equal(
        sharedEnvelope(target, descriptor),
        sharedEnvelope(en, descriptor),
      );
      const changedMedia = structuredClone(target);
      changedMedia.ogImageMediaId = "e8100000-0000-4000-8000-000000000099";
      assert.notEqual(
        sharedEnvelope(changedMedia, descriptor),
        sharedEnvelope(en, descriptor),
      );
    }
    assert.equal(homeAt(before.content, "faq_group_key"), "buying-en");
  });
}

test("Home default helper metadata preserves a missing legacy FAQ field without false dirty", () => {
  const en = envelope("home");
  homeSet(en.content, "faq_group_key", "english-choice", true);
  const published = structuredClone(en);
  Reflect.deleteProperty(published.content, "faq_group_key");
  const prepared = prepareTargetEnvelope(en, published);
  assert.equal(homeAt(prepared.content, "faq_group_key"), undefined);
  assert.equal(sameEditorialSnapshot(prepared, published), true);
  assert.equal(
    homeAt(prepareTargetEnvelope(en, null).content, "faq_group_key"),
    undefined,
  );
});

test("Pages without FAQ keep their current descriptor and shared-reference policy", () => {
  for (const key of ["buildings", "services", "guides", "blog"] as const) {
    const adapter = getEditorialAdapter(key);
    assert.deepEqual(adapter.descriptor.localeReferencePaths ?? [], []);
    const en = envelope(key);
    assert.equal(Object.hasOwn(en.content, "faq_group_key"), false);
    assert.equal(
      Object.hasOwn(
        prepareTargetEnvelope(en, null, adapter.descriptor).content,
        "faq_group_key",
      ),
      false,
    );
    const target = structuredClone(en);
    target.ogImageMediaId = "e8100000-0000-4000-8000-000000000098";
    assert.notEqual(
      sharedEnvelope(en, adapter.descriptor),
      sharedEnvelope(target, adapter.descriptor),
    );
  }
});
