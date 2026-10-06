import type { FactIcon, ServiceDetailContent } from "../detail";

/**
 * Editor-side model of the service `detail` sections (see `../detail`). The backoffice
 * edits a **draft** in which every optional string is a plain `string` (controlled inputs
 * never hold `undefined`), then {@link draftToDetail} turns it back into the save shape:
 * strings trimmed, and empty *optional* strings (`desc` on an option item, the pricing
 * `footnote`, a fact `note`, a step `media_id`, `about_title` / `included_title` /
 * `price_note`) **omitted** so `serviceDetailContent` accepts them. Empty *required*
 * strings are kept (trimmed to "") so validation reports them at their dotted path.
 * Pure — no React, no I/O — so it is unit-testable.
 */

export interface DraftItinerary {
  time: string;
  title: string;
  text: string;
  /** Optional step thumbnail (media_asset id); "" when none. */
  media_id: string;
}
export interface DraftFact {
  icon: FactIcon;
  title: string;
  note: string;
}
export interface DraftBookingRow {
  label: string;
  value: string;
}
export interface DraftGoodToKnow {
  included: string[];
  cancellation: string[];
  practical: string[];
}
export interface DraftOptionItem {
  name: string;
  desc: string;
}
export interface DraftOptionGroup {
  title: string;
  items: DraftOptionItem[];
}
export interface DraftPriceRow {
  label: string;
  cells: string[];
}
export interface DraftPricing {
  columns: string[];
  rows: DraftPriceRow[];
  footnote: string;
}
export interface DraftExtra {
  label: string;
  price: string;
  desc: string;
}
export interface DraftPartner {
  name: string;
  desc: string;
  cta_label: string;
  url: string;
}

export interface DetailDraft {
  badges: string[];
  facts: DraftFact[];
  about_title: string;
  included_title: string;
  price_note: string;
  booking_rows: DraftBookingRow[];
  good_to_know: DraftGoodToKnow;
  highlights: string[];
  itinerary: DraftItinerary[];
  option_groups: DraftOptionGroup[];
  pricing: DraftPricing | null;
  extras: DraftExtra[];
  partners: DraftPartner[];
  notes: string[];
}

/** Stored detail → editable draft. */
export function detailToDraft(d: ServiceDetailContent): DetailDraft {
  return {
    badges: [...d.badges],
    facts: d.facts.map((f) => ({ icon: f.icon, title: f.title, note: f.note ?? "" })),
    about_title: d.about_title ?? "",
    included_title: d.included_title ?? "",
    price_note: d.price_note ?? "",
    booking_rows: d.booking_rows.map((r) => ({ label: r.label, value: r.value })),
    good_to_know: {
      included: [...d.good_to_know.included],
      cancellation: [...d.good_to_know.cancellation],
      practical: [...d.good_to_know.practical],
    },
    highlights: [...d.highlights],
    itinerary: d.itinerary.map((s) => ({
      time: s.time,
      title: s.title,
      text: s.text,
      media_id: s.media_id ?? "",
    })),
    option_groups: d.option_groups.map((g) => ({
      title: g.title,
      items: g.items.map((it) => ({ name: it.name, desc: it.desc ?? "" })),
    })),
    pricing: d.pricing
      ? {
          columns: [...d.pricing.columns],
          rows: d.pricing.rows.map((r) => ({ label: r.label, cells: [...r.cells] })),
          footnote: d.pricing.footnote ?? "",
        }
      : null,
    extras: d.extras.map((e) => ({ ...e })),
    partners: d.partners.map((p) => ({ ...p })),
    notes: [...d.notes],
  };
}

const tr = (s: string) => s.trim();

/** `{ [key]: trimmed }` when non-blank, `{}` otherwise — for spreading optional strings. */
function opt<K extends string>(key: K, s: string): Partial<Record<K, string>> {
  const v = tr(s);
  return v ? ({ [key]: v } as Record<K, string>) : {};
}

