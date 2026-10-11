/**
 * `statFigure` ↔ display string (slice `pages`). Pure, dependency-free.
 *
 * - `formatStatFigure` is the forward mapping Owners renders today (`owners-page.tsx`):
 *   prefix + (optionally en-US grouped) `to` + suffix — "400000"+group+"+" → "400,000+",
 *   "55"+"€"+"M+" → "€55M+". Spec home-admin-editor S5 makes this the shared helper.
 * - `parseStatValue` is its inverse, used by `scripts/backfill-home-stats.ts` to turn a
 *   Settings company-stat value ("65+", "€55M+", "400,000+") into a figure row. It only
 *   returns a row whose `formatStatFigure` reproduces the input **exactly**; anything else
 *   (decimals, spaces as separators, leading zeros, no digits…) → `null`.
 * - `statFigureCells` maps figure rows to `StatBand` cells (Owners + Home), and
 *   `statBandColumns` picks the Home band's desktop column count from its row count.
 */

export interface StatFigureNumber {
  /** Count-up target, digits only. */
  to: string;
  prefix?: string;
  suffix?: string;
  /** en-US thousands separators. */
  group: boolean;
}

/** Same bounds as the `statFigure` schema (`to` ≤ 15 digits, prefix/suffix ≤ 8 chars). */
const MAX_TO = 15;
const MAX_AFFIX = 8;

export function formatStatFigure(s: StatFigureNumber): string {
  const n = s.group ? Number(s.to).toLocaleString("en-US") : s.to;
  return `${s.prefix ?? ""}${n}${s.suffix ?? ""}`;
}

/** A figure row as stored (`statFigure` in `schemas/_shared.ts`). */
export interface StatFigureRow extends StatFigureNumber {
  label: string;
}

/** Figure rows → `StatBand` cells (value via `formatStatFigure`, label as authored). */
export function statFigureCells(rows: readonly StatFigureRow[]): { value: string; label: string }[] {
  return rows.map((r) => ({ value: formatStatFigure(r), label: r.label }));
}

/**
 * Figure rows with an optional second line → `StatBand` cells (Buildings' band, spec
 * buildings-admin-editor S2): the `statFigureCells` mapping plus each row's `description`; a blank one is
 * dropped so the cell shows no empty second line.
 */
export function describedStatFigureCells(
  rows: readonly (StatFigureRow & { description?: string })[],
): { value: string; label: string; description?: string }[] {
  return rows.map((r) => ({
    value: formatStatFigure(r),
    label: r.label,
    ...(r.description?.trim() ? { description: r.description } : {}),
  }));
}

/**
 * Desktop column count for a band of `n` figures (spec S5): 1–5 → one row of N; 6 → 3 (3×2);
 * 7–8 → 4 (two rows). Mobile is always 2-up (`StatBand`). `n` ≤ 0 never renders a band; it
 * maps to 1 only to keep the return type total.
 */
export function statBandColumns(n: number): 1 | 2 | 3 | 4 | 5 {
  if (n <= 1) return 1;
  if (n === 2 || n === 3 || n === 4 || n === 5) return n;
  if (n === 6) return 3;
  return 4;
}

/** prefix (no digits) · number (plain, or 1–3 digits + `,ddd` groups) · suffix (no digits). */
const VALUE_RE = /^(\D*?)(\d{1,3}(?:,\d{3})+|\d+)(\D*)$/;

export function parseStatValue(value: string): Required<StatFigureNumber> | null {
  const m = VALUE_RE.exec(value);
  if (!m) return null;
  const [, prefix = "", num = "", suffix = ""] = m;
  const group = num.includes(",");
  const row = { to: num.replace(/,/g, ""), prefix, suffix, group };
  // A leading zero would survive the static text but not the count-up (`Number(data-to)`).
  if (/^0\d/.test(row.to)) return null;
  if (row.to.length > MAX_TO || prefix.length > MAX_AFFIX || suffix.length > MAX_AFFIX) return null;
  return formatStatFigure(row) === value ? row : null;
}
