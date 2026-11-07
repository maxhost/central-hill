# ADR0062 — Localized Building booking button

2026-11-06. User requests a simple per-language Label and Link instead of technical
Avantio ID, shared base URL and override fields in the Building form.

Add optional booking_button {label:string,link:string|null} to version1 Building
locale JSON. Its text and link are localized together and participate in existing
explicit locale Save/Publish and inherited/custom ownership. No table migration,
kernel change or bulk content conversion. New buildings initialize Book Now/null.

Absence is compatibility metadata: old snapshots preserve legacy effective URLs
and existing public CTA labels. The editor projects their effective URL and the
language's Book Now label without writing. A real edit materializes both fields;
an explicit null link suppresses both Building-specific CTAs, never reviving a
legacy base or global fallback. Old technical values remain stored internally.
Listing external-navigation flag stays a separate shared visibility option.

The public booking read model gains optional label. Presence distinguishes authored
buttons from legacy defaults. Global navigation and Apartment-owned labels are
outside scope. Both Building-owned buttons consume the same authored pair.
