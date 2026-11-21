# ADR0088 — Fixed Welcome media frame

Date:2026-11-21. Status: implementation on isolated branch; acceptance pending E2E.

Guests Welcome currently passes an aspect4:5 renderer through a stretching IntroSplit cell. A landscape upload increases the cell height and crops its sides. IntroSplit gains opt-in `imageFrame="3:2"`: the cell reserves its own width-derived ratio from SSR, removes stretch/minimum heights, and contains positioned media. Existing callers retain stretch by default. Only Guests Welcome opts in, including the original image used when no media is selected. Text grows independently.

MediaContent selects MIME without owning geometry; sideMedia retains existing4:5 root nodes and classes. Welcome alone scopes loading/error state, with neutral surface on confirmed failure and a translated accessible preview notice. Video and Lottie keep existing motion behavior; Lottie import remains dynamic, and readiness means first render. No ingestion/schema/database/publication changes. See [plan](../specs/guests-welcome-media-plan.md) and [inventory](../specs/guests-welcome-media-inventory.md).

The verified paired return point is restore/guests-welcome-media-2026-11-21 at ec7f610. Private recovery instructions preserve later writes and restore into new code/database locations. No merge before complete required E2E; no push/deploy.
