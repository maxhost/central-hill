# Testimonial Quote locale inputs — independent QA

2026-11-07. Candidate `1cb2ec8` on `testimonial-quote-locales/integration`,
`/private/tmp/central-hill-testimonial-quote-locales-integration`; baseline main
`a321f2d`. Independent QA owns only this report and artifacts under
`/private/tmp/central-hill-testimonial-quote-locales-qa/independent/`.

Status: **APPROVED** for product `1cb2ec8`. Three bounded production-browser
groups passed with zero page errors and no product correction.

## Scope and environment

Four Quote textareas EN/ES/PT/FR in one existing testimonial ficha, one Save,
no language tabs. Raw authored/pending targets, missing blank; manual nonblank
Save approved, blank clears only that locale's quote for English fallback. EN
trimmed/required and all four max1000. Shared author/country/location/audience/
rating/status/position stay intact. No schema/migration/kernel API or Page edits.
Generic Translation testimonial inbox/actions/generation retire, with old review
links redirecting to the ficha and no legacy rows deleted by retirement.

Verified cwd/branch/HEAD/status; only existing logo and public-media symlink were
untracked. Read AGENTS.md, CLAUDE.md, canonical workflow, execution spec and
ADR0070. No source fixes, build, listener or cache management by this QA agent.

Preflight asserts `DATABASE_URL` hostname `propertylocalesqa.local` and SQL DB/role
both `propertylocalesqa` before any write. Existing local DB5658/proxy4558/storage9077
and synthetic browser auth reused, no credential printing/copying. Read-only
preflight exit0 compares all42 business hashes against the root before-seed
baseline; auth tables excluded, own e830/e831/new recorded UUIDs excluded from
comparisons. Exact shared scalar/owner-quote/slug snapshots saved before browser.
No media writes. Existing Home/Pages, d/f and prior e78/e79/e80/e81/e82 remain
protected. Evidence: `preflight.log`, `immutable-before.json`, parent
`protected-before-seed.json`.

## Source review and coverage limits

Reviewed validation, raw target mapping, sequential source/target persistence,
old-client omission, field-local blank clearing, form IDs/errors/disabled state,
legacy guard placement and redirect. Public `listTestimonials(locale,audience?)`
was already approved-target/EN-fallback, published/audience/position filtered;
Save retains its `testimonial-list` invalidation. No Page republishing needed.

Current Home intentionally omits testimonials (home-page.tsx, ADR0031 pricing
funnel), despite historical README wording. Owners source is absent in this
synthetic environment. No Home section or fixed Page fixture was added. Public
browser acceptance uses the existing Guests pages in four languages and checks
owner suppression; integrated six DB cases cover owner/guest/mixed filtering,
ordering and draft/archive exclusion in all four locales. This is the explicit
boundary of public owner-page evidence, not a missing feature added by this task.

## Bounded browser groups

Prepared `group1.mjs`, `group2.mjs`, `group3.mjs` with shared `common.mjs`.
Each group asserts shared scalars/owner quotes/slugs unchanged, all42 protected
hashes equal, and no page errors. Functional desktop/mobile only; no screenshots,
aesthetic loop or broad Pages suite.

Orchestrator READY: sole local production3071, PID74283/session22386 in the
integration worktree, same synthetic DB/proxy/storage. Root controls runtime and
later actual-main handoff; QA did not start/stop listeners or manipulate caches.

| Group | Exercised behavior | Result |
|---|---|---|
| 1 | Existing ficha has four labelled/max1000 Quote textareas, only EN required, no tabs; raw ES pending/PT authored/FR blank; pending ES remains private; one Save approves targets and reload restores each; New ficha starts four blanks/default draft, creates and reloads all four quotes with shared scalar defaults intact | Pass, exit0 |
| 2 | Existing Guests EN/ES/PT/FR render each authored quote in the real figure/blockquote, preserve author/country/rating4 and suppress owner audience; no Page or publication saves | Pass, exit0 |
| 3 | Mobile390 Save/reload changes EN and clears ES; ES falls back to updated EN while PT/FR stay custom; Guests four public locales refresh without Page republishing; old review URL redirects to the same four-field ficha; testimonial inbox is empty while unrelated types remain; anonymous admin access redirects to login | Pass, exit0 |

