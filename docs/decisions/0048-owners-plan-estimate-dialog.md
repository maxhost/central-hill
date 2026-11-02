# ADR 0048 — Owners package estimate dialog

Accepted: explicit user request, 2026-10-31.

Owners' live-total CTA opens the existing OwnerEstimateForm in a native dialog
instead of scrolling to the hero. A Pages-owned client wrapper supplies a
generic PricingCards renderSummaryAction callback, so the kernel never imports
the slice. Capture the current selected tier names at open time.

Reuse the same localized form copy and all three existing steps. After the
properties/bedrooms row, display Selected packages followed by the actual tier
names on one line, separated by plus signs, in the brand accent color. Empty
selection has localized empty copy. Modal fields receive a unique ID prefix so
their labels remain separate from the mounted hero form.

Native showModal supplies background inertness; an explicit Tab/Shift+Tab wrap
keeps keyboard focus among the currently visible wizard controls. Portal to
body; lock body scroll, close with X/Escape/backdrop, and restore trigger focus.
Closing unmounts the wizard; reopening starts at step1 with current selections.
The hero and Buildings form behavior stay intact. Existing wizard submission
behavior is preserved (no persistence or email sends); capture is outside scope.
