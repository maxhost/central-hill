# ADR0074 — Fixed multilingual public navigation

2026-11-07. User requests fixed navigation: no label/URL/order editing. Translate
Owners/About submenus EN/ES/PT/FR, retain current links/order and all existing
RealEstate/Guests translations. Fixed header/footer share canonical code trees;
getNav API remains but resolves messages, never nav_item or translation rows.
Stable synthetic IDs, new fixed-v1 cache key. No schema/backfill/data deletion.

Remove Navigation sidebar/editor. Old gated /admin/navigation and nav_item review
URLs redirect to /admin/settings; saveNavigation rejects after auth. Generic
Translation excludes nav_item from inbox/review/actions/bulk/generation. Historical
rows preserved. Book Label/URL and floating Earn Label remain Settings fields.

Do not remove global Translations yet: Settings stats/hours, media ALT and city.intro
policy/legacy closeout remain. This request authorizes closing navigation only;
no silent replacement of those editors or deletion of their legacy content.

Independent QA found a pre-existing desktop keyboard focus-transfer bug: the
shared header hide rule used absence of :focus-visible, which also holds briefly
between two links while their parent remains :focus-within. Root owns the narrow
src/app/globals.css correction: hide immediately when parent lacks focus-within,
or an actual focused descendant has mouse (non-focus-visible) focus. This preserves
mouse-leave/click closing while allowing Tab/Shift+Tab inside the submenu. No JS,
core component, styling redesign or data change. All other QA cases passed on
fa6b0f6; only targeted keyboard/mouse confirmation repeats after build.
