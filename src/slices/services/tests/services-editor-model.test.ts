import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_DETAIL } from "../detail";
import { applyServicePresentation } from "../presentation";
import {
  serviceSaveInput,
  servicePresentationErrors,
} from "../admin/validation";
import {
  eurosToCents,
  centsToEuros,
  initialState,
  buildPayload,
  setSectionChoice,
  discardSection,
  sectionCount,
  guardMessageKey,
} from "../admin/form-model";
import type { ServiceEditData } from "../admin/queries";

const original: ServiceEditData = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "transfer",
  status: "published",
  position: 2,
  category_id: "22222222-2222-4222-8222-222222222222",
  cover_media_id: "33333333-3333-4333-8333-333333333333",
  og_image_media_id: null,
  price_from: 3550,
  rating_tenths: 47,
  booking_type: "enquiry",
  cta_url: null,
  name: "Private transfer",
  excerpt: "Meet your driver",
  body: "A private airport transfer.",
  duration_label: null,
  price_suffix: "/ car",
  cta_label: "Request a transfer",
  meta_title: null,
  meta_description: null,
  detail: {
    ...EMPTY_DETAIL,
    included_title: "Included in your transfer",
    highlights: ["Meet and greet"],
    itinerary: [
      {
        time: "09:00",
        title: "Meet your driver",
        text: "At arrivals.",
        media_id: "44444444-4444-4444-8444-444444444444",
      },
    ],
    notes: ["Legacy practical note"],
    pricing: {
      columns: ["Price"],
      rows: [{ label: "Airport", cells: ["35.50 €"] }],
    },
  },
  gallery: [],
  presentation: null,
  copy: {},
  integrity: { detail: "valid", presentation: "missing" },
};

