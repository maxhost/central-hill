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
