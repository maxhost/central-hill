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
 * "Other" card, so a field added to a schema can never disappear from the editor. A card
 * whose root keys don't exist (yet) in the schema is dropped, unless it hosts the OG image.
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

/** Stable card ids of the Owners editor, in page order (spec owners-admin-editor). */
export const OWNERS_CARD_IDS = [
  "seo",
  "hero",
  "earnings_form",
  "stats",
  "why",
  "services",
  "plans",
  "journey",
  "dashboard",
  "testimonials",
  "faq",
  "final_cta",
] as const;

/** Stable card ids of the Buildings listing editor, in page order (spec buildings-admin-editor). */
export const BUILDINGS_CARD_IDS = ["seo", "hero", "owner_panel", "stats", "calculator"] as const;

/** Stable card ids of the Real Estate editor, in page order (spec real-estate-admin-editor). */
export const REAL_ESTATE_CARD_IDS = [
  "seo",
  "hero",
  "partners",
  "capabilities",
  "asset_management",
  "deal_structures",
  "market",
  "track_record",
  "process",
  "faq",
  "deal_enquiry",
] as const;

/** Stable card ids of the Guests landing editor, in page order (spec guests-admin-editor). */
export const GUEST_CARD_IDS = [
  "seo",
  "hero",
  "welcome",
  "why",
  "portfolio",
  "services_teaser",
  "activities_teaser",
  "testimonials",
  "faq",
  "dual_cta",
] as const;

export type EditorCardId =
  | (typeof HOME_CARD_IDS)[number]
  | (typeof OWNERS_CARD_IDS)[number]
  | (typeof BUILDINGS_CARD_IDS)[number]
  | (typeof REAL_ESTATE_CARD_IDS)[number]
  | (typeof GUEST_CARD_IDS)[number];

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
    // Figures are edited here since spec S5 — no Settings link any more.
    note: { textKey: `${L}.notes.stats` },
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

/**
 * Owners (spec owners-admin-editor → "Editor: formulario sección a sección"). Some root keys
 * only arrive in later sessions (`seo`, `testimonials`, `faq`, `final_cta`); until then their
 * cards are dropped by `resolveEditorLayout` (the SEO card stays: it hosts the OG image).
 */
const OWNERS_LAYOUT: EditorLayoutItem[] = [
  {
    kind: "card",
    id: "seo",
    titleKey: `${L}.cards.seo`,
    paths: ["seo"],
    note: { textKey: `${L}.notes.seoLimits` },
    hostsOgImage: true,
  },
  {
    kind: "card",
    id: "hero",
    titleKey: `${L}.cards.hero`,
    paths: ["hero"],
    note: { textKey: `${L}.notes.headlineLines` },
  },
  {
    kind: "card",
    id: "earnings_form",
    titleKey: `${L}.cards.earnings_form`,
    paths: ["earnings_form"],
    note: { textKey: `${L}.notes.earningsForm` },
  },
  {
    kind: "card",
    id: "stats",
    titleKey: `${L}.cards.stats`,
    paths: ["stats"],
    note: { textKey: `${L}.notes.stats` },
  },
  { kind: "card", id: "why", titleKey: `${L}.cards.why`, paths: ["why"] },
  { kind: "card", id: "services", titleKey: `${L}.cards.services`, paths: ["services"] },
  {
    kind: "card",
    id: "plans",
    titleKey: `${L}.cards.plans`,
    paths: ["plans"],
    note: { textKey: `${L}.notes.plans` },
  },
  { kind: "card", id: "journey", titleKey: `${L}.cards.journey`, paths: ["journey"] },
  { kind: "card", id: "dashboard", titleKey: `${L}.cards.dashboard`, paths: ["dashboard"] },
  {
    kind: "card",
    id: "testimonials",
    titleKey: `${L}.cards.testimonials`,
    paths: ["testimonials"],
    note: { textKey: `${L}.notes.testimonials`, link: link("/admin/testimonials", "testimonials") },
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
    id: "final_cta",
    titleKey: `${L}.cards.final_cta`,
    paths: ["final_cta"],
    note: { textKey: `${L}.notes.finalCta`, link: link("/admin/settings", "settings") },
  },
];

/**
 * Buildings listing (spec buildings-admin-editor → "Editor: formulario sección a sección").
 * The building cards between the hero and the owner panel are the catalogue (info row).
 */
const BUILDINGS_LAYOUT: EditorLayoutItem[] = [
  {
    kind: "card",
    id: "seo",
    titleKey: `${L}.cards.seo`,
    paths: ["seo"],
    note: { textKey: `${L}.notes.seoLimits` },
    hostsOgImage: true,
  },
  { kind: "card", id: "hero", titleKey: `${L}.cards.hero`, paths: ["hero"] },
  {
    kind: "info",
    id: "buildings_grid",
    titleKey: `${L}.cards.buildingsGrid`,
    note: { textKey: `${L}.notes.buildingsGrid`, link: link("/admin/buildings", "buildings") },
  },
  {
    kind: "card",
    id: "owner_panel",
    titleKey: `${L}.cards.owner_panel`,
    paths: ["owner_panel"],
    note: { textKey: `${L}.notes.ownerPanel`, link: link("/admin/settings", "settings") },
  },
  {
    kind: "card",
    id: "stats",
    titleKey: `${L}.cards.stats`,
    paths: ["stats"],
    note: { textKey: `${L}.notes.stats` },
  },
  {
    kind: "card",
    id: "calculator",
    titleKey: `${L}.cards.calculator`,
    paths: ["calculator"],
    note: { textKey: `${L}.notes.earningsForm` },
  },
];

