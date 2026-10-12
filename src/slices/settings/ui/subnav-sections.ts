/**
 * Real Estate header sub-tabs (spec `docs/specs/real-estate-admin-editor.md`, S6). Same
 * hover-reveal treatment as the Owners sub-nav in `site-header.tsx` — hardcoded rather than read
 * from the DB nav sub-tabs. Labels are i18n keys `settings.subnav.realEstate.<key>` (4 locales);
 * hrefs map to the section anchors on the real-estate page — kept in sync with
 * `slices/pages/ui/real-estate-page.tsx` (section ids: top, partners, capabilities, manage,
 * deal-structures, market, track-record, process, faq, deal-enquiry).
 *
 * Kept in its own module (no server imports) so tests can check it against `messages/*.json`.
 */
export const REAL_ESTATE_SECTIONS = [
  { key: "top", href: "/real-estate#top" },
  { key: "partners", href: "/real-estate#partners" },
  { key: "capabilities", href: "/real-estate#capabilities" },
  { key: "manage", href: "/real-estate#manage" },
  { key: "dealStructures", href: "/real-estate#deal-structures" },
  { key: "market", href: "/real-estate#market" },
  { key: "trackRecord", href: "/real-estate#track-record" },
  { key: "process", href: "/real-estate#process" },
  { key: "faq", href: "/real-estate#faq" },
  { key: "dealEnquiry", href: "/real-estate#deal-enquiry" },
] as const satisfies ReadonlyArray<{ key: string; href: string }>;
