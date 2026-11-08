# Independent QA — fixed public navigation

2026-11-07. **Approved executable `4635f0b`**, branch `fixed-navigation/integration`, base
main `37a553f`. Initial navigation data/retirement source `fa6b0f6` passed its
readonly groups apart from an inherited keyboard focus-transfer issue. Root fixed
that issue with a narrow CSS change; ten targeted confirmations pass.

## Scope and environment

Read AGENTS.md, CLAUDE.md, authoritative multi-agent workflow, executable
fixed-public-navigation spec and ADR0074. QA owns this report and independent
artifacts only; product source, runtime, cache and main integration stay with root.
The request fixes header/mobile/footer labels, links and order in code, translates
Owners/About menus EN/ES/PT/FR and retires Navigation plus generic nav_item editing.
Global Translations remains for other Settings copy, ALT/city.intro decisions and
legacy-path closeout. No editor replacement or role refactor belongs to this QA.

Safeenv `/private/tmp/central-hill-building-status-qa/env.sh`, Node22. Runtime target
must be root's production candidate on localhost3071. Before browser checks, verify
DATABASE_URL host propertylocalesqa.local and SQL database/role propertylocalesqa,
Settings0/nav0 and all42 business-table hashes against root's baseline. Auth tables
are excluded. Browser uses existing synthetic Admin authentication; no content Save,
seed, upload, schema, remote write or cache intervention is required.

Artifacts under `/private/tmp/central-hill-fixed-navigation-qa/independent/`:
`check.mjs` (guarded with QA_READY and QA_SOURCE), browser log, result JSON and
protected-before/after JSON. Readonly browser matrix: desktop1440×1000, mobile390×844,
Chromium with reduced motion. No screenshots, geometry/aesthetic loop, external
clicks or unrelated broad Pages suite. About's existing four public locales host
the shared chrome; missing standalone synthetic pages are not seeded or followed.

## Source review

getNav keeps its API but resolves the canonical fixed trees/messages only, using
stable code IDs and a new fixed-v1 cache key. Header and mobile share all six main
items and Owners10/About8/RealEstate10/Guests2 children. Footer retains its two
five-link groups and original destinations. Header/Footer removed redundant DB
fallback trees while preserving CTA/contact/widget markup and classes. Book Label/
URL and floating Earn Label still resolve from Settings; Earn link remains Owners.

Navigation sidebar entry is removed, old route authenticates then redirects to
Settings, legacy reader returns no editable values and saveNavigation authenticates
then rejects before any write. Nav-specific persistence helpers are removed.
Generic Translation blocks nav_item's individual/bulk/generation actions and raw
generator, masks inbox/entity reads and redirects old reviews before loading their
matrix. Historical rows and remaining Settings/other generic copy are preserved.
No defect was found in the navigation data/retirement source review. Backend
fixture tests additionally proved old stored nav values cannot override the fixed
reader and attempted writes leave legacy rows exact. The browser finding in the
inherited shared keyboard visibility rule is explained below.

## Verification results

Independent read-only preflight exited0 after root confirmed fixture cleanup:
propertylocalesqa host/database/role, Settings0/nav0 and exact42-table baseline.
Root's actual integrated logs were inspected: typecheck0, lint0 with7 existing
warnings,88 tests passed/0failed. Existing Real Estate contracts and previous
Settings/Website/CTA/manual-field guard regressions remain in that checked batch.
Backend tests use own new nav/translation references, prove DB override and all
old writer/generator attempts cannot change fixed navigation, preserve remaining
Settings review/generation and clean their fixtures. QA did not repeat passing
checks. Root reported initial build0/144pages/2workers after production READY72352/72346.
Readonly browser groups on fa6b0f6 passed all current labels/hrefs/order/hover,
mobile accordions, Footer/CTA/contact preservation, admin retirement redirects/auth
and remaining Translations.0 pageerrors, Settings0/nav0 and all42 hashes exact.
After the targeted correction, all three bounded groups are approved; no
blocking finding remains.


## Initial finding and bounded follow-up