/**
 * Real Estate (spec real-estate-admin-editor → "Editor: formulario sección a sección"). Some
 * root keys arrived in later sessions (`seo` S2, `faq` S2, `deal_enquiry` S5); a card whose
 * key is missing is dropped by `resolveEditorLayout` (the SEO card stays: it hosts the OG
 * image; the FAQ card stays: it claims `faq_group_key`).
 */
const REAL_ESTATE_LAYOUT: EditorLayoutItem[] = [
  {
    kind: "card",
    id: "seo",
    titleKey: `${L}.cards.seo`,
    paths: ["seo"],
    note: { textKey: `${L}.notes.seoLimits` },
    hostsOgImage: true,
  },
  {
    kind: "card",
    id: "hero",
    titleKey: `${L}.cards.hero`,
    paths: ["hero"],
    note: { textKey: `${L}.notes.realEstateHero` },
  },
  { kind: "card", id: "partners", titleKey: `${L}.cards.partners`, paths: ["partners"] },
  { kind: "card", id: "capabilities", titleKey: `${L}.cards.capabilities`, paths: ["capabilities"] },
  {
    kind: "card",
    id: "asset_management",
    titleKey: `${L}.cards.asset_management`,
    paths: ["asset_management"],
  },
  {
    kind: "card",
    id: "deal_structures",
    titleKey: `${L}.cards.deal_structures`,
    paths: ["deal_structures"],
    note: { textKey: `${L}.notes.dealStructuresFeatured` },
  },
  { kind: "card", id: "market", titleKey: `${L}.cards.market`, paths: ["market"] },
  { kind: "card", id: "track_record", titleKey: `${L}.cards.track_record`, paths: ["track_record"] },
  {
    kind: "card",
    id: "process",
    titleKey: `${L}.cards.process`,
    paths: ["process"],
    note: { textKey: `${L}.notes.processSteps` },
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
    id: "deal_enquiry",
    titleKey: `${L}.cards.deal_enquiry`,
    paths: ["deal_enquiry"],
    note: { textKey: `${L}.notes.dealEnquiry`, link: link("/admin/settings", "settings") },
  },
];

/**
 * Guests landing (spec guests-admin-editor → "Editor: formulario sección a sección"). Every
 * card is shown since S2 added the optional `seo` (meta + the OG image), `testimonials`
 * (heading over the guest reviews) and `faq` (section title, next to `faq_group_key`) keys.
 */
const GUEST_LAYOUT: EditorLayoutItem[] = [
  {
    kind: "card",
    id: "seo",
    titleKey: `${L}.cards.seo`,
    paths: ["seo"],
    note: { textKey: `${L}.notes.seoLimits` },
    hostsOgImage: true,
  },
  {
    kind: "card",
    id: "hero",
    titleKey: `${L}.cards.hero`,
    paths: ["hero"],
    note: { textKey: `${L}.notes.ctaBuildings` },
  },
  { kind: "card", id: "welcome", titleKey: `${L}.cards.welcome`, paths: ["welcome"] },
  {
    kind: "card",
    id: "why",
    titleKey: `${L}.cards.guestWhy`,
    paths: ["why"],
    note: { textKey: `${L}.notes.ctaBuildings` },
  },
  {
    kind: "card",
    id: "portfolio",
    titleKey: `${L}.cards.portfolio`,
    paths: ["portfolio"],
    note: { textKey: `${L}.notes.guestPortfolio`, link: link("/admin/buildings", "buildings") },
  },
  {
    kind: "card",
    id: "services_teaser",
    titleKey: `${L}.cards.services_teaser`,
    paths: ["services_teaser"],
    note: { textKey: `${L}.notes.ctaServices` },
  },
  {
    kind: "card",
    id: "activities_teaser",
    titleKey: `${L}.cards.activities_teaser`,
    paths: ["activities_teaser"],
    note: { textKey: `${L}.notes.ctaGuides` },
  },
  {
    kind: "card",
    id: "testimonials",
    titleKey: `${L}.cards.testimonials`,
    paths: ["testimonials"],
    note: { textKey: `${L}.notes.guestTestimonials`, link: link("/admin/testimonials", "testimonials") },
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
    titleKey: `${L}.cards.final_cta`,
    paths: ["dual_cta"],
    note: { textKey: `${L}.notes.guestDualCta`, link: link("/admin/settings", "settings") },
  },
];

const LAYOUTS: Partial<Record<string, EditorLayoutItem[]>> = {
  home: HOME_LAYOUT,
  owners: OWNERS_LAYOUT,
  buildings: BUILDINGS_LAYOUT,
  real_estate: REAL_ESTATE_LAYOUT,
  guest: GUEST_LAYOUT,
};

/**
 * The layout for `pageKey`, resolved against the root keys the page schema actually has:
 * card paths that don't exist are dropped (a card left with no path is dropped too, unless
 * it hosts the OG image), and every root key no card claims is appended in an "Other" card
 * (schema order). Returns `null` for a page without a layout — the
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
  const items: EditorLayoutItem[] = [];
  for (const item of layout) {
    if (item.kind !== "card") {
      items.push(item);
      continue;
    }
    const paths = item.paths.filter((p) => present.has(p) && !claimed.has(p));
    for (const p of paths) claimed.add(p);
    if (paths.length === 0 && !item.hostsOgImage) continue;
    items.push({ ...item, paths });
  }
  const other = rootKeys.filter((k) => !claimed.has(k));
  if (other.length > 0) {
    items.push({ kind: "card", id: OTHER_CARD_ID, titleKey: `${L}.cards.other`, paths: other });
  }
  return items;
}
