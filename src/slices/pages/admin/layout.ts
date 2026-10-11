/**
 * Per-page **editor layout** for the page content editor (spec `home-admin-editor` → S2).
 *
 * By default the editor renders one card per root key of `data`, in schema order. A page
 * with a layout instead renders an ordered list of cards — each with a stable `id`, a title,
 * the `data` root keys it contains and an optional read-only note (+ admin link) — in the
 * order the sections appear on the public page.
 *
 * Card `id`s are **stable**: they will be the unit of the per-section "Translate with AI"
 * button of the translation arc. Never rename one.
 *
 * Safety net: any root key of `data` that no card claims is rendered at the end in an
 * "Other" card, so a field added to a schema can never disappear from the editor.
 *
 * Pure TS (no React, no Zod) so the client editor and the tests can both import it.
 */

/** Stable card ids of the Home editor, in page order. */
export const HOME_CARD_IDS = [
  "seo",
  "hero",
  "stats",
  "guests_pitch",
  "portfolio",
  "services_carousel",
  "faq",
  "dual_cta",
] as const;

export type EditorCardId = (typeof HOME_CARD_IDS)[number];

/** Id of the fallback card that collects root keys no card claims. */
export const OTHER_CARD_ID = "other";

/** A short read-only line under a card title. Keys resolve in the `pages` namespace. */
export interface EditorNote {
  textKey: string;
  link?: { href: string; labelKey: string };
}

/** An editable card: renders the listed `data` root keys. */
export interface EditorCard {
  kind: "card";
  id: EditorCardId | typeof OTHER_CARD_ID;
  titleKey: string;
  /** Root keys of `data` rendered in this card, in order. */
  paths: string[];
  note?: EditorNote;
  /** The card also hosts the social-share image (a column outside `data`). */
  hostsOgImage?: boolean;
}

/** A read-only row: something on the page that is configured elsewhere. */
export interface EditorInfo {
  kind: "info";
  id: string;
  titleKey: string;
  note: EditorNote;
}

export type EditorLayoutItem = EditorCard | EditorInfo;

const L = "admin.layout";
const link = (href: string, labelKey: string) => ({ href, labelKey: `${L}.links.${labelKey}` });

const HOME_LAYOUT: EditorLayoutItem[] = [
  { kind: "card", id: "seo", titleKey: `${L}.cards.seo`, paths: ["seo"], hostsOgImage: true },
  {
    kind: "card",
    id: "hero",
    titleKey: `${L}.cards.hero`,
    paths: ["hero"],
    note: { textKey: `${L}.notes.heroSecondary` },
  },
  {
    kind: "info",
    id: "search_bar",
    titleKey: `${L}.cards.searchBar`,
    note: { textKey: `${L}.notes.searchBar`, link: link("/admin/settings", "settings") },
  },
  {
    kind: "card",
    id: "stats",
    titleKey: `${L}.cards.stats`,
    paths: ["stats"],
    note: { textKey: `${L}.notes.stats`, link: link("/admin/settings", "settings") },
  },
  { kind: "card", id: "guests_pitch", titleKey: `${L}.cards.guests_pitch`, paths: ["guests_pitch"] },
  {
    kind: "card",
    id: "portfolio",
    titleKey: `${L}.cards.portfolio`,
    paths: ["portfolio"],
    note: { textKey: `${L}.notes.portfolio`, link: link("/admin/buildings", "buildings") },
  },
  {
    kind: "card",
    id: "services_carousel",
    titleKey: `${L}.cards.services_carousel`,
    paths: ["services_carousel"],
    note: { textKey: `${L}.notes.services`, link: link("/admin/services", "services") },
  },
  {
    kind: "card",
    id: "faq",
    titleKey: `${L}.cards.faq`,
    paths: ["faq_group_key", "faq"],
    note: { textKey: `${L}.notes.faq`, link: link("/admin/faq", "faq") },
  },
  {
    kind: "card",
    id: "dual_cta",
    titleKey: `${L}.cards.dual_cta`,
    paths: ["dual_cta"],
    note: { textKey: `${L}.notes.dualCta`, link: link("/admin/settings", "settings") },
  },
];

const LAYOUTS: Partial<Record<string, EditorLayoutItem[]>> = { home: HOME_LAYOUT };

/**
 * The layout for `pageKey`, resolved against the root keys the page schema actually has:
 * card paths that don't exist are dropped, and every root key no card claims is appended
 * in an "Other" card (schema order). Returns `null` for a page without a layout — the
 * editor then keeps its default one-card-per-root-key rendering.
 */
export function resolveEditorLayout(
  pageKey: string,
  rootKeys: readonly string[],
): EditorLayoutItem[] | null {
  const layout = LAYOUTS[pageKey];
  if (!layout) return null;
  const present = new Set(rootKeys);
  const claimed = new Set<string>();
  const items = layout.map((item): EditorLayoutItem => {
    if (item.kind !== "card") return item;
    const paths = item.paths.filter((p) => present.has(p) && !claimed.has(p));
    for (const p of paths) claimed.add(p);
    return { ...item, paths };
  });
  const other = rootKeys.filter((k) => !claimed.has(k));
  if (other.length > 0) {
    items.push({ kind: "card", id: OTHER_CARD_ID, titleKey: `${L}.cards.other`, paths: other });
  }
  return items;
}
