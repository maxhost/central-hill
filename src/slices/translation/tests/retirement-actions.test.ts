import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  approveField,
  resetField,
  saveField,
  clearField,
  approveEntity,
  generateEntityDrafts,
} from "../admin/actions";
import { generateDrafts } from "../server/generate";
import {
  state,
  reset,
  rejectAuthentication,
} from "./retirement-actions-mocks.mjs";

// Run with Node22: node --import ./node_modules/tsx/dist/loader.mjs
// --import ./src/slices/translation/tests/retirement-actions-runtime.mjs
// --test src/slices/translation/tests/retirement-actions.test.ts
const id = "e8770000-0000-4000-8000-000000000001";
const denied = { ok: false, error: "validation" };
const types = [
  "page_content", "blog_post", "author", "blog_category", "building",
  "apartment", "building_faq", "guide_page", "guide_section", "guide_place",
  "testimonial", "company_settings", "nav_item", "service", "service_category",
  "amenity", "city", "neighbourhood", "faq_item", "form_definition",
  "media_asset", "unknown_future_type", "",
];

const actions = {
  approveField: (type: string, entityId = id) => approveField(type, entityId, "title", "es"),
  resetField: (type: string, entityId = id) => resetField(type, entityId, "title", "es"),
  saveField: (type: string, entityId = id) => saveField(type, entityId, "title", "es", "Changed"),
  clearField: (type: string, entityId = id) => clearField(type, entityId, "title", "es"),
  approveEntity: (type: string, entityId = id) => approveEntity(type, entityId),
  generateEntityDrafts: (type: string, entityId = id) => generateEntityDrafts(type, entityId, true),
};

beforeEach(reset);

for (const [name, action] of Object.entries(actions)) {
  test(`${name} authenticates and denies every historical or future entity without side effects`, async () => {
    for (const type of types) assert.deepEqual(await action(type), denied);
    assert.equal(state.authCalls, types.length);
    assert.deepEqual(state.editorialCalls, []);
    assert.deepEqual(state.dependencyLoads, []);
  });

  test(`${name} propagates authentication failure before returning a denial`, async () => {
    const error = new Error("Unauthenticated staff request");
    rejectAuthentication(error);
    await assert.rejects(action("faq_item"), (caught) => caught === error);
    assert.equal(state.authCalls, 1);
    assert.deepEqual(state.editorialCalls, []);
  });
}

test("malformed runtime arguments cannot bypass authentication or reach editorial storage", async () => {
  const forbidden = new Proxy({}, {
    get() { throw new Error("Retired actions must not inspect their payload"); },
  });
  for (const action of [approveField, resetField, saveField, clearField, approveEntity, generateEntityDrafts]) {
    assert.deepEqual(await Reflect.apply(action, undefined, []), denied);
    assert.deepEqual(await Reflect.apply(action, undefined, [forbidden, forbidden, forbidden, forbidden, forbidden]), denied);
  }
  assert.equal(state.authCalls, 12);
  assert.deepEqual(state.editorialCalls, []);
});

test("direct generation rejects every entity and never authenticates, loads content or selects a provider", async () => {
  for (const type of types) {
    await assert.rejects(generateDrafts(type, id, { overwrite: true, locales: ["es", "pt", "fr"] }), /workflow is retired/);
  }
  const unreadOptions = new Proxy({}, {
    get() { throw new Error("The retired generator must not inspect options"); },
  });
  await assert.rejects(Reflect.apply(generateDrafts, undefined, [null, undefined, unreadOptions]), /workflow is retired/);
  assert.equal(state.authCalls, 0);
  assert.deepEqual(state.editorialCalls, []);
  assert.deepEqual(state.dependencyLoads, []);
});
