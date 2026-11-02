# ADR0051 — Lighter photo feature card overlay

Accepted2026-11-01, user requests brighter photos behind Guests' Services and
Guides card text. Both catalogues share PhotoFeatureGrid through the Guests
catalogue carousel.

PhotoFeatureGrid gains an optional overlayClassName. Guests passes a lighter
gradient; the shared default remains15%/55%/82% for other consumers such as About.
Keep the warm near-black RGB(12,10,8) and gradient stops0%/60%/100%, reducing
Guests' opacities to8%/35%/65%. The lower portion retains more
shade behind the white text, while allowing more of each photograph to show.
No layout, content or interaction change. Aesthetic L0: user reviews localhost;
no tests or automatic visual QA, database writes, commit, push or deployment.
