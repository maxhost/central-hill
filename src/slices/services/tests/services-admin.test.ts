import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DETAIL_LIMITS,
  draftToDetail,
  detailToDraft,
  emptyPricing,
  moveNotesToPractical,
} from "../admin/detail-draft";
import { serviceCategorySaveInput, serviceSaveInput } from "../admin/validation";
import { EMPTY_DETAIL } from "../detail";

/**
 * Slice `services` backoffice (S12) — the admin **save** schemas. Pure (Zod, no DB).
 * Run: `npx tsx --test src/slices/services/tests/services-admin.test.ts`.
 */

const CAT = "11111111-1111-4111-8111-111111111111";
const COVER = "33333333-3333-4333-8333-333333333333";

function validCategory(overrides: Record<string, unknown> = {}) {
  return { slug: "transfers", icon: "car", position: 0, name: "Transfers", ...overrides };
}

function validService(overrides: Record<string, unknown> = {}) {
  return {
    slug: "airport-transfer",
    status: "draft",
    position: 0,
    category_id: CAT,
    cover_media_id: COVER,
    og_image_media_id: null,
    price_from: 4500,
    rating_tenths: 47,
    booking_type: "external",
    cta_url: "https://book.example.com/transfer",
    name: "Airport Transfer",
    excerpt: "Door-to-door from Lisbon airport.",
    body: "A private, fixed-price transfer.",
    duration_label: null,
    price_suffix: "/ person",
    cta_label: "Book now",
    meta_title: null,
    meta_description: null,
    detail: {},
    gallery: [],
    ...overrides,
  };
}

test("accepts a complete, valid category", () => {
  assert.equal(serviceCategorySaveInput.safeParse(validCategory()).success, true);
});

test("category requires an icon and a name", () => {
  assert.equal(serviceCategorySaveInput.safeParse(validCategory({ icon: "" })).success, false);
  assert.equal(serviceCategorySaveInput.safeParse(validCategory({ name: "" })).success, false);
});

test("accepts a complete, valid service", () => {
  assert.equal(serviceSaveInput.safeParse(validService()).success, true);
});

test("service requires a cover image", () => {
  const r = serviceSaveInput.safeParse(validService({ cover_media_id: null }));
  assert.equal(r.success, false);
  if (!r.success) assert.ok(r.error.issues.some((i) => i.path.join(".") === "cover_media_id"));
});

test("price_from must be a non-negative integer (cents) or null", () => {
  assert.equal(serviceSaveInput.safeParse(validService({ price_from: -1 })).success, false);
  assert.equal(serviceSaveInput.safeParse(validService({ price_from: 1.5 })).success, false);
  assert.equal(serviceSaveInput.safeParse(validService({ price_from: null })).success, true);
});

test("rating_tenths is integer tenths within 0–5, or null when unrated", () => {
  assert.equal(serviceSaveInput.safeParse(validService({ rating_tenths: null })).success, true);
  assert.equal(serviceSaveInput.safeParse(validService({ rating_tenths: 0 })).success, true);
  assert.equal(serviceSaveInput.safeParse(validService({ rating_tenths: 50 })).success, true);
  // 5.1 stars, a float, and a negative score are all out of range.
  assert.equal(serviceSaveInput.safeParse(validService({ rating_tenths: 51 })).success, false);
  assert.equal(serviceSaveInput.safeParse(validService({ rating_tenths: 4.7 })).success, false);
  assert.equal(serviceSaveInput.safeParse(validService({ rating_tenths: -1 })).success, false);
});

test("booking_type must be one of enquiry|external|none", () => {
  assert.equal(serviceSaveInput.safeParse(validService({ booking_type: "phone" })).success, false);
  assert.equal(serviceSaveInput.safeParse(validService({ booking_type: "none" })).success, true);
});

test("nullable CTA / SEO / duration accepted as null", () => {
  assert.equal(
    serviceSaveInput.safeParse(
      validService({ cta_url: null, cta_label: null, meta_title: null, duration_label: null }),
    ).success,
    true,
  );
});

test("rejects blank required [T] text (name/excerpt/body)", () => {
  assert.equal(serviceSaveInput.safeParse(validService({ name: "" })).success, false);
  assert.equal(serviceSaveInput.safeParse(validService({ excerpt: "" })).success, false);
  assert.equal(serviceSaveInput.safeParse(validService({ body: "" })).success, false);
});

