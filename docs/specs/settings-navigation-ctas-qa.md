# Independent QA — Settings navigation buttons

2026-11-07. **Approved executable de04449**, integration branch
`settings-navigation-ctas/integration`, base main9fbace5. Independent source review
and three bounded functional browser groups passed on the first run. No product
fix or harness retry was required during QA.

## Environment and evidence

Read AGENTS.md, CLAUDE.md, authoritative multi-agent workflow, execution spec and
ADR0073. Root supplied production READY3071 after its checks: PID68236/parent68230,
integration cwd verified. QA did not start/stop servers, change environment,
manually invalidate caches, merge main, push or deploy. Chromium used existing
Admin authentication, desktop1440×1000 and mobile390×844, with reduced motion.
No screenshots, aesthetic loop, broad Pages matrix or external-link clicks.

Before any content write, independently verified DATABASE_URL hostname
propertylocalesqa.local and SQL database/role propertylocalesqa. Synthetic DB5658/
proxy4558/storage9077 retained. Settings singleton was empty and all42 protected
business-table count/hash pairs exactly matched root's pre-task baseline. Auth
session/account tables were excluded. Fresh singleton0 was checked again
immediately before the first actual Save.

Artifacts under `/private/tmp/central-hill-settings-navigation-ctas-qa/independent/`:

- `check.mjs`: guarded actual browser/SQL harness; syntax check exited0.
- `browser.log`, `result.json`: all three groups passed, pageErrors empty.
- `owned.json`: only newly-created Settings identity and creation time.
- `protected-before.json`, `protected-after.json`: exact42-table protection evidence.

Commands sourced `/private/tmp/central-hill-building-status-qa/env.sh` with Node22.
`QA_PREFLIGHT_ONLY=1 node .../check.mjs` exited0, then
`QA_SOURCE=de04449 node .../check.mjs` exited0 against root's production candidate.
Root's 69-test log and typecheck/lint exits0 were inspected. The full69 batch
preceded a root URL-policy tightening; the final5 focused pure cases passed after
that change, and final production build included TypeScript and passed144routes
with2workers. No passing root suites were repeated by QA.

## Functional groups

1. **Settings and persistence.** Existing form exposes four Book Label inputs,
   four Book URL inputs and four Earn Label inputs, with associated labels and
   max80/300 limits; no Earn URL or language tabs. Initial values match current
   localized message labels and the existing fixed English booking destination.
   Initial public About EN/ES/PT/FR retains those defaults. A JavaScript URL
   produces the ES URL field error, retains attempted input and creates no row.
   One real Save creates a new own singleton; reload returns authored values for
   all four locales. Four JSON translation rows exist, with target rows approved
   and no Earn destination member.
2. **Public locale behavior.** Each About page's desktop header renders the exact
   configured Book label/destination with `_blank` and `noopener noreferrer`.
   HTTPS destinations retain query/fragment, an explicit PT path stays exact and a
   locale-neutral FR path gains `/fr`. Floating Earn shows its locale label and
   keeps the existing `/<locale>/owners` href and same-tab behavior. EN changes
   preserve own PT/FR values; clearing ES fields uses corresponding current EN
   values. Own ES labels can coexist with an empty ES URL that keeps following EN.
   Settings Save updates all public links without a Page Save/Publish.
3. **Mobile, failures and ownership.** Mobile form Save/reload retains a new FR
   Earn label. All four mobile drawers use the same resolved Book label/href and
   safe new-tab behavior as desktop; Earn remains floating with its fixed localized
   Owners link. An invalid HTTP URL keeps attempted input/error while inline
   Settings and translation rows remain exact; reload recovers stored values.
   Anonymous Settings access redirects to login. Generic Settings review retains
   Stats while excluding navigation_ctas and authored booking URLs. Own fixture
   was reset through the real form to current default labels/Book URL before cleanup.

Across subsequent CTA saves, neutral inline Settings attributes and non-CTA
translation values/states/source hashes remained unchanged. Public header nav,
footer/contact links and per-locale title/canonical matched their post-first-Save
baseline. Old Page JSON/publication/revision/media and other business data were
protected by exact hashes throughout. First singleton creation naturally enables
existing configured contact details; this was not misreported as a CTA regression.
Every observed browser pageerror list was empty.

## Source review and scope

One manually-owned translation field stores per-locale JSON; no migration or
backfill. Existing absent configuration resolves current translated defaults.
Admin loads raw authored/pending values, targets may clear individual fields for
EN fallback, and omitted older payloads leave CTA rows untouched. EN JSON is
required/nonempty, so source writes cannot cascade-clear target rows. Public
approved targets validate each field and fall back to EN without coupling to a
later source hash. Unsafe legacy URLs cannot render.

Book desktop/mobile share one resolved configuration; cache shapev5 and existing
global/layout invalidation cover all locales. Earn has only a label in schema,
form, stored JSON and reader; its existing /owners Link and WhatsApp logic remain.
Generic inbox/review/single writes/bulk approval/generation protect the new manual
field alongside Website, while other Settings and nav_item workflows remain.
Main menu/submenu translations, booking widgets/page CTAs, contacts, core UI,
roles and schema were not converted as side effects.

## Cleanup and delivery boundary

The only browser fixture was newly-created Settings
`7e985efb-1efc-40f5-9b70-69c88159711b`, creation timestamp independently recorded.
ID/creation-time/account guards confirmed ownership before cleanup. Only that row
and its own company_settings translations were deleted; no previous singleton was
snapshot/deleted/restored. Final Settings count0 and all42 business-table hashes
exactly equal root's original baseline. No Page/media content was written.

After direct fixture cleanup, candidate public caches can retain prior fixture
values until root's runtime swap. QA did not intervene manually. Root owns the
final actual-main read-only opening. Missing Settings retains current public CTA
defaults; no fake singleton is left configured for the final preview.
