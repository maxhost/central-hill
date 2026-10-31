# ADR 0043 — Home closing panel outer gutters

Accepted: explicit user request, 2026-10-31.

Following the user's correction, constrain the entire Owners/Guests two-column
section to the same centered 1240px container with 28px horizontal padding used
by Central Hill Partners and Services. Panel photos stay inside that container.

The shared DualCtaPanels component (currently consumed only by Home's DualCta)
wraps the grid in `mx-auto max-w-[1240px] px-[28px]`. This replaces the previous
viewport-dependent outer text paddings; normal panel padding is restored.

Aesthetic L0: user validates on localhost; no automated tests or QA.
