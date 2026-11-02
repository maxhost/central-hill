# ADR 0046 — Owners plan selection

Accepted: explicit user request, 2026-10-31.

PricingCards supports optional per-tier selection modes and becomes a client
component. Owners assigns single-choice radio inputs to its first two tiers
(Core and Prime), and independent checkboxes to Manage and Complete. Native
controls and Choose buttons update the same local state. Base changes preserve
the extras; each extra can be selected or deselected independently. Initially
no tier is selected. Selected cards have an accent border and buttons expose
their pressed state.

Visual follow-up: all selectors sit centered below their Choose button, with
the same28px circular outline and filled inner dot when selected. Native radio
and checkbox semantics and behavior remain intact; the wrapper provides a44px
click target. Forced-colors mode restores native control appearance.

The component retains link CTAs for tiers without a selection mode. Its existing
server-rendered icon and footer slots remain ReactNode props. No persistence,
submission, price calculation or database changes are introduced.