test("cover plus gallery selections preserve mosaic order and all extra photos through save/reload models", () => {
  const gallery = [1, 2, 3, 4, 5].map((n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`);
  const state = initialState({ ...original, gallery }, "");
  const parsed = serviceSaveInput.parse(buildPayload(state, original.id));
  assert.equal(parsed.cover_media_id, original.cover_media_id);
  assert.deepEqual(parsed.gallery, gallery);
  const reloaded = initialState({ ...original, gallery: parsed.gallery, cover_media_id: parsed.cover_media_id }, "");
  assert.deepEqual(reloaded.gallery, gallery);
  reloaded.gallery.reverse();
  assert.deepEqual(buildPayload(reloaded, original.id).gallery, [...gallery].reverse());
  assert.equal(serviceSaveInput.safeParse(buildPayload(initialState(original, ""), original.id)).success, true,
    "legacy one-photo services can still be saved without requiring more images");
});

test("exact EUR conversion accepts comma, point, cents and zero; enforces PostgreSQL bound", () => {
  for (const [input, expected] of [
    ["35,50", 3550],
    ["35.50", 3550],
    ["0", 0],
    ["0.01", 1],
    [" 12.3 ", 1230],
    ["21474836.47", 2147483647],
  ] as const)
    assert.equal(eurosToCents(input), expected);
  assert.equal(eurosToCents("   "), null);
  for (const input of [
    "35.500",
    "1e3",
    "-1",
    "+2",
    "1,234.56",
    "NaN",
    "Infinity",
    "21474836.48",
    "3.",
    ".50",
  ])
    assert.throws(() => eurosToCents(input), /invalidEuros/, input);
  for (const cents of [0, 1, 3550, 2147483647])
    assert.equal(eurosToCents(centsToEuros(cents)), cents);
});

test("open/save does not materialize flags, copy overrides or change legacy decimal prices", () => {
  const state = initialState(original, "");
  assert.equal(state.price_from, "35.50");
  const payload = buildPayload(state, original.id);
  assert.equal(payload.price_from, original.price_from);
  assert.equal(payload.presentation, null);
  assert.deepEqual(payload.copy, {});
  assert.deepEqual(payload.detail.highlights, original.detail.highlights);
  assert.equal(serviceSaveInput.safeParse(payload).success, true);
  assert.equal(original.presentation, null);
});

test("visibility edits are independent and automatic reset preserves icons and price mode", () => {
  let presentation = setSectionChoice(
    { version: 1, price_display: "hidden", icons: { service_badge: "star" } },
    "included",
    false,
  );
  presentation = setSectionChoice(presentation, "itinerary", true);
  assert.deepEqual(presentation?.sections, {
    included: false,
    itinerary: true,
  });
  presentation = setSectionChoice(presentation, "included", undefined);
  assert.deepEqual(presentation?.sections, { itinerary: true });
  assert.equal(presentation?.price_display, "hidden");
  assert.equal(presentation?.icons?.service_badge, "star");
  assert.equal(
    setSectionChoice(
      setSectionChoice(null, "options", true),
      "options",
      undefined,
    ),
    null,
  );
});

test("hide/save/reactivate preserves full section content and headings for the backend", () => {
  const state = initialState(original, "");
  state.presentation = setSectionChoice(state.presentation, "included", false);
  const hidden = buildPayload(state, original.id);
  assert.deepEqual(hidden.detail.highlights, ["Meet and greet"]);
  assert.equal(hidden.detail.included_title, original.detail.included_title);
  const persisted = serviceSaveInput.parse(hidden);
  assert.deepEqual(
    applyServicePresentation(persisted.detail, persisted.presentation)
      .highlights,
    [],
  );
  const reactivated = setSectionChoice(
    persisted.presentation ?? null,
    "included",
    true,
  );
  assert.deepEqual(
    applyServicePresentation(persisted.detail, reactivated).highlights,
    ["Meet and greet"],
  );
});

test("discard restores only section content/headings and images; keeps chosen visibility and other edits", () => {
  const saved = initialState(original, "");
  const edited = structuredClone(saved);
  edited.detail.itinerary[0]!.media_id = "55555555-5555-4555-8555-555555555555";
  edited.detail.itinerary[0]!.title = "";
  edited.copy.itineraryTitle = "Edited heading";
  edited.copy.relatedTitle = "Keep this heading";
  edited.presentation = setSectionChoice(null, "itinerary", false);
  edited.name = "Keep general name";
  edited.gallery = ["66666666-6666-4666-8666-666666666666"];
  const restored = discardSection(edited, saved, "itinerary");
  assert.deepEqual(restored.detail.itinerary, saved.detail.itinerary);
  assert.equal(restored.copy.itineraryTitle, undefined);
  assert.equal(restored.copy.relatedTitle, "Keep this heading");
  assert.equal(restored.presentation?.sections?.itinerary, false);
  assert.equal(restored.name, "Keep general name");
  assert.deepEqual(restored.gallery, edited.gallery);
  assert.equal(edited.detail.itinerary[0]!.title, "");
});

test("hidden incomplete rows remain validation errors until explicitly discarded", () => {
  const saved = initialState(original, "");
  const edited = structuredClone(saved);
  edited.detail.highlights = [""];
  edited.presentation = setSectionChoice(null, "included", false);
  assert.equal(
    serviceSaveInput.safeParse(buildPayload(edited, original.id)).success,
    false,
  );
  const restored = discardSection(edited, saved, "included");
  assert.equal(
    serviceSaveInput.safeParse(buildPayload(restored, original.id)).success,
    true,
  );
  assert.equal(restored.presentation?.sections?.included, false);
});

test("price presentation and table stay independent; hidden mode retains exact amount and note", () => {
  const state = initialState(original, "");
  state.presentation = {
    version: 1,
    price_display: "hidden",
    sections: { pricing: true },
  };
  state.detail.price_note = "Per private group";
  const payload = buildPayload(state, original.id);
  assert.equal(payload.price_from, 3550);
  assert.equal(payload.detail.price_note, "Per private group");
  assert.equal(payload.detail.pricing?.rows[0]?.cells[0], "35.50 €");
  assert.deepEqual(
    servicePresentationErrors(
      serviceSaveInput.parse(payload),
      payload.presentation,
    ),
    {},
  );
  state.price_from = "";
  state.presentation.price_display = "from";
  assert.equal(
    servicePresentationErrors(
      serviceSaveInput.parse(buildPayload(state, original.id)),
      state.presentation,
    ).price_from,
    "Enter a starting price.",
  );
});

test("legacy notes count toward automatic good-to-know without implicit migration", () => {
  const state = initialState(original, "");
  assert.equal(sectionCount("good_to_know", state.detail), 1);
  assert.deepEqual(buildPayload(state, original.id).detail.notes, [
    "Legacy practical note",
  ]);
  assert.deepEqual(state.detail.good_to_know.practical, []);
});

test("guard messages map to localized admin labels without hiding unknown validation details", () => {
  assert.equal(
    guardMessageKey(
      "detail.pricing",
      "Add content before showing this section.",
    ),
    "emptySection",
  );
  assert.equal(
    guardMessageKey("cta_url", "Enter an http(s) booking URL."),
    "externalUrl",
  );
  assert.equal(
    guardMessageKey("copy.enquiryTitle", "Invalid placeholder"),
    "copyInvalid",
  );
  assert.equal(
    guardMessageKey(
      "name",
      "Too small: expected string to have >=1 characters",
    ),
    null,
  );
});
