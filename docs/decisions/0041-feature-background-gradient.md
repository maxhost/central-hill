# ADR 0041 — Feature background gradient

Status: accepted by explicit user request, 2026-10-30.

Replace the former solid `#2e2a26` feature backgrounds with
`linear-gradient(90deg, #4c3d32 0%, #926c52 100%)`.

The shared `bg-feature` utility supplies the gradient through the theme's
`--background-image-feature` token; `--color-feature` supplies the first stop as
the solid fallback. Existing consumers and hover variants inherit the change,
including statistics, CTAs, contact panels, newsletter, footer, hero bases,
dark form cards and article author badges. Hero media and overlays remain above
the base. No persistence, routing, translation or publishing behavior changes.

This supersedes ADR 0022 only for the feature background. Historical mockups
remain reference artifacts. The remaining palette and text tokens are preserved.

Local verification before the user's L0 clarification: typecheck and lint exited 0
(seven existing lint warnings), Next compilation in `compile` mode exited 0;
this was not a full prerendered build. An isolated CSS fixture confirmed the
computed gradient and hover variant at 1440px and 390px. No route/persistence QA
was performed. Further aesthetic validation belongs to the user on localhost,
per their 2026-10-30 instruction.