**Resolved P2** — Existing shared keyboard visibility rule could abort focus transfer into an
Owners submenu. Reproduction on production fa6b0f6: focus the brand, press Tab to
Owners, wait until its link is focus-visible and its panel fully visible (opacity1),
then press Tab toward /en/owners#worth. Focusout reports that related target but no
focusin follows; activeElement becomes body and the panel hides. Stable-readiness
and actual key events reproduced it. globals.css and core NavBar were unchanged
relative to main37a553f; this is an existing shared behavior, rather than a localized
label/data regression. Root accepted a targeted CSS correction within this scope.
QA did not modify product code.

Evidence: attempt1-browser.log/result.json, keyboard-inspect*.log,
keyboard-events.log and keyboard-stable.log. The resume pass skipped the already
confirmed EN main/Owners readings, completed only the remaining functional cases
and explicitly kept keyboard pending in result.json. No content mutation occurred.
Root corrected the rule in `4635f0b` (globals.css +ADR0074): hide when there is no
focus-within, or an actual focused element is not focus-visible, while preserving
hover behavior. The transient gap between keyboard focuses no longer hides the
target. No JS or other core UI changes were introduced.

After final build-keyboard.exit0/144pages/2workers (including TypeScript), root
provided corrected production READY3071: PID74078/parent74072, checkout
/private/tmp/central-hill-fixed-navigation-keyboard-runtime, source4635f0b. Only
ten targeted cases then ran: Owners/About in4locales plus representative RealEstate/
Guests in EN. Tab enters the first and next child, Shift+Tab returns through them
and back to the parent. Eight Owners/About mouse-focus/hover cases confirm panels
still close when leaving after a mouse click and reopen on hover.0pageerrors.
The driver prevented the default action of one parent click solely to inspect
real pointer focus without following a missing synthetic destination.

No completed broader group or DB check was repeated after the CSS-only correction.
The corrected confirmation did no DB reads, content writes or manual runtime/cache changes;
the earlier42-table exact protected comparison is retained with its source noted.


## Final results and evidence

1. Header/mobile: six fixed main destinations, all30 children, newly translated
   Owners10/About8 labels, existing RealEstate10/Guests2 translations and original
   href/order pass in EN/ES/PT/FR. Owners/About hover and all four mobile accordions
   work in each locale;
   keyboard transfer and backward movement pass after the resolved correction.
2. Footer retains its two five-link groups and locale-correct labels/hrefs in
   all4languages. Desktop/mobile Book keeps its locale label, existing destination,
   newtab/noopener; floating Earn keeps localized text and /<locale>/owners. Existing
   bookings/Owners/check-in/email and WhatsApp details remain unchanged.
3. Admin sidebar has Settings and Translations, no Navigation. Old /admin/navigation
   and nav_item review URLs redirect authenticated Admins to Settings; anonymous
   access goes to login. Global Translations remains available, with no nav_item
   review links. Browser used no Save/Publish/upload/seed or content writes.

Commands sourced the existing safeenv and used Node22:
`QA_READY=1 QA_SOURCE=fa6b0f6 QA_PREFLIGHT_ONLY=1 node .../independent/check.mjs`
exited0. Initial full harness exited1 on the confirmed focus finding; the resume
pass with QA_DEFER_KEYBOARD=1 exited0 with keyboard explicitly pending. Final
`QA_READY=1 QA_SOURCE=4635f0b node .../independent/keyboard-confirm.mjs` exited0,
10cases/0errors. Root's88tests/typecheck/lint/final build logs were inspected,
not rerun by QA. No broad unrelated suite or aesthetic QA claim.

Artifacts include attempt1-browser.log/result.json, resume.log,
retained-fa6b0f6-result.json, keyboard focus-inspection logs, keyboard-confirm.mjs/
log/json and final combined result.json. Protected-before/after JSON match exactly
for all42 business tables, Settings0/nav0. No schema changes, historical data
cleanup, source fix by QA, runtime/cache intervention, main merge, remote write,
push or deploy. Root's final actual-main opening is a separate read-only step.
