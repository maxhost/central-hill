import assert from "node:assert/strict";
import test from "node:test";
import { citySaveInput } from "../admin/validation";
import { rawGeographyNameTranslations } from "../server/reference-names";
const valid = {
  slug: "test-city",
  name: "City",
  intro: null,
  position: 0,
  status: "published",
  country: "PT",
  hero_media_id: null,
  neighbourhoods: [{ slug: "test-nb", name: "Neighbourhood" }],
};
test("raw names isolate only target name fields without copying English", () => {
  assert.deepEqual(
    rawGeographyNameTranslations([
      { locale: "en", field: "name", value: "English" },
      { locale: "es", field: "name", value: "Pending authored" },
      { locale: "fr", field: "intro", value: "Preserve separately" },
    ]),
    { es: "Pending authored", pt: "", fr: "" },
  );
});
test("old clients omit targets; manual targets trim and retain explicit blank", () => {
  assert.equal(citySaveInput.parse(valid).translations, undefined);
  assert.deepEqual(
    citySaveInput.parse({
      ...valid,
      translations: { es: " ES ", pt: " ", fr: " FR " },
    }).translations,
    { es: "ES", pt: "", fr: "FR" },
  );
});
test("whitespace-only source names rejected for city and inline neighbourhood", () => {
  assert.equal(
    citySaveInput.safeParse({ ...valid, name: "  " }).success,
    false,
  );
  assert.equal(
    citySaveInput.safeParse({
      ...valid,
      neighbourhoods: [{ slug: "test-nb", name: "  " }],
    }).success,
    false,
  );
});
test("target length and full three-language payload validated for every row", () => {
  assert.equal(
    citySaveInput.safeParse({
      ...valid,
      translations: { es: "a".repeat(121), pt: "", fr: "" },
    }).success,
    false,
  );
  assert.equal(
    citySaveInput.safeParse({
      ...valid,
      neighbourhoods: [
        { ...valid.neighbourhoods[0], translations: { es: "ES" } },
      ],
    }).success,
    false,
  );
});
