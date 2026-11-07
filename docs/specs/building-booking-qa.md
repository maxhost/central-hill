# Building localized booking button — independent QA

2026-11-06. **Approved** executable
`fdb462f753457292e3c7529314a996fa1d828b7b` on
`building-booking/integration`, checkout
`/private/tmp/central-hill-building-booking-integration`. No product blockers found.
Root supplied the integrated production build on the single localhost3071;
QA did not start/stop servers or modify implementation files.

## Environment and limits

SQL verified `current_database()` and `current_user` both `propertylocalesqa` before
browser mutations. Existing synthetic DB/proxy5658/4558, storage9077; no migrations
or remote writes. Only the root-created Building `e7510000-0000-4000-8000-000000000001`
was edited through its actual form. Its synthetic Apartment
`e7510000-0000-4000-8000-000000000002` was read as a real UnitCard. No fixture reset,
manual JSON replacement, direct content SQL mutation or media upload was needed.

Production runtime matters here: Save/Publish results were checked against public
routes after actual actions, exercising existing cache invalidation rather than
relying on development rendering. Root separately reports integrated typecheck,
lint, focused tests and build results in the execution spec. This report does not
claim those commands were independently rerun.

## Functional evidence

The single bounded Playwright sequence passed all five groups:

1. Legacy editor GET presents exactly two Booking inputs, Label and Link, without
   a Booking checkbox or the old technical controls. It displays the effective
   existing URL, writes no locale rows, and preserves both EN/PT public destinations
   and their previous distinct CTA defaults.
2. An unrelated SEO draft Save preserves the legacy button shape and public URL.
   A Label-only edit retains the displayed URL. Save keeps public labels and SEO
   private; explicit EN Publish updates both Building-owned CTA labels while PT
   remains on its prior publication.
3. PT working values inherit saved English until its first localized edit. Actual
   PT Label/Link/SEO Save, reload and Publish preserve its custom values and update
   only Portuguese public buttons/SEO. Its listing card opens the Portuguese URL.
4. Later EN Label/Link changes stay private until EN Publish and do not overwrite
   PT working/public values. PT and ES/FR locale rows/revisions remain byte-for-byte
   unchanged. EN listing navigation follows the newly published English URL.
5. At mobile390px, keyboard language navigation and both fields remain functional.
   Clearing EN Link, Save and Publish removes both Building-owned booking buttons;
   the old shared URL is not revived. EN listing falls back to the internal detail
   URL, while PT retains its own published pair. The UnitCard keeps its `#book`
   fallback, and the shared listing flag/legacy Avantio values remain intact.

No page errors. Hashes/counts for existing Building/Apartment identities, localized
snapshots, common state, translations, slugs, Pages and Blog rows remain unchanged,
excluding the expressly owned e750/e751 QA fixtures. No screenshots, geometry
assertions or aesthetic automation were performed; visual validation remains with
user on localhost.

## Source review

The new optional object is localized and absent from shared keys. Legacy reads do
not materialize it; explicit null link suppresses old fallback. Strict validation
allows unfinished draft labels, requires a label for a published nonempty link,
and restricts links to HTTP(S). The optional public label is emitted only for an
authored object. Both public CTA consumers use that pair. Existing publication,
source/CAS, shared-data, SEO and ISR paths remain in place. All four message sets
have the new field/help/flag keys. No new cross-slice internal imports, kernel,
package or schema changes were introduced.

## Commands and artifacts

- `source /private/tmp/central-hill-building-status-qa/env.sh` then
  `node /private/tmp/central-hill-building-booking-qa/independent/check.mjs` — exit0,
  `FUNCTIONAL_QA_PASS 5`.
- `node --check /private/tmp/central-hill-building-booking-qa/independent/check.mjs`
  and `git diff --check e029605` — exit0.
- Auth-only synthetic login200 saved `independent/auth.json` for root's one
  read-only main verification after restart; no extra content mutation.

Artifacts under `/private/tmp/central-hill-building-booking-qa/independent`:
`check.mjs`, `check.log`, `results.json`, `browser-errors.json`,
`protected-before.json`, `final-snapshots.json`, `auth.mjs` and private `auth.json`.
Final sample has an explicit empty EN Link and published custom PT Label/Link;
ES/FR retain legacy publications. No production/push/deployment action authorized
or performed by QA. Local main integration/runtime handoff belongs to root.