// ── price_suffix + detail (phase 2: backoffice) ──────────────────────────────
const FULL_DETAIL = {
  highlights: ["Private driver", "Fixed price"],
  itinerary: [{ time: "09:00", title: "Pick-up", text: "We meet you at your apartment." }],
  option_groups: [
    { title: "Vehicles", items: [{ name: "Sedan" }, { name: "Van", desc: "Up to 7 guests." }] },
  ],
  pricing: {
    columns: ["1–3 guests", "4–7 guests"],
    rows: [
      { label: "Day", cells: ["€45", "€65"] },
      { label: "Night", cells: ["€55", "€75"] },
    ],
    footnote: "Night rate 22:00–06:00.",
  },
  extras: [{ label: "Child seat", price: "€5", desc: "Rear-facing or booster." }],
  partners: [
    { name: "Partner Co", desc: "Trusted local operator.", cta_label: "Visit", url: "https://partner.example.com" },
  ],
  notes: ["Free cancellation up to 24h before."],
};

test("price_suffix accepts null and a short string; rejects > 40 chars", () => {
  assert.equal(serviceSaveInput.safeParse(validService({ price_suffix: null })).success, true);
  assert.equal(serviceSaveInput.safeParse(validService({ price_suffix: "/ person" })).success, true);
  assert.equal(
    serviceSaveInput.safeParse(validService({ price_suffix: "x".repeat(41) })).success,
    false,
  );
});

test("accepts a full (legacy-shaped) detail object; new sections default to empty", () => {
  const r = serviceSaveInput.safeParse(validService({ detail: FULL_DETAIL }));
  assert.equal(r.success, true);
  if (r.success) assert.deepEqual(r.data.detail, { ...EMPTY_DETAIL, ...FULL_DETAIL });
});

// ── Fixed-skeleton fields (approved service-detail mock) ─────────────────────
const STEP_MEDIA = "44444444-4444-4444-8444-444444444444";

const SKELETON_DETAIL = {
  badges: ["Free cancellation · 24h", "Private group"],
  facts: [
    { icon: "clock", title: "4 hours", note: "Half-day" },
    { icon: "group", title: "Up to 25 guests" },
  ],
  about_title: "About this tour",
  included_title: "What's included",
  price_note: "€480 total for a private group of 1–5",
  booking_rows: [{ label: "Group", value: "Private, up to 25" }],
  good_to_know: {
    included: ["Hotel pick-up"],
    cancellation: ["Free up to 24h before."],
    practical: ["Wear comfortable shoes."],
  },
  highlights: ["Private guide"],
  itinerary: [
    { time: "09:00", title: "Pick-up", text: "We meet you.", media_id: STEP_MEDIA },
    { time: "10:00", title: "Alfama", text: "Walk the old town." },
  ],
  option_groups: [],
  pricing: null,
  extras: [],
  partners: [],
  notes: [],
};

test("accepts every new skeleton field and keeps it as given", () => {
  const r = serviceSaveInput.safeParse(validService({ detail: SKELETON_DETAIL }));
  assert.equal(r.success, true);
  if (r.success) assert.deepEqual(r.data.detail, SKELETON_DETAIL);
});

test("a fact with an unknown icon is rejected at its dotted path", () => {
  const detail = { ...SKELETON_DETAIL, facts: [{ icon: "rocket", title: "Fast" }] };
  const r = serviceSaveInput.safeParse(validService({ detail }));
  assert.equal(r.success, false);
  if (!r.success) assert.ok(r.error.issues.some((i) => i.path.join(".") === "detail.facts.0.icon"));
});

test("more than 3 badges, 4 facts or 4 booking rows are rejected", () => {
  const fact = { icon: "pin", title: "Lisbon" };
  const row = { label: "Group", value: "Private" };
  for (const over of [
    { badges: ["a", "b", "c", "d"] },
    { facts: [fact, fact, fact, fact, fact] },
    { booking_rows: [row, row, row, row, row] },
  ]) {
    const r = serviceSaveInput.safeParse(validService({ detail: { ...SKELETON_DETAIL, ...over } }));
    assert.equal(r.success, false, JSON.stringify(Object.keys(over)));
  }
});

