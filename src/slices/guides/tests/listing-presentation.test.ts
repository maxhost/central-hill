import assert from "node:assert/strict";
import { test } from "node:test";
import { buildListingCities, guideCityHeadline, initialListingCity, listingCopy, selectListingCity } from "../ui/listing-presentation";

const lisbon = { id: "city-uuid-1", slug: "lisboa", name: "Lisboa" };
const porto = { id: "city-uuid-2", slug: "porto-localized", name: "Porto localisé" };
const cascais = { id: "city-uuid-3", slug: "cascais-localized", name: "Cascais localisé" };
const labels = { porto: "Oporto", cascais: "Cascais" };

test("legacy placeholders are upcoming and cannot become selected", () => {
  const choices = buildListingCities([lisbon], [{ ...lisbon, slug: "lisbon" }], [lisbon.id], labels);
  assert.deepEqual(choices.map((city) => [city.key, city.available]), [[lisbon.id, true], ["placeholder:porto", false], ["placeholder:cascais", false]]);
  assert.equal(initialListingCity(choices), lisbon.id);
  assert.equal(selectListingCity(lisbon.id, "placeholder:porto", choices), lisbon.id);
  assert.equal(selectListingCity(lisbon.id, "missing", choices), lisbon.id);
});

test("localized slugs and names join actual cities by UUID with source aliases", () => {
  for (const alias of ["porto", "oporto"]) {
    const choices = buildListingCities([lisbon, porto, cascais], [{ ...lisbon, slug: "lisbon" }, { ...porto, slug: alias }, { ...cascais, slug: "cascais" }], [porto.id], labels);
    assert.equal(choices.length, 3);
    assert.equal(choices[1]?.label, porto.name);
    assert.equal(initialListingCity(choices), porto.id);
    assert.equal(selectListingCity(null, lisbon.id, choices), null);
    assert.equal(selectListingCity(null, porto.id, choices), porto.id);
  }
});

test("a real upcoming city suppresses its placeholder but remains unselectable", () => {
  const choices = buildListingCities([porto], [{ ...porto, slug: "porto" }], [], labels);
  assert.deepEqual(choices.map((city) => city.key), [porto.id, "placeholder:cascais"]);
  assert.equal(initialListingCity(choices), null);
  assert.equal(selectListingCity(null, porto.id, choices), null);
});

test("source aliases for unpublished cities do not suppress visible placeholders", () => {
  const choices = buildListingCities([lisbon], [{ ...porto, slug: "porto" }], [lisbon.id], labels);
  assert.ok(choices.some((city) => city.key === "placeholder:porto"));
});

test("both available city selections use identity, regardless of duplicated names", () => {
  const choices = buildListingCities([lisbon, { ...porto, name: lisbon.name }], [{ ...porto, slug: "porto" }], [lisbon.id, porto.id], labels);
  assert.equal(initialListingCity(choices), lisbon.id);
  assert.equal(selectListingCity(lisbon.id, porto.id, choices), porto.id);
});

test("headlines replace literal tokens safely and invalid templates fallback", () => {
  assert.equal(guideCityHeadline("Guías de {city}, {city}", "<Lisboa>$&", "Fallback"), "Guías de <Lisboa>$&, <Lisboa>$&");
  for (const value of [undefined, "", "  ", "Guías", "{city} {other}", "{city}}", "{city} {"]) {
    assert.equal(guideCityHeadline(value, "Lisboa", "Localized fallback"), "Localized fallback");
  }
  assert.equal(listingCopy(" ", "Fallback"), "Fallback");
  assert.equal(listingCopy("Own copy", "Fallback"), "Own copy");
});
