import assert from "node:assert/strict";
import { test } from "node:test";
import type { CityEditData } from "../admin/queries";
import { citySaveInput } from "../admin/validation";
import {
  adoptNeighbourhoodIds,
  cityFormValues,
  cityNamePayload,
  nameFormTranslations,
} from "../admin/ui/name-locale-payload";

const CITY_ID = "11111111-1111-4111-8111-111111111111";
const NB_ID = "22222222-2222-4222-8222-222222222222";
const NEW_NB_ID = "33333333-3333-4333-8333-333333333333";
const blankTargets = { es: "", pt: "", fr: "" };

function existingCity(): CityEditData {
  return {
    id: CITY_ID,
    name: "Lisbon",
    slug: "lisbon",
    position: 2,
    status: "published",
    country: "PT",
    hero_media_id: null,
    intro: "Existing English intro",
    neighbourhoods: [{ id: NB_ID, slug: "alfama", name: "Alfama" }],
  };
}

test("new and legacy forms leave every missing target blank, without EN copies", () => {
  assert.deepEqual(cityFormValues(null).translations, blankTargets);
  const state = cityFormValues(existingCity());
  assert.equal(state.name, "Lisbon");
  assert.deepEqual(state.translations, blankTargets);
  assert.deepEqual(state.neighbourhoods[0]?.translations, blankTargets);
  assert.deepEqual(nameFormTranslations({ es: "Lisboa" }), {
    es: "Lisboa",
    pt: "",
    fr: "",
  });
});

test("raw authored targets load unchanged and do not share mutable maps with initial data", () => {
  const initial = existingCity();
  initial.translations = { es: "  Lisboa pendiente  ", pt: "Lisboa", fr: "" };
  initial.neighbourhoods[0]!.translations = {
    es: "Alfama ES",
    pt: "",
    fr: "  ",
  };
  const state = cityFormValues(initial);
  assert.deepEqual(state.translations, initial.translations);
  assert.deepEqual(
    state.neighbourhoods[0]?.translations,
    initial.neighbourhoods[0]?.translations,
  );
  state.translations.es = "Nuevo";
  state.neighbourhoods[0]!.translations.es = "Nuevo barrio";
  assert.equal(initial.translations.es, "  Lisboa pendiente  ");
  assert.equal(initial.neighbourhoods[0]!.translations.es, "Alfama ES");
});

test("one payload trims full city and neighbourhood names and retains shared fields", () => {
  const state = cityFormValues(existingCity());
  state.name = " Lisbon renamed ";
  state.translations = { es: " Lisboa ES ", pt: "  ", fr: " Lisbonne " };
  state.slug = " lisbon ";
  state.position = "3";
  state.country = " pt ";
  state.intro = " Existing English intro ";
  state.neighbourhoods[0]!.name = " Alfama renamed ";
  state.neighbourhoods[0]!.translations = {
    es: " Alfama ES ",
    pt: " ",
    fr: "Alfama FR",
  };
  const payload = cityNamePayload(state, CITY_ID);
  assert.deepEqual(payload, {
    id: CITY_ID,
    name: "Lisbon renamed",
    slug: "lisbon",
    position: 3,
    country: "PT",
    status: "published",
    hero_media_id: null,
    intro: "Existing English intro",
    translations: { es: "Lisboa ES", pt: "", fr: "Lisbonne" },
    neighbourhoods: [
      {
        id: NB_ID,
        name: "Alfama renamed",
        slug: "alfama",
        translations: { es: "Alfama ES", pt: "", fr: "Alfama FR" },
      },
    ],
  });
  assert.equal(citySaveInput.safeParse(payload).success, true);
  assert.equal(state.translations.pt, "  ");
});

