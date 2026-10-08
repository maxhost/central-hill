import type { GuidePriceTier } from "../contract";

/**
 * Presentation helpers for slice `guides` (pure — unit-tested in `tests/format.test.ts`). The
 * price tier is shown as the conventional €/€€/€€€ band (content brief 4.2), independent of
 * currency/settings.
 */
export function priceTierSymbol(tier: GuidePriceTier | null): string | null {
  switch (tier) {
    case "budget":
      return "€";
    case "mid":
      return "€€";
    case "premium":
      return "€€€";
    default:
      return null;
  }
}

/** A title → URL-fragment slug: ASCII, lowercase, words joined by `-` ("" when nothing is left). */
function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Stable in-page anchor ids for a guide's sections, in order — the ONE source for both the
 * section blocks' `id` and the table of contents' `#links`. Each id is the slugified title
 * ("Comporta & Arrábida" → `comporta-arrabida`), `section-<n>` (1-based) when the title has no
 * usable characters, and suffixed `-2`, `-3`… when it repeats an earlier id.
 */
export function sectionAnchorIds(titles: readonly string[]): string[] {
  const used = new Set<string>();
  return titles.map((title, i) => {
    const base = slugify(title) || `section-${i + 1}`;
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  });
}

/** Two-digit section number shown as the block eyebrow and in the TOC: 0 → "01". */
export function sectionNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/**
 * Google Maps search link for a place ("Directions →"): the coordinates when both exist, else
 * the address; null when there is neither.
 */
export function placeDirectionsUrl(place: {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}): string | null {
  if (place.latitude !== null && place.longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
  }
  const address = place.address?.trim();
  return address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;
}