/** Editable draft → save payload (trimmed; empty optional strings omitted). */
export function draftToDetail(d: DetailDraft) {
  return {
    badges: d.badges.map(tr),
    facts: d.facts.map((f) => ({ icon: f.icon, title: tr(f.title), ...opt("note", f.note) })),
    ...opt("about_title", d.about_title),
    ...opt("included_title", d.included_title),
    ...opt("price_note", d.price_note),
    booking_rows: d.booking_rows.map((r) => ({ label: tr(r.label), value: tr(r.value) })),
    good_to_know: {
      included: d.good_to_know.included.map(tr),
      cancellation: d.good_to_know.cancellation.map(tr),
      practical: d.good_to_know.practical.map(tr),
    },
    highlights: d.highlights.map(tr),
    itinerary: d.itinerary.map((s) => ({
      time: tr(s.time),
      title: tr(s.title),
      text: tr(s.text),
      ...opt("media_id", s.media_id),
    })),
    option_groups: d.option_groups.map((g) => ({
      title: tr(g.title),
      items: g.items.map((it) =>
        tr(it.desc) ? { name: tr(it.name), desc: tr(it.desc) } : { name: tr(it.name) },
      ),
    })),
    pricing: d.pricing
      ? {
          columns: d.pricing.columns.map(tr),
          rows: d.pricing.rows.map((r) => ({ label: tr(r.label), cells: r.cells.map(tr) })),
          ...(tr(d.pricing.footnote) ? { footnote: tr(d.pricing.footnote) } : {}),
        }
      : null,
    extras: d.extras.map((e) => ({ label: tr(e.label), price: tr(e.price), desc: tr(e.desc) })),
    partners: d.partners.map((p) => ({
      name: tr(p.name),
      desc: tr(p.desc),
      cta_label: tr(p.cta_label),
      url: tr(p.url),
    })),
    notes: d.notes.map(tr),
  };
}

// ── Immutable list helpers (shared by the editor) ─────────────────────────────
export function replaceAt<T>(arr: readonly T[], i: number, value: T): T[] {
  return arr.map((x, j) => (j === i ? value : x));
}

export function removeAt<T>(arr: readonly T[], i: number): T[] {
  return arr.filter((_, j) => j !== i);
}

/** Swap item `i` with its neighbour in direction `dir`; out-of-range is a no-op. */
export function moveAt<T>(arr: readonly T[], i: number, dir: -1 | 1): T[] {
  const target = i + dir;
  if (target < 0 || target >= arr.length) return [...arr];
  const next = [...arr];
  [next[i], next[target]] = [next[target]!, next[i]!];
  return next;
}

/**
 * Legacy `notes` → `good_to_know.practical` (the reader already shows notes as
 * "practical" when good-to-know is empty; this makes it explicit). Blank notes are
 * dropped; notes that would push `practical` past its cap stay in `notes` so nothing
 * is lost and the editor keeps showing them.
 */
export function moveNotesToPractical(d: DetailDraft): DetailDraft {
  const notes = d.notes.filter((n) => tr(n) !== "");
  const room = Math.max(0, DETAIL_LIMITS.gtk_practical - d.good_to_know.practical.length);
  return {
    ...d,
    good_to_know: {
      ...d.good_to_know,
      practical: [...d.good_to_know.practical, ...notes.slice(0, room)],
    },
    notes: notes.slice(room),
  };
}

// ── Pricing table column operations (keep one cell per column in every row) ───
export function emptyPricing(): DraftPricing {
  return { columns: [""], rows: [{ label: "", cells: [""] }], footnote: "" };
}

export function addPricingColumn(p: DraftPricing): DraftPricing {
  return {
    ...p,
    columns: [...p.columns, ""],
    rows: p.rows.map((r) => ({ ...r, cells: [...r.cells, ""] })),
  };
}

export function removePricingColumn(p: DraftPricing, i: number): DraftPricing {
  return {
    ...p,
    columns: removeAt(p.columns, i),
    rows: p.rows.map((r) => ({ ...r, cells: removeAt(r.cells, i) })),
  };
}

export function movePricingColumn(p: DraftPricing, i: number, dir: -1 | 1): DraftPricing {
  return {
    ...p,
    columns: moveAt(p.columns, i, dir),
    rows: p.rows.map((r) => ({ ...r, cells: moveAt(r.cells, i, dir) })),
  };
}

export function addPricingRow(p: DraftPricing): DraftPricing {
  return { ...p, rows: [...p.rows, { label: "", cells: p.columns.map(() => "") }] };
}

/** The schema's per-section limits, mirrored so the editor can disable "add" at the cap. */
export const DETAIL_LIMITS = {
  badges: 3,
  facts: 4,
  booking_rows: 4,
  gtk_included: 10,
  gtk_cancellation: 6,
  gtk_practical: 10,
  highlights: 12,
  itinerary: 20,
  option_groups: 8,
  option_items: 24,
  pricing_columns: 6,
  pricing_rows: 20,
  extras: 12,
  partners: 8,
  notes: 16,
} as const;
