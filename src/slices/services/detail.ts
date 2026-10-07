/**
 * Service detail content — everything on `/services/<slug>` beyond the plain columns:
 * the fixed skeleton's copy (badges, key facts, about/included headings, booking-card note +
 * rows, good-to-know columns, highlights) and the per-service **variable module** (itinerary,
 * option groups, pricing table, extras, partners). Layout: `mock/service-detail.html`.
 *
 * Stored like the blog post body (ADR 0013): the whole object is ONE translatable field,
 * `translation(entity_type='service', field='detail')`, as portable JSON — so it rides the
 * `core/i18n` write seam and the S14 pipeline with no column and no migration. Unlike the
 * blog body it is a **fixed-shape object, not an ordered block list**: the detail template's
 * section order is designer-owned, so each section is an optional list that the page renders
 * only when non-empty. Prices inside the table/extras are free text ("€65 / person",
 * "On request") because they are display copy, not the priced `price_from` column.
 * See docs/data-model.md → Slice services.
 */
import { z } from "zod";
import { iconKey } from "@core/validation/icon-key";
import { mediaId, url } from "@core/validation/primitives";

const line = (max: number) => z.string().trim().min(1).max(max);

export const itineraryStep = z.object({
  time: line(40),
  title: line(120),
  text: line(600),
  /** Optional thumbnail (→ media_asset.id); the step shows its number when absent. */
  media_id: mediaId.optional(),
});
export type ItineraryStep = z.infer<typeof itineraryStep>;

export const optionItem = z.object({
  name: line(120),
  /** With a description the group renders as cards; without, as chips. */
  desc: line(600).optional(),
});
export type OptionItem = z.infer<typeof optionItem>;

export const optionGroup = z.object({
  title: line(120),
  items: z.array(optionItem).min(1).max(24),
});
export type OptionGroup = z.infer<typeof optionGroup>;

export const priceRow = z.object({
  label: line(120),
  cells: z.array(line(60)).min(1).max(6),
});
export type PriceRow = z.infer<typeof priceRow>;

export const priceTable = z
  .object({
    columns: z.array(line(40)).min(1).max(6),
    rows: z.array(priceRow).min(1).max(20),
    footnote: line(400).optional(),
  })
  .superRefine((t, ctx) => {
    t.rows.forEach((r, i) => {
      if (r.cells.length !== t.columns.length) {
        ctx.addIssue({
          code: "custom",
          path: ["rows", i, "cells"],
          message: `expected ${t.columns.length} cells (one per column)`,
        });
      }
    });
  });
export type PriceTable = z.infer<typeof priceTable>;

export const extraOption = z.object({
  label: line(120),
  price: line(60),
  desc: line(600),
});
export type ExtraOption = z.infer<typeof extraOption>;

export const partner = z.object({
  name: line(120),
  desc: line(600),
  cta_label: line(80),
  url,
});
export type Partner = z.infer<typeof partner>;

/** Key-fact icon picked in the admin when a fact is added (any Iconoir name, ADR 0034). */
export const DEFAULT_FACT_ICON = "clock";

/** Pre-ADR-0034 values still accepted on read and normalised (`pin` was the sprite's map pin). */
const LEGACY_FACT_ICONS: Record<string, string> = { pin: "map-pin" };

export const keyFact = z.object({
  icon: z.preprocess((v) => (typeof v === "string" && LEGACY_FACT_ICONS[v]) || v, iconKey),
  title: line(80),
  note: line(160).optional(),
});
export type KeyFact = z.infer<typeof keyFact>;

/** A label/value row of the sticky booking card (e.g. "Group" → "Private, up to 25"). */
export const bookingRow = z.object({
  label: line(40),
  value: line(80),
});
export type BookingRow = z.infer<typeof bookingRow>;

/** "Good to know", in three fixed columns. Legacy `notes` render as `practical`. */
export const goodToKnow = z.object({
  included: z.array(line(300)).max(10).default([]),
  cancellation: z.array(line(300)).max(6).default([]),
  practical: z.array(line(300)).max(10).default([]),
});
export type GoodToKnow = z.infer<typeof goodToKnow>;

export const serviceDetailContent = z.object({
  /** Up to 3 short trust tags in the title block ("Free cancellation · 24h", "Private group"). */
  badges: z.array(line(48)).max(3).default([]),
  /** Key facts row (icon + bold title + optional note), 0–4. */
  facts: z.array(keyFact).max(4).default([]),
  /** Heading of the "About" block; the page falls back to a generic heading. */
  about_title: line(120).optional(),
  /** Heading of the "What's included" block (the `highlights` list). */
  included_title: line(120).optional(),
  /** Line under the price in the booking card ("€480 total for a private group of 1–5"). */
  price_note: line(160).optional(),
  /** Label/value rows of the booking card, 0–4. */
  booking_rows: z.array(bookingRow).max(4).default([]),
  good_to_know: goodToKnow.default({ included: [], cancellation: [], practical: [] }),
  highlights: z.array(line(300)).max(12).default([]),
  itinerary: z.array(itineraryStep).max(20).default([]),
  option_groups: z.array(optionGroup).max(8).default([]),
  pricing: priceTable.nullable().default(null),
  extras: z.array(extraOption).max(12).default([]),
  partners: z.array(partner).max(8).default([]),
  notes: z.array(line(600)).max(16).default([]),
});
export type ServiceDetailContent = z.infer<typeof serviceDetailContent>;

export const EMPTY_DETAIL: ServiceDetailContent = {
  badges: [],
  facts: [],
  booking_rows: [],
  good_to_know: { included: [], cancellation: [], practical: [] },
  highlights: [],
  itinerary: [],
  option_groups: [],
  pricing: null,
  extras: [],
  partners: [],
  notes: [],
};

/** True when no section has content — the admin then clears the field instead of storing `{}`. */
export function isEmptyDetail(d: ServiceDetailContent): boolean {
  return (
    !d.badges.length &&
    !d.facts.length &&
    !d.about_title &&
    !d.included_title &&
    !d.price_note &&
    !d.booking_rows.length &&
    !d.good_to_know.included.length &&
    !d.good_to_know.cancellation.length &&
    !d.good_to_know.practical.length &&
    !d.highlights.length &&
    !d.itinerary.length &&
    !d.option_groups.length &&
    !d.pricing &&
    !d.extras.length &&
    !d.partners.length &&
    !d.notes.length
  );
}

/**
 * Parse a stored `detail` value (JSON string from the translation table). Returns `null`
 * when the value is missing, not JSON, or fails the schema — callers fall back (source
 * locale, then empty) rather than rendering a half-broken page.
 */
export function parseDetail(raw: string | undefined): ServiceDetailContent | null {
  if (!raw) return null;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = serviceDetailContent.safeParse(json);
  return parsed.success ? parsed.data : null;
}
