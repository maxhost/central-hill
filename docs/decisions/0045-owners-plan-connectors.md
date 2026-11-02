# ADR 0045 — Owners plan connectors

Accepted: explicit user request, 2026-10-31.

Owners shows an Iconoir plus between Prime (Everything automated) and Manage
(Full operations), and between Manage and Complete (White-glove, end to end).
Connectors are decorative and centered vertically in the desktop column gaps.
The stacked mobile/tablet layout keeps its existing presentation.

PricingCards accepts an optional `separatorBefore` ReactNode per tier, supplied
by Owners from the existing icon registry. Desktop gaps expand to 40px when
connectors are present. Other consumers retain the existing presentation.

Aesthetic L0: user validates on localhost; no automated tests or QA.