test("blank target clears are explicit, while empty intro and media keep existing null semantics", () => {
  const state = cityFormValues(existingCity());
  state.intro = "  ";
  state.position = "";
  state.translations.es = "   ";
  const payload = cityNamePayload(state);
  assert.deepEqual(payload.translations, blankTargets);
  assert.deepEqual(payload.neighbourhoods[0]?.translations, blankTargets);
  assert.equal(payload.intro, null);
  assert.equal(payload.hero_media_id, null);
  assert.equal(payload.position, 0);
});

test("EN whitespace is rejected at the correct city and neighbourhood paths", () => {
  const state = cityFormValues(existingCity());
  state.name = "   ";
  state.neighbourhoods[0]!.name = "  ";
  const result = citySaveInput.safeParse(cityNamePayload(state, CITY_ID));
  assert.equal(result.success, false);
  if (!result.success) {
    assert.deepEqual(
      [...new Set(result.error.issues.map((issue) => issue.path.join(".")))],
      ["name", "neighbourhoods.0.name"],
    );
  }
});

test("city and neighbourhood target limits report indexed paths and accept 120 chars", () => {
  const state = cityFormValues(existingCity());
  state.translations.es = "x".repeat(121);
  state.neighbourhoods[0]!.translations.fr = "y".repeat(121);
  const result = citySaveInput.safeParse(cityNamePayload(state));
  assert.equal(result.success, false);
  if (!result.success) {
    assert.deepEqual(
      result.error.issues.map((issue) => issue.path.join(".")),
      ["translations.es", "neighbourhoods.0.translations.fr"],
    );
  }
  state.translations.es = "x".repeat(120);
  state.neighbourhoods[0]!.translations.fr = "y".repeat(120);
  assert.equal(citySaveInput.safeParse(cityNamePayload(state)).success, true);
});

test("reordered and removed neighbourhoods retain their own targets and identities", () => {
  const state = cityFormValues(existingCity());
  const oldRow = state.neighbourhoods[0]!;
  oldRow.translations.es = "Alfama ES";
  const newRow = {
    clientKey: "new-row",
    slug: "belem",
    name: "Belém",
    translations: { es: "Belén", pt: "Belém", fr: "" },
  };
  state.neighbourhoods = [newRow, oldRow];
  const reordered = cityNamePayload(state).neighbourhoods;
  assert.equal(reordered[0]?.id, undefined);
  assert.equal(reordered[0]?.translations?.es, "Belén");
  assert.equal(reordered[1]?.id, NB_ID);
  assert.equal(reordered[1]?.translations?.es, "Alfama ES");
  assert.equal("clientKey" in reordered[0]!, false);
  state.neighbourhoods = state.neighbourhoods.filter(
    (row) => row.clientKey !== oldRow.clientKey,
  );
  assert.deepEqual(cityNamePayload(state).neighbourhoods, [reordered[0]]);
});

test("successful Save adopts returned IDs in row order for a second Save without changing client keys", () => {
  const state = cityFormValues(existingCity());
  state.neighbourhoods.unshift({
    clientKey: "new-row",
    slug: "belem",
    name: "Belém",
    translations: { es: "Belén", pt: "", fr: "" },
  });
  const adopted = adoptNeighbourhoodIds(state, [NEW_NB_ID, NB_ID]);
  assert.equal(state.neighbourhoods[0]?.id, undefined);
  assert.equal(adopted.neighbourhoods[0]?.clientKey, "new-row");
  assert.equal(adopted.neighbourhoods[0]?.translations.es, "Belén");
  assert.deepEqual(
    cityNamePayload(adopted).neighbourhoods.map((row) => row.id),
    [NEW_NB_ID, NB_ID],
  );
  assert.equal(citySaveInput.safeParse(cityNamePayload(adopted)).success, true);
});

test("older successful responses or incomplete ID arrays do not erase row identities", () => {
  const state = cityFormValues(existingCity());
  assert.equal(adoptNeighbourhoodIds(state), state);
  assert.equal(adoptNeighbourhoodIds(state, []), state);
});
