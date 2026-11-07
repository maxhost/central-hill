import test from "node:test";
import assert from "node:assert/strict";
import type {
  BuildingLocaleRow,
  BuildingIdentity,
} from "../server/editorial-bootstrap";
import { legacyBuildingEnvelope } from "../server/editorial-bootstrap";
import { buildingLocaleModel } from "../server/editorial-model";
import { deriveBuildingSharedState } from "../server/shared-content";
import { emptyBuildingEnvelope } from "../admin/ui/property-editor-state";
import type { BuildingEnvelope } from "../editorial-types";
import type { TranslationRow } from "@core/i18n";
const city = "e1100000-0000-4000-8000-000000000001";
const en = { ...emptyBuildingEnvelope(city), localeMode: "custom" as const };
en.content.name = "Saved English";
const row = (
  locale: "en" | "es" | "pt",
  value: BuildingEnvelope = en,
  revision = 1,
): BuildingLocaleRow =>
  ({ locale, revision, draft: value, published: null }) as BuildingLocaleRow;
test("Inherited working content follows the latest saved English while explicit publication remains frozen", () => {
  const previous = structuredClone(en);
  previous.content.name = "Previously saved English";
  const es = { ...previous, localeMode: "inherit" as const };
  const rows = [row("en"), { ...row("es", es), published: es }];
  const model = buildingLocaleModel(rows, "es", emptyBuildingEnvelope(city));
  assert.equal(model.working.content.name, "Saved English");
  assert.equal(model.draft?.content.name, "Previously saved English");
  assert.equal(model.published?.content.name, "Previously saved English");
});
test("Old edited snapshots remain customized even when their text happens to equal English", () => {
  const own = emptyBuildingEnvelope(city);
  own.content.name = "Saved English";
  const model = buildingLocaleModel(
    [row("en"), row("pt", own, 2)],
    "pt",
    emptyBuildingEnvelope(city),
  );
  assert.equal(model.working.localeMode, "custom");
  const changed = structuredClone(en);
  changed.content.name = "Next English";
  assert.equal(
    buildingLocaleModel(
      [row("en", changed), row("pt", own, 2)],
      "pt",
      emptyBuildingEnvelope(city),
    ).working.content.name,
    "Saved English",
  );
});
test("Legacy approved and pending evidence owns a language, while a source-only fallback inherits", () => {
  const identity = {
    city_id: city,
    position: 0,
    is_new: false,
    is_featured: false,
    neighbourhood_id: null,
    street_address: null,
    latitude: null,
    longitude: null,
    cover_media_id: null,
    og_image_media_id: null,
    avantio_id: null,
    avantio_url: null,
    booking_enabled: false,
  } as BuildingIdentity;
  const translations = [
    { locale: "en", field: "name", value: "Legacy English", state: "approved" },
    {
      locale: "pt",
      field: "name",
      value: "Português pendente",
      state: "needs_review",
    },
  ] as TranslationRow[];
  assert.equal(
    legacyBuildingEnvelope(identity, translations, [], [], [], "pt", false)
      .localeMode,
    "custom",
  );
  assert.equal(
    legacyBuildingEnvelope(identity, translations, [], [], [], "pt", true)
      .content.name,
    "Português pendente",
  );
  assert.equal(
    legacyBuildingEnvelope(identity, translations, [], [], [], "es").localeMode,
    "inherit",
  );
});
test("Shared read fallback uses published English while preserving an old pending common draft privately", () => {
  const published = structuredClone(en);
  published.content.street_address = "Public address";
  const draft = structuredClone(en);
  draft.content.street_address = "Pending address";
  const rows = [{ ...row("en", draft), published }, row("pt")];
  const shared = deriveBuildingSharedState(rows, emptyBuildingEnvelope(city));
  assert.equal(shared.content.street_address, "Public address");
  assert.equal(shared.working?.street_address, "Pending address");
  assert.equal(shared.revision, 0);
  assert.equal(Object.hasOwn(shared.content, "meta_title"), false);
});
