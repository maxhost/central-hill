# ADR0052 — Action label on photo feature link cards

Accepted2026-11-01: user requests About contact cards match the audience photo
cards while retaining editable text, destinations and per-card images.

PhotoFeatureGridItem gains optional linkLabel. It appears beneath the description
only when href is present, in white with the existing card typography. The whole
card remains one Next Link (no nested actions). Other callers omit it and retain
their existing output. PhotoFeatureGrid stays presentational and slice-free.

About adds optional contact-card image references through its existing editor
schema, preview descriptor and media validation; no database migration or writes.
Visual reference and overlay remain About's existing audience cards.
