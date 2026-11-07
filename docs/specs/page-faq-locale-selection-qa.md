# Page locale FAQ selection — independent functional QA

2026-11-07. Candidate `e9f0cab`, integration branch `page-faq-locales/integration`
in `/private/tmp/central-hill-page-faq-locales-integration`, from main `fc609a8`.
QA owns this report and `/private/tmp/central-hill-page-faq-locales-qa/independent`
only. Product edits, schema changes, listeners, build and main integration belong
to root. **Independent functional/source approval: `e9f0cab`.** All three bounded browser
groups and the short read-only cleared-page status confirmation pass. No product
correction was required in independent QA.

## Environment and data boundary

The harness checks hostname `propertylocalesqa.local` and SQL database+role
`propertylocalesqa` before any mutations. Safe environment is the existing
`/private/tmp/central-hill-building-status-qa/env.sh`, Node22, DB5658/proxy4558 and
storage9077. Root supplied production3071 PID46574 from the integration worktree after its
build passed (136pages). QA does not change runtime.
Existing synthetic staff state is reused from the Services QA fixture.

Only newly seeded About `e8110000-0000-4000-8000-000000000001` and its four locale
snapshots may be changed. About ownership is asserted before entry. FAQ e811
source groups/items/translations are separately hashed and kept immutable. All42
business tables are protected, excluding auth, About/e811 ownership and root's
temporary Owners/e810 tests; Home and every pre-existing Page remain protected.
No old-page snapshot/delete/restore strategy is used. No media uploads, schema or
remote writes are part of this QA.

Preflight captured `protected-before.json` and `immutable-before.json` without
content mutations. Root retains the earlier `protected-before-seed.json` so the
protected result can also be compared across seeding and store tests.

## Source review

Reviewed optional `localeReferencePaths` metadata on exactly Home, Owners, Real
Estate, Guest and About; target preparation; shared-envelope comparison; target
inspector native select; existing draft/publication/CAS validation; public/private
readers and FAQ locale/group resolution. FAQ references remain outside [T] text
patterns and translation writes. Existing target values, explicit blanks and
absence survive template preparation; a fresh target does not adopt EN's FAQ.
Shared media/list/icon/OG protection remains. The inspector calls its existing
active-locale change function and reuses the catalogue and empty option.

Public renderers consume each locale's published envelope reference and gate
FaqSection on a nonempty key; there is no English group fallback. The unchanged
FAQ reader retains its existing approved translation/source behavior and published
item filtering. Legacy snapshots/projection retain old choices without GET writes.
No other Page gains an FAQ section, no FAQ editor/taxonomy rewrite or global
Translations retirement is included.

The root/author tests cover seven pure groups (all five adapters, missing legacy
field/default Home metadata and four non-FAQ adapters) plus five guarded real DB
groups on newly reserved Owners/e810 only. Cases include legacy no-write, fresh
PT no inheritance, own ES/FR values, locale-specific draft/publication, later EN,
clear without fallback, stale CAS and shared OG rejection. Root records an inert
cache stub used only by the out-of-Next test harness, not production behavior.

## Bounded browser groups

All three groups pass on production3071:

1. Initial About GET/tab changes made no writes. EN kept its EN selection, ES kept
   its different stored choice, FR stayed blank and PT with no publication did not
   inherit EN. Every language selected, saved, reloaded and explicitly published
   its own group; public questions and answer JSON-LD matched the chosen group.
   Each action advanced only the selected locale unit and preserved the others.
2. A saved ES draft choosing PT plus an unsaved FR choice survived EN Save/Publish
   choosing FR. Other locale rows remained identical. Publishing ES consumed only
   ES; returning/retemplating/reopening retained the selections. Normal EN/ES/PT/FR
   demonstration choices were restored without changing any FAQ content.
3. Clearing ES hid its FAQ in the private live preview before Save while public ES
   still showed its prior publication. Save/reload/Publish removed it publicly;
   later EN changes never revived it. FR clear/Publish worked at390px. Home's
   four selectors were read-only checked as enabled without saving Home; anonymous
   admin access redirected to login. Cleared ES/FR published pages were additionally
   confirmed200 in a read-only check, with no FAQ and no revision/content change.

Every completed group compared all42protected business hashes and immutable About
source/FAQ groups/items/translations with its baseline: unchanged. Each group
recorded an empty pageerror list. Root compared final hashes with the preseed/store
baseline as well: identical (`final-protected-comparison.json`).

Two harness adjustments were required, with no product edit: the existing FAQ
summary includes a decorative `+`, so the question locator was scoped to the
summary rather than exact combined text; a reload selection was synchronized with
preview-ready/hydration before choosing the FAQ inspector. The original last
reload context had closed on failure, so its binding state could not be recovered;
a fresh read-only reproduction showed hero→faq selection and native control
normally. Only the unfinished FR reload/Publish was resumed in `group1-finish.mjs`;
completed EN/ES/PT writes were not repeated. Logs of both initial attempts remain.

No aesthetic screenshots, geometry checks or polish loop. Only normal functional
operations on the owned fixture, with targeted confirmations after any correction.

## Commands and evidence

After sourcing safeenv, all harness commands use Node from that environment:

- `QA_PREFLIGHT_ONLY=1 node /private/tmp/central-hill-page-faq-locales-qa/independent/common.mjs`
- `node /private/tmp/central-hill-page-faq-locales-qa/independent/group1.mjs`
- `node /private/tmp/central-hill-page-faq-locales-qa/independent/group1-finish.mjs` (targeted remaining FR step)
- `node /private/tmp/central-hill-page-faq-locales-qa/independent/group2.mjs`
- `node /private/tmp/central-hill-page-faq-locales-qa/independent/group3.mjs`
- `node /private/tmp/central-hill-page-faq-locales-qa/independent/clear-status.mjs` (read-only200 confirmation)

Root verification limitation: its broad integrated batch had195/206 pass, with11
failures reproduced unchanged on main `fc609a8` (baseline138/150 pass, same11 plus
an old Home outline expectation for removed Avantio). Root corrected that stale
outline test only, leaving unrelated legacy layout/copy expectations untouched.
Root final focused checks passed57/57, including relevant adapter/editor/model
regressions; all12new pure/DB cases passed in the integrated batch. Typecheck and
lint passed (7existingwarnings), and the build passed136pages with2workers after
Owners fixture cleanup. No claim that the broad legacy test batch is wholly green
is made.


Evidence retains `group{1,2,3}-result.json`, logs, snapshots, `clear-status.json`,
protected before/after hashes and immutable fixtures under the independent artifact
directory. Only About locale snapshots changed during QA. No old content, FAQ
item/group source text, media, schema, external provider or remote data was written.
The five adapters and excluded non-FAQ Pages are covered by source/pure tests;
normal persistence/publication was exercised in the dedicated About fixture rather
than mutating existing Home or other Page keys. First-target EN-template CAS and
all existing Page draft/publication semantics remain in place.
