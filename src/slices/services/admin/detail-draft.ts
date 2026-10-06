import type { ServiceDetailContent } from "../detail";

/**
 * Editor-side model of the service `detail` sections (see `../detail`). The backoffice
 * edits a **draft** in which every optional string is a plain `string` (controlled inputs
 * never hold `undefined`), then {@link draftToDetail} turns it back into the save shape:
 * strings trimmed, and empty *optional* strings (`desc` on an option item, the pricing
 * `footnote`) **omitted** so `serviceDetailContent` accepts them. Empty *required*
 * strings are kept (trimmed to "") so validation reports them at their dotted path.
 * Pure — no React, no I/O — so it is unit-testable.
 */

export interface DraftItinerary {
  time: string;
  title: string;
  text: string;
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
    highlights: [...d.highlights],
    itinerary: d.itinerary.map((s) => ({ ...s })),
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

/** Editable draft → save payload (trimmed; empty optional strings omitted). */
export function draftToDetail(d: DetailDraft) {
  return {
    highlights: d.highlights.map(tr),
    itinerary: d.itinerary.map((s) => ({ time: tr(s.time), title: tr(s.title), text: tr(s.text) })),
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