test("step media_id must be a uuid", () => {
  const detail = {
    ...SKELETON_DETAIL,
    itinerary: [{ time: "09:00", title: "Pick-up", text: "We meet you.", media_id: "nope" }],
  };
  const r = serviceSaveInput.safeParse(validService({ detail }));
  assert.equal(r.success, false);
  if (!r.success) {
    assert.ok(r.error.issues.some((i) => i.path.join(".") === "detail.itinerary.0.media_id"));
  }
});

test("draft round-trips the skeleton fields and omits blank optional strings", () => {
  const draft = detailToDraft(serviceSaveInput.parse(validService({ detail: SKELETON_DETAIL })).detail);
  assert.deepEqual(draftToDetail(draft), SKELETON_DETAIL);

  const payload = draftToDetail({
    ...draft,
    about_title: "  ",
    included_title: "",
    price_note: " ",
    badges: ["  Private group  "],
    facts: [{ icon: "star", title: " Top rated ", note: "   " }],
    itinerary: [{ time: "09:00", title: "Pick-up", text: "We meet you.", media_id: "" }],
  });
  assert.equal("about_title" in payload, false);
  assert.equal("included_title" in payload, false);
  assert.equal("price_note" in payload, false);
  assert.deepEqual(payload.badges, ["Private group"]);
  assert.deepEqual(payload.facts, [{ icon: "star", title: "Top rated" }]);
  assert.equal("media_id" in payload.itinerary[0]!, false);
  assert.equal(serviceSaveInput.safeParse(validService({ detail: payload })).success, true);
});

test("moveNotesToPractical appends non-blank notes and keeps any overflow in notes", () => {
  const draft = detailToDraft(EMPTY_DETAIL);
  const moved = moveNotesToPractical({
    ...draft,
    good_to_know: { ...draft.good_to_know, practical: ["Existing"] },
    notes: ["First", "  ", "Second"],
  });
  assert.deepEqual(moved.good_to_know.practical, ["Existing", "First", "Second"]);
  assert.deepEqual(moved.notes, []);

  const full = Array.from({ length: DETAIL_LIMITS.gtk_practical - 1 }, (_, i) => `P${i}`);
  const capped = moveNotesToPractical({
    ...draft,
    good_to_know: { ...draft.good_to_know, practical: full },
    notes: ["A", "B"],
  });
  assert.equal(capped.good_to_know.practical.length, DETAIL_LIMITS.gtk_practical);
  assert.deepEqual(capped.notes, ["B"]);
});

test("rejects a pricing row with the wrong cell count, keyed by its dotted path", () => {
  const detail = {
    ...FULL_DETAIL,
    pricing: { ...FULL_DETAIL.pricing, rows: [{ label: "Day", cells: ["€45"] }] },
  };
  const r = serviceSaveInput.safeParse(validService({ detail }));
  assert.equal(r.success, false);
  if (!r.success) {
    assert.ok(r.error.issues.some((i) => i.path.join(".") === "detail.pricing.rows.0.cells"));
  }
});

test("nested detail errors carry their dotted path", () => {
  const detail = { ...FULL_DETAIL, option_groups: [{ title: "Vehicles", items: [{ name: "" }] }] };
  const r = serviceSaveInput.safeParse(validService({ detail }));
  assert.equal(r.success, false);
  if (!r.success) {
    assert.ok(r.error.issues.some((i) => i.path.join(".") === "detail.option_groups.0.items.0.name"));
  }
});

test("editor draft round-trips and omits empty optional strings", () => {
  const draft = detailToDraft(serviceSaveInput.parse(validService({ detail: FULL_DETAIL })).detail);
  assert.deepEqual(draftToDetail(draft), { ...EMPTY_DETAIL, ...FULL_DETAIL });

  // An option without a description and a blank footnote must be omitted, not sent as "".
  const pricing = emptyPricing();
  pricing.columns = ["Price"];
  pricing.rows = [{ label: "Adult", cells: ["€10"] }];
  pricing.footnote = "   ";
  const payload = draftToDetail({
    ...draft,
    option_groups: [{ title: "Pick one", items: [{ name: "A", desc: "" }] }],
    pricing,
  });
  assert.deepEqual(payload.option_groups[0]!.items[0], { name: "A" });
  assert.equal(payload.pricing && "footnote" in payload.pricing, false);
  assert.equal(serviceSaveInput.safeParse(validService({ detail: payload })).success, true);
});
