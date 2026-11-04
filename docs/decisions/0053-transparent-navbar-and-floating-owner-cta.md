# ADR0053 — Transparent navbar and floating owner CTA

Accepted2026-11-04, explicit user request. Supersedes ADR0042's permanent navbar
gradient/tab presentation; shared feature gradients elsewhere remain unchanged.

Restore transparent header/light foreground over a hero at scrollY≤2; scroll,
submenu hover/focus and pages without a hero use bg-bg/85 (#FBF8F3 at85%) with
blur and dark foreground. Submenus use their original light surface. HeaderScroll
only reflects scroll state; the removed owner tab needs no resize measurements.

Use the supplied light top-bar logo over heroes and its dark base variant on
light header backgrounds, with identical dimensions. Preserve the approved size.

Remove Earn With Us from header utilities and mobile drawer. MobileDrawer's
earn prop becomes optional, rendering the existing CTA only when supplied;
other consumers retain their behavior. This additive kernel API change is owned
by the root agent. No shared primitive branding/data logic is introduced.

The existing WhatsAppFab composer now stacks a localized Owners link above
WhatsApp in one fixed flex column with12px gap. Both circles retain56px mobile/
64px desktop sizing; Owners uses the existing accent, translated visible label,
title/aria-label and same-tab locale-aware route. The whole stack shares
--fab-lift, preserving clearance from service mobile booking bars.

User size follow-up2026-11-04: enlarge the owner circle and its label20%, to
67.2px mobile/76.8px desktop; WhatsApp remains56/64px and the gap stays12px.

Second size follow-up: another10% over that size, now73.92px mobile/84.48px
desktop, with proportional label/padding. WhatsApp size and12px gap retained.

Aesthetic L0: user validates localhost; no tests/automatic QA, DB writes,
commit, push or deployment requested. No new dependencies or message keys.
