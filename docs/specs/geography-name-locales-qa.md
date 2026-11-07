# Geography name locale inputs — independent QA

2026-11-07. Candidate `e11dfcf` on `geography-name-locales/integration`,
`/private/tmp/central-hill-geography-name-locales-integration`; baseline main
`983ca51`. Independent QA owns this report and the artifact directory
`/private/tmp/central-hill-geography-name-locales-qa/independent/` only.

Status: **approved**. All three bounded browser groups passed against the
production candidate on localhost3071, with no blocking findings and zero page
errors. Product code remained `e11dfcf`; later `b641cd7` changes documentation only.
Local-main integration and final main opening remain the orchestrator's work.

## Scope and environment

Four name inputs EN/ES/PT/FR in the existing City ficha and every inline
neighbourhood, one Save. Manual targets are approved, blank targets fall back to
EN, omitted translations preserve legacy clients. No slug localization controls,
intro translation UI, schema changes or generic Translation retirement.

Checked cwd/branch/HEAD/status. Only existing logo and public-media symlink were
untracked. Read AGENTS.md, CLAUDE.md, canonical multi-agent workflow, active spec
and ADR0069. No product edits, build, listener or cache management by QA.

Preflight requires `DATABASE_URL` hostname `propertylocalesqa.local` and SQL
`current_database()`/`current_user` both `propertylocalesqa`. The existing local
DB5658/proxy4558/storage9077 and synthetic auth state are reused. No credentials
are printed/copied. Initial sandbox-only attempt encountered local-port EPERM;
identical read-only checks under `require_escalated` passed, exit0. All 42 business
hashes matched the before-seed baseline. Evidence: `preflight.log`, preserved
`preflight-sandbox-blocked.log`, `immutable-before.json` and parent
`protected-before-seed.json`.

The e821 City/two neighbourhoods/Building/Guide/section belong to this task. Only
new task-owned UUIDs may additionally be created for the inline identity check.
The existing d300 photo is referenced read-only; no uploads/media writes. Prior
business fixtures and existing marketing pages remain protected by hashes.

## Source review

Reviewed name-only writes/raw pending reads, optional target contract, published
location options and all-status Guide options, validation, form payload/ordered
ID adoption, locale option labels and Geography cache invalidation. Name-only
saves skip all slug writes and unchanged intro writes. Actual EN intro clear
reuses source-only `preserveTargetsOnClear`; real shared slug edits retain their
prior behavior. The new Building options seam retains existing any-staff read
access; Guide roles remain unchanged.

Existing Buildings listing deliberately displays neighbourhood rather than city
and does not mount `BuildingFilter` (pre-existing documented B6 behavior). Browser
acceptance therefore covers neighbourhood in listing cards, both names on detail,
Building selectors, and Guide city filter/detail; this delivery adds no new public
filter or city label to the Building listing.

## Bounded browser acceptance

The orchestrator supplied production3071 READY, PID69672/session39094, verified
integration cwd and single listener. Chromium used 1440×1000 desktop and 390×844
mobile; auth/cache were real application behavior, not test stubs.

| Group | Exercised behavior | Result |
|---|---|---|
| 1 | Existing/new City, four names per City and inline neighbourhood, no tabs; raw pending/blank inputs; pending names private publicly; one Save, approved manual targets and reload; add/remove before first Save; add/reorder on saved City, then immediate second Save without reload retains new neighbourhood IDs and their translations | Pass |
| 2 | Building and Guide four language tabs show localized labels with unchanged city/neighbourhood IDs; Building detail and listing-card neighbourhoods; Guide detail and working city filter in four languages; custom PT city URL remains200; authored copy, SEO titles and all consumer data intact | Pass |
| 3 | Mobile City Save/reload, EN rename preserves PT/FR targets, explicit City/first-neighbourhood ES clears use updated EN fallback while second neighbourhood retains its own ES; public names refresh in four languages without consumer republish; Building/Guide ES selectors refresh; anonymous City admin access redirects to login | Pass |

