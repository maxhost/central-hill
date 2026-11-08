# ADR0073 — Settings navigation CTA locales

2026-11-07. Add Book Now Label/URL and Earn With Us Label EN/ES/PT/FR to current
Settings form. Earn remains the existing floating Owners action, absent another
user direction; do not restore it to header/mobile. Book desktop/mobile share
configuration and retain new-tab behavior. Earn keeps its existing locale-aware /owners link, no URL control (user correction).
Book supports internal paths prefixed by locale; explicit locale paths stay exact.

Reuse translation(company_settings,id,navigation_ctas,locale): JSON contains
{book:{label,url},earn:{label}}. EN required; targets may clear individual fields
for EN fallback. Existing absent configuration retains today's localized labels,
fixed Book URL and /owners destination. Admin initially prefills all current locale
values, including translated labels. Own values persist after EN changes. An old
payload omitting navigation_ctas writes nothing to this field. No schema/backfill.

Raw authored/pending values load for editing, public targets must be approved.
Manual Save writes source JSON and approved target JSON through existing kernel
seams; EN JSON always nonempty so cannot cascade-delete targets. URL validation:
HTTPS absolute or safe root-relative path, max300; label max80. Public invalid
legacy targets fall back safely. Generic Translation excludes only this new field,
not other Settings/nav_item rows. Existing globals/layout revalidation, cachev5.
No change to booking widgets, page CTAs, contacts, nav trees, roles or core UI.