Every group checked all42 protected business hashes and exact neutral scalar,
owner-quote and testimonial-slug snapshots. `protected-after.json` equals root
`protected-before-seed.json`. Existing Page JSON, locale drafts/publications,
revisions and SEO were included in those immutable business hashes. Final raw
snapshots are `immutable-before.json` / `immutable-after.json`. Evidence includes
`groupN-result.json` / log, `group1-quotes.json`, `group2-evidence.json`,
`final-quotes.json`, `new-testimonial.json`, `owned.json` and `final-proof.log`.

New retained draft testimonial: `b58049c1-f090-42f2-aa18-6b98adb777ac`, guest,
rating5, author `QA New Quote Guest`, countryPT, position0, location
`New quote demo location`. Four quote rows persisted; all target rows approved.
The seeded owner remained untouched; the seeded guest retained every shared
scalar apart from its expected updated_at. No images or media files were changed.
No harness correction, repeating matrix or product fix was needed in these runs.

## Integrated checks

Reviewed root integrated evidence against `1cb2ec8`: typecheck exit0, lint exit0
(seven existing warnings), actual explicit test command exit0 with 33 cases:
27 pure (14 existing Testimonial +6 schema/policy +2 generic guards +5 Translation
regressions) and6 real DB. `tests.log` and typecheck/lint/tests exit markers all0.
Build exit0, 144 routes, two workers with local CIRCLE_NODE_TOTAL=3, after e830
cleanup. No broad known-stale Pages suite or placeholder pnpm test was used.

All commands source `/private/tmp/central-hill-building-status-qa/env.sh` with
Node22. The orchestrator's test command used the existing external Node-only
auth/Next-cache loader, with real database persistence; real browser acceptance
used actual authentication, Next actions and cache invalidation:

```sh
export NODE_OPTIONS="$NODE_OPTIONS --require /private/tmp/central-hill-property-forms-qa/node-runtime.cjs"
pnpm exec tsx --import /private/tmp/central-hill-geography-name-locales-qa/backend/test-runtime.mjs --test \
  src/slices/testimonials/tests/testimonials.test.ts \
  src/slices/testimonials/tests/testimonials-admin.test.ts \
  src/slices/testimonials/tests/quote-locales.test.ts \
  src/slices/testimonials/tests/quote-locales.integration.test.ts \
  src/slices/translation/tests/testimonial-quote-guards.test.ts \
  src/slices/translation/tests/translation.test.ts
CIRCLE_NODE_TOTAL=3 pnpm build
```

Independent commands below ran under sandbox escalation for local HTTP/DB/
Chromium access. No new production/schema permission was needed for the assigned
synthetic-content scope; hostname and DB/role guards passed before mutations.
Paths are relative to the artifact `independent/` directory:

```sh
QA_PREFLIGHT_ONLY=1 node common.mjs # exit0
node group1.mjs                    # exit0
node group2.mjs                    # exit0
node group3.mjs                    # exit0
QA_FINAL_PROOF=1 node common.mjs   # exit0; read-only final snapshots/hashes
```

Six DB cases independently reviewed cover raw/pending privacy/no GET writes,
manual approval, exact target preservation when old clients omit translations,
ES clear/current-EN fallback with PT/FR custom, owner/guest/mixed/order/status
filters in four languages, and rejected whitespace/missing-record saves without
changes. Two guard tests cover every generic target action and direct generation
rejection before writes. Browser acceptance did not duplicate that Node matrix.

No schema/migration, remote writes, uploads, push or deploy by QA. No source fix,
aesthetic loop, Page write, cache/listener manipulation or main integration by QA.
Global Translations remains for other types; this is only Testimonial retirement.