Each group asserts exact equality for all 42 protected business-table hashes,
all fixture city/neighbourhood slug rows including custom PT URLs, historical
intro rows (EN absent, PT approved, ES pending), neutral City/neighbourhood data
and every fixture Building/Guide/section root/translation/slug/locale/shared row.
No locale envelopes were materialized by GET or by switching editor tabs.
Final raw snapshots are `immutable-before.json` / `immutable-after.json`, and
`protected-after.json` equals the parent before-seed baseline. Evidence also
includes `group1-names.json`, `group2-evidence.json`, `final-names.json` and each
`groupN-result.json` / log.

The first group stopped after its successful existing-City Save because the
harness attempted to read a Next-action response body after router.refresh had
already invalidated that browser response handle. No page errors occurred. Only
the harness response-body capture was removed. `group1-finish.mjs` resumed from
reload/DB verification of that already-completed Save and completed the remaining
cases; earlier raw-pending/public-beforeSave assertions were not repeated or
misrepresented. Original harness failure evidence is retained in
`group1-response-body-harness.log` and matching result JSON. No product correction
or aesthetic loop occurred during QA.

New retained browser aggregate:
City `69c3994c-1abc-4b8d-bdc8-a2e873b2dccd`; ordered neighbourhoods
`18fa8a22-162c-4219-bd95-5a26432d8e1f`,
`65146c11-93ce-489e-985b-a2ad6e5b2b34`. `owned.json` and
`new-aggregate.json` record ownership/identity proof. Seeded e821 membership and
references were preserved. No media rows/files were changed.

## Commands and integrated evidence

All commands ran in the integration worktree with Node22, sourcing
`/private/tmp/central-hill-building-status-qa/env.sh`. Local HTTP/DB/Chromium access
used sandbox escalation after the initial EPERM. No new user permission or schema
authorization was needed for the existing synthetic-content scope.

Independent commands, paths under the artifact `independent/` directory:

```sh
QA_PREFLIGHT_ONLY=1 node common.mjs  # exit0
node group1.mjs                    # exit1, response-handle harness issue above
node group1-finish.mjs             # exit0, resumed bounded group1
node group2.mjs                    # exit0
node group3.mjs                    # exit0
QA_FINAL_PROOF=1 node common.mjs    # exit0, read-only final evidence
```

The orchestrator's integrated evidence against product `e11dfcf` was reviewed:
`pnpm typecheck` exit0, `pnpm lint` exit0 (seven existing warnings), and the real
explicit test command below, exit0 with 36 cases (15 existing Geography,
9 payload/IDs, 4 name helpers, 7 DB, 1 Guide options):

```sh
export NODE_OPTIONS="$NODE_OPTIONS --require /private/tmp/central-hill-property-forms-qa/node-runtime.cjs"
pnpm exec tsx --import /private/tmp/central-hill-geography-name-locales-qa/backend/test-runtime.mjs --test \
  src/slices/geography/tests/geography.test.ts \
  src/slices/geography/tests/geography-admin.test.ts \
  src/slices/geography/tests/geography-name-payload.test.ts \
  src/slices/geography/tests/geography-name-locales.test.ts \
  src/slices/geography/tests/geography-name-locales.integration.test.ts \
  src/slices/guides/tests/city-options.test.ts
CIRCLE_NODE_TOTAL=3 pnpm build  # exit0, 144 routes, two workers
```

Root ran the build after e820 cleanup; logs `tests-integrated.log`, `typecheck.log`,
`lint.log`, `build.log` are in the parent artifact directory. DB tests specifically
prove omitted target payload compatibility, whitespace rejection, absent/custom
slug preservation, actual shared slug edits, actual EN intro clearing with target
preservation and foreign-neighbourhood identity isolation. Those proofs were
reviewed rather than duplicating their matrix through browser APIs. DB test auth
and Next-cache stubs apply only to actions outside a request; browser acceptance
used real authentication, actions and cache invalidation.

No schema/migration, production or remote content writes, uploads, push, deploy,
cache/listener manipulation or main integration by QA. No unrelated broad Pages
suite was rerun; its previously documented eleven baseline layout expectations
remain outside this task. Geography intro localization and generic Translation
retirement remain deferred; these name inputs do not complete those scopes.
