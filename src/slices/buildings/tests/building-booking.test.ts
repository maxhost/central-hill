import test from "node:test";
import assert from "node:assert/strict";
import {
  effectiveBuildingBooking,
  getBuildingBookingButton,
} from "../booking-button";
import {
  applyBuildingLocaleResult,
  applyBuildingSharedResult,
  buildingSharedContent,
  changeBuildingField,
  emptyBuildingEnvelope,
  type BuildingWorkspace,
} from "../admin/ui/property-editor-state";
import { checkBuildingEnvelope } from "../server/editorial-validation";
import { buildingLocaleModel } from "../server/editorial-model";
import type { BuildingLocaleRow } from "../server/editorial-bootstrap";

const CITY = "e7500000-0000-4000-8000-000000000010";

test("Reading legacy buttons projects the effective destination and localized default label without changing the document", () => {
  const document = emptyBuildingEnvelope(CITY);
  delete document.content.booking_button;
  document.content.default_booking_url = "https://example.test/default";
  document.content.booking_url = " https://example.test/portugues ";
  const original = structuredClone(document);
  for (const [locale, label] of [
    ["en", "Book Now"],
    ["es", "Reservar"],
    ["pt", "Reservar"],
    ["fr", "Réserver"],
  ] as const) {
    assert.deepEqual(getBuildingBookingButton(document.content, locale), {
      label,
      link: "https://example.test/portugues",
    });
  }
  assert.deepEqual(document, original);
  const validated = checkBuildingEnvelope(document).envelope;
  assert.ok(validated);
  assert.equal(Object.hasOwn(validated.content, "booking_button"), false);
  document.content.booking_url = null;
  assert.equal(effectiveBuildingBooking(document.content), "https://example.test/default");
});

test("Authored Label/Link take precedence and explicitly clearing Link never revives a legacy base", () => {
  const document = emptyBuildingEnvelope(CITY);
  assert.deepEqual(document.content.booking_button, { label: "Book Now", link: null });
  document.content.default_booking_url = "https://example.test/legacy-base";
  document.content.booking_url = "https://example.test/legacy-override";
  assert.equal(effectiveBuildingBooking(document.content), null);
  document.content.booking_button = { label: "Réserver ici", link: "https://example.test/fr" };
  assert.equal(effectiveBuildingBooking(document.content), "https://example.test/fr");
  assert.deepEqual(getBuildingBookingButton(document.content, "en"), document.content.booking_button);
  document.content.booking_button.link = "  ";
  assert.equal(effectiveBuildingBooking(document.content), null);
  document.content.booking_button.link = null;
  assert.equal(effectiveBuildingBooking(document.content), null);
  assert.equal(document.content.default_booking_url, "https://example.test/legacy-base");
});

test("Button drafts permit unfinished labels, while publication requires a label for a safe link", () => {
  const document = emptyBuildingEnvelope(CITY);
  Object.assign(document.content, {
    name: "Synthetic building",
    teaser: "Synthetic teaser",
    street_address: "Synthetic street",
    booking_button: { label: " ", link: "https://example.test/book" },
  });
  assert.deepEqual(checkBuildingEnvelope(document).errors, {});
  assert.deepEqual(Object.keys(checkBuildingEnvelope(document, true).errors), ["booking_button.label"]);
  document.content.booking_button = { label: "", link: null };
  assert.deepEqual(checkBuildingEnvelope(document, true).errors, {});
  for (const link of ["javascript:alert(1)", "data:text/html,x", "/relative", "https://example.test/" + "x".repeat(2048)]) {
    document.content.booking_button = { label: "Book", link };
    assert.equal(checkBuildingEnvelope(document).envelope, undefined);
  }
  document.content.booking_button = { label: "x".repeat(81), link: null };
  assert.equal(checkBuildingEnvelope(document).envelope, undefined);
  const unknown = structuredClone(document);
  unknown.content.booking_button = { label: "Book", link: null, extra: true } as never;
  assert.equal(checkBuildingEnvelope(unknown).envelope, undefined);
});

test("Button edits customize only their language; English refreshes inherited work and shared data does not replace customized buttons", () => {
  const source = { ...emptyBuildingEnvelope(CITY), localeMode: "custom" as const };
  source.content.booking_button = { label: "English booking", link: "https://example.test/en" };
  const rows = [{ locale: "en", revision: 1, draft: source, published: source }] as BuildingLocaleRow[];
  let workspace = Object.fromEntries(
    (["en", "es", "pt", "fr"] as const).map((locale) => [locale, {
      model: buildingLocaleModel(rows, locale, emptyBuildingEnvelope(CITY)),
      notice: "", errors: {}, conflict: false,
    }]),
  ) as BuildingWorkspace;
  assert.equal(changeBuildingField(workspace, "pt", "booking_button", structuredClone(source.content.booking_button)), workspace);
  const portuguese = { label: "Reservar em português", link: "https://example.test/pt" };
  workspace = changeBuildingField(workspace, "pt", "booking_button", portuguese);
  assert.equal(workspace.pt.model.working.localeMode, "custom");
  assert.deepEqual(workspace.en.model.working.content.booking_button, source.content.booking_button);
  const updated = structuredClone(workspace.en.model);
  updated.revision = 2;
  updated.draft!.content.booking_button = { label: "New English", link: "https://example.test/new-en" };
  updated.working = updated.draft!;
  const refreshed = applyBuildingLocaleResult(workspace, "en", updated, "Saved");
  assert.deepEqual(refreshed.es.model.working.content.booking_button, updated.working.content.booking_button);
  assert.deepEqual(refreshed.pt.model.working.content.booking_button, portuguese);
  assert.equal(refreshed.es.model.published, null);
  const common = applyBuildingSharedResult(refreshed, { street_address: "New shared address" });
  assert.deepEqual(common.pt.model.working.content.booking_button, portuguese);
  assert.equal(Object.hasOwn(buildingSharedContent(common.pt.model.working.content), "booking_button"), false);
});
