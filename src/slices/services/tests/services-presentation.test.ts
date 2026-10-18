import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_DETAIL, serviceDetailContent } from "../detail";
import {
  applyServicePresentation,
  isServiceSectionVisible,
  parseServicePresentation,
  resolveServicePriceDisplay,
  resolveServiceIcons,
  SERVICE_ICON_SLOTS,
} from "../presentation";

const full = serviceDetailContent.parse({
  ...EMPTY_DETAIL,
  highlights: ["Included"],
  itinerary: [{ time: "09:00", title: "Visit", text: "A walk" }],
  option_groups: [{ title: "Menu", items: [{ name: "Fish" }] }],
  pricing: { columns: ["Price"], rows: [{ label: "Adult", cells: ["€35"] }] },
  extras: [{ label: "Snack", price: "€5", desc: "Optional" }],
  partners: [
    {
      name: "Local",
      desc: "Store",
      cta_label: "Book",
      url: "https://example.test",
    },
  ],
});
test("legacy and all three modules remain independent; hiding preserves original content", () => {
  assert.deepEqual(applyServicePresentation(full, null), full);
  const p = {
    version: 1 as const,
    sections: { included: false, itinerary: false, pricing: false },
  };
  const rendered = applyServicePresentation(full, p);
  assert.equal(rendered.highlights.length, 0);
  assert.equal(rendered.itinerary.length, 0);
  assert.equal(rendered.option_groups.length, 1);
  assert.equal(rendered.pricing, null);
  assert.equal(rendered.extras.length, 1);
  assert.equal(full.highlights.length, 1);
  assert.deepEqual(applyServicePresentation(full, { version: 1 }), full);
});
test("neutral flags also filter an old approved target with content", () => {
  const localized = { ...full, highlights: ["Contenido aprobado anterior"] };
  assert.equal(
    isServiceSectionVisible(
      "included",
      { version: 1, sections: { included: false } },
      localized,
    ),
    false,
  );
  assert.equal(
    applyServicePresentation(localized, {
      version: 1,
      sections: { included: false },
    }).highlights.length,
    0,
  );
});
test("good to know hides legacy notes as well, with no mutation", () => {
  const original = { ...EMPTY_DETAIL, notes: ["Legacy"] };
  assert.equal(isServiceSectionVisible("good_to_know", null, original), true);
  assert.deepEqual(
    applyServicePresentation(original, {
      version: 1,
      sections: { good_to_know: false },
    }).notes,
    [],
  );
  assert.deepEqual(original.notes, ["Legacy"]);
});
test("unknown versions, sections and icon keys are rejected", () => {
  for (const v of [
    { version: 2 },
    { version: 1, sections: { random: true } },
    { version: 1, icons: { service_note: "not-an-icon-xyz" } },
  ])
    assert.equal(parseServicePresentation(v), null);
});
test("price modes distinguish zero, absent price and explicit hiding", () => {
  assert.equal(resolveServicePriceDisplay(null, 0), "from");
  assert.equal(resolveServicePriceDisplay(null, null), "on_request");
  assert.equal(
    resolveServicePriceDisplay({ version: 1, price_display: "hidden" }, 3500),
    "hidden",
  );
  assert.equal(
    resolveServicePriceDisplay(
      { version: 1, price_display: "on_request" },
      3500,
    ),
    "on_request",
  );
});
test("icon override is local and resetting inherits", () => {
  const site = Object.fromEntries(
    SERVICE_ICON_SLOTS.map((slot) => [slot, "clock"]),
  ) as Record<(typeof SERVICE_ICON_SLOTS)[number], string>;
  assert.equal(
    resolveServiceIcons({ service_note: "home-simple" }, site).service_note,
    "home-simple",
  );
  assert.equal(resolveServiceIcons(undefined, site).service_note, "clock");
  assert.equal(site.service_note, "clock");
});
