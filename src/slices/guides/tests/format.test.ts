import assert from "node:assert/strict";
import { test } from "node:test";
import { placeDirectionsUrl, priceTierSymbol, sectionAnchorIds, sectionNumber } from "../ui/format";

/**
 * Slice `guides` presentation helpers (guide detail page). Pure, no DB.
 * Run: `npx tsx --test src/slices/guides/tests/format.test.ts`.
 */

test("sectionAnchorIds: slugifies titles (accents, ampersands, punctuation)", () => {
  assert.deepEqual(
    sectionAnchorIds(["Costa da Caparica", "Carcavelos & Oeiras", "Comporta & Arrábida", "  Water Sports! "]),
    ["costa-da-caparica", "carcavelos-oeiras", "comporta-arrabida", "water-sports"],
  );
});

test("sectionAnchorIds: deduplicates repeated titles in order", () => {
  assert.deepEqual(sectionAnchorIds(["Beaches", "beaches", "Beaches", "Beaches-2"]), [
    "beaches",
    "beaches-2",
    "beaches-3",
    "beaches-2-2",
  ]);
});

test("sectionAnchorIds: falls back to section-<n> for titles with no usable characters", () => {
  assert.deepEqual(sectionAnchorIds(["", "★★★", "Sintra"]), ["section-1", "section-2", "sintra"]);
});

test("sectionAnchorIds: stable — same input, same ids", () => {
  const titles = ["Guincho", "Cascais & Estoril"];
  assert.deepEqual(sectionAnchorIds(titles), sectionAnchorIds([...titles]));
});

test("sectionNumber: two-digit, 1-based", () => {
  assert.equal(sectionNumber(0), "01");
  assert.equal(sectionNumber(8), "09");
  assert.equal(sectionNumber(11), "12");
});

test("placeDirectionsUrl: coordinates win, then address, else null", () => {
  assert.equal(
    placeDirectionsUrl({ latitude: 38.7, longitude: -9.1, address: "Rua X" }),
    "https://www.google.com/maps/search/?api=1&query=38.7,-9.1",
  );
  assert.equal(
    placeDirectionsUrl({ latitude: null, longitude: -9.1, address: "Av. Almirante Reis, 1" }),
    "https://www.google.com/maps/search/?api=1&query=Av.%20Almirante%20Reis%2C%201",
  );
  assert.equal(placeDirectionsUrl({ latitude: null, longitude: null, address: "  " }), null);
  assert.equal(placeDirectionsUrl({ latitude: null, longitude: null, address: null }), null);
});

test("placeDirectionsUrl: zero coordinates are valid", () => {
  assert.equal(
    placeDirectionsUrl({ latitude: 0, longitude: 0, address: null }),
    "https://www.google.com/maps/search/?api=1&query=0,0",
  );
});

test("priceTierSymbol", () => {
  assert.equal(priceTierSymbol("budget"), "€");
  assert.equal(priceTierSymbol("premium"), "€€€");
  assert.equal(priceTierSymbol(null), null);
});
