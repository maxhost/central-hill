# ADR0070 — Testimonial quotes in four inputs

2026-11-07. Accepted for authorized local implementation.

The existing testimonial ficha exposes Quote EN/ES/PT/FR with one Save and no tabs.
Only quote is localized; author name/country, property location, audience, stars,
position and status remain shared. Reuse existing translation rows and core seams.
Raw authored/pending targets load as-is; missing targets remain blank. Saving a
nonblank target approves it manually; blank deletes only quote/that locale and
public readers fall back to EN. Optional target payload preserves old clients.
EN is trimmed and required (max1000), targets trimmed/optional (max1000).

Existing locale/audience cached readers remain authoritative, with testimonial-list
invalidation on Save. No republishing marketing pages or changing their JSON/SEO.
No new schema, migration, kernel write API or automatic translation.
As quote is the only translated field, retire testimonial from generic Translation
inbox/mutations/generation and redirect old review URLs to its ficha. No legacy
rows deleted by retirement. Global Translation remains for other pending types.
