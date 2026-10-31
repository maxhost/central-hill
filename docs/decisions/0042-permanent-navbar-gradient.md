# ADR 0042 — Permanent navbar gradient

Accepted: explicit user request, 2026-10-31.

The navbar always uses the footer's shared feature gradient,
`linear-gradient(90deg, #4c3d32 0%, #926c52 100%)`.
This replaces the transparent hero and frosted scrolled header appearances.
Following user visual review, the rounded Earn With Us tab shares the navbar's
gradient, sized to the navbar width and offset by the tab's measured position.
HeaderScroll updates these CSS coordinates on layout/viewport resizing so the
color stops meet at the seam, without relying on fixed background attachment.
This supersedes the separately colored tab experiments.
Navigation text, Booking outline, branding accents and utilities use light
foregrounds at every scroll position. Full-width subnavigation also uses the
navbar gradient with white links and white hover/focus underlines, per user request.
Other popovers and the mobile drawer retain their existing palettes through
`data-chrome-keep`.

Scroll detection remains for the Owners section navigation. Links and locale
behavior are preserved. This is an aesthetic L0 change: no automated tests or QA;
the user reviews it on localhost.
