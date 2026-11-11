# Translations retirement QA harness

Readable sources used for product `b30a18c85fbb916e62bf4d5ada97bf0f0169a5d9`.
Final functional result:52/52 principal units; Q6 pending0. See the approved QA
report and `SUMMARY.md`. Copy only this allowlisted folder into
`scripts/qa/translations-retirement/`; originals/evidence remain in the private
artifact directory. No env, password, session, cookie, populated fixture JSON,
results directory, build or cache is shipped.

## Parameters and exact boundaries

Node22 and dependencies from the approved checkout are required. Four MTS inputs
were mechanically transpiled to readable MJS with TypeScript (no bundle/minify).
All delivered JS/CJS is formatted with Prettier3.8.4. Scripts importing product
`.ts` modules still use its tsx loader and tsconfig.

```bash
export SOURCE_ROOT=/path/to/approved-checkout
export QA_RUNTIME_ROOT=/path/to/isolated-runtime
export FIXTURE_ARTIFACT_DIR=/private/tmp/translations-retirement-reproduction
export QA_BASE_URL=http://localhost:3081
export QA_LOGIN_FILE="$FIXTURE_ARTIFACT_DIR/login-private.json"
export QA_ENV_FILE=/private/tmp/authorized-own-qa.env.local
export CANDIDATE_COMMIT=b30a18c85fbb916e62bf4d5ada97bf0f0169a5d9
export HARNESS_ROOT="$SOURCE_ROOT/scripts/qa/translations-retirement"
export NODE_BIN=/path/to/node22
export TSX_TSCONFIG_PATH="$SOURCE_ROOT/tsconfig.json"

qa() {
  "$NODE_BIN" --env-file="$QA_ENV_FILE" --require "$HARNESS_ROOT/runtime.cjs" \
    "$HARNESS_ROOT/$1" "${@:2}"
}
qa_source() {
  "$NODE_BIN" --env-file="$QA_ENV_FILE" --require "$HARNESS_ROOT/runtime.cjs" \
    --conditions=react-server \
    --import "$SOURCE_ROOT/node_modules/tsx/dist/loader.mjs" \
    --import "$HARNESS_ROOT/register.mjs" "$HARNESS_ROOT/$1" "${@:2}"
}
```

DB identity is deliberately **not** configurable: host/path/user/SQL DB+role must
be exactly `translationsretirementqa.local` / `translationsretirementqa`.
Browser actions accept only loopback HTTP3081. The preload allows only that target
and the separately named `translationsretirementunitqa` via local proxy4558; it
does not permit the user's original DB or arbitrary names ending in qa. The unit
target is not used for browser fixtures. The env file is provisioned privately by
the orchestrator; this package neither creates/drops databases nor copies content,
accounts or sessions from another environment.

## Fresh baseline, before build

Use only an authorized fresh schema with the existing30 migrations. It contains
four migration-owned Page scaffolds and migration FAQ data; it is not empty.
`schema-preflight.mjs` requires exactly those scaffold keys/counts and records IDs/
hashes. `seed.mjs --apply` adopts only those verified fresh rows using guarded CAS,
inserts five absent Page keys and new synthetic references, and preserves migration
FAQ rows. It refuses a populated/reused setup. Never delete/restore existing Pages
or broaden the identity guard to rerun this against a completed environment.

```bash
qa schema-preflight.mjs
qa_source seed.mjs --apply
qa extend-gallery.mjs
qa supporting-service.mjs
qa_source create-test-admin.mjs
qa_source inventory-pages.mjs
qa hidden-field-audit.mjs
qa resolve-manifest.mjs
qa apply-manifest-policy.mjs
```

The seed prepares all fields/arrays,4custom publications per document, local PNG
media, own FAQ groups/legacy targets and shared references. Gallery extension and
supporting Service are baseline-only revision0/CAS operations before any E2E.
The generator now correctly treats `accept=document` as optional empty; the old
PNG-in-PDF fixture defect is not intentionally reproduced. The own Admin is made
through BetterAuth signup, grants only that new user, writes credentials0600, and
subsequent browsers use normal login. `register.mjs` replaces the server-only
marker for standalone product-helper imports; it does not replace DB/auth/media
implementations or bypass the exact connection guard.

After baseline/media freeze, the orchestrator builds and starts the isolated
production runtime3081 using its own env. No writes through SQL during test units.
All tested field values are authored in the UI. Do not flush caches/rebuild to
make a publication appear.

## Gates and52 principal units

The original incremental versions are documented in the report. These sources can
reproduce their functional checks on the final approved product:

```bash
qa q0-browser-observe.mjs
qa q1-routes-service.mjs
qa q2-guide-pt.mjs
qa q2-nested-alt-retest.mjs
qa page-runner.mjs about fr full incremental
qa q2-about-fr-blank.mjs
qa q2-ui-absence.mjs
qa q3-snapshot.mjs
```

Q4a: Home4, then `variant-popular.mjs`, Owners4, Guests4.
Q4b: About4, RealEstate4, Buildings4.
Q4c: Services listing4, Guides listing4, Blog listing4.
Q5a: `variant-secondary-cta.mjs`, Sidebar4, then Post4.
Q5b: Service4. Q5c: Guide4.

```bash
# Normal Page unit (keys: home/owners/guest/about/real_estate/buildings/services/guides/blog)
qa page-runner.mjs home en full final
# Sidebar is a separate4-unit surface, on the secondary own Post with no CTA.
qa page-runner.mjs blog en full sidebar
# Normal entity unit (post/service/guide)
qa entity-runner.mjs post fr full final
```

For Owners/Post/Service/Guide use this order **inside their four units**:
EN draft; ES draft; PT full; EN publish; ES publish; FR full.
For Owners use page-runner; for the other three use entity-runner. This leaves
non-null EN/ES drafts during PT Publish and verifies exact revisions, anonymous
public baselines and draft markers absent in HTML/RSC as well as DOM.

Every unit writes a checkpoint. `publish` resumes a saved draft without another
Save. `verify` resumes only assertions after an already-completed Publish. Diagnose
and inspect its checkpoint/revision before resuming; do not blindly rerun a full
unit. Native input values, TipTap block selection+keyboard, field paths after Save,
reloaded controls, publication and actual public attributes are checked. Generic
Page target controls are mapped by descriptor order/count only where IDs are
actually absent; EN control observations are not extrapolated to other tabs.

## Q6

```bash
qa variant-service-conditionals.mjs
qa variant-guides-empty.mjs
qa q6-legacy-readers.mjs
for qa_family in page post service guide; do qa q6-mobile.mjs "$qa_family"; done
qa q6-inherit-ui.mjs guide
qa q6-compatibility.mjs
qa_source q6-conservation.mjs
qa scoreboard.mjs
qa final-rollup.mjs
```

Run Archive/Restore empty Guides **before** creating any additional Guide. Service
variants restore external/auto; mobile cases restore whole publications. Legacy
FAQ/ALT checks restore own refs/ALT through UI and compare historical hashes plus
original seed transactions. The FAQ click uses native summary, including its
separate decorative plus. Public contexts have no staff cookies.

`q6-inherit-ui.mjs guide` creates a new source-only Guide with a text section and no
uploads. ES is404 while only working projects EN; explicit inherit publication is
a saved ES snapshot; later EN does not live-replace it; UI text edits acquire
custom. Pages have no Reset UI; new Post/Service publication requires cover upload,
so their secondary inheritance requirement is pure/source, not a fake browser pass.
Calling the optional `service` variant reproduces that required-cover limit and
may leave an isolated own EN draft; it is not part of the successful browser path.
The helper supports `--resume-en` only for a verified already-created first draft.

The pure42-case support report/source comes from the separately reviewed A
artifact folder, not from a fabricated DB response. Original-user conservation is
also separate: the orchestrator supplies before/after42-table fingerprint JSON;
QA compares those files without connecting the user's DB. Final rollup requires
`results/q6-protected-user-review.json` with that completed comparison. It must not
infer user-data conservation from hashes of the newly created QA database.

Static renderer exceptions are explicit in `apply-manifest-policy.mjs`: legacy
hidden fields, Owners helper/secondary note, Service duration, decorative Blog
Hero ALT, EN Guide canonical classification. They are not public text-edit passes.
`final-rollup.mjs` resolves historical conditionalPending through Q6 evidence,
emits pending0 only when every required result is present, and writes final
field-level statuses/SHA. Historical attempt artifacts are kept separately.

## Verification after packaging

Formatting/path parameters do not require rerunning52. Use Node22 `--check` on each
MJS/CJS, then the repository's scoped ESLint after copying inside its scripts path.
The orchestrator owns final review/copy/commit; this package does not deploy,
restart the user's server, mutate main, or perform automatic fixture cleanup.

Final repository copy: Node22 syntax33/33 and scoped ESLint0 errors/0 warnings.
The orchestrator removed only unused imports/bindings (preserving awaited actions);
no product code changed and no browser cycles were repeated for packaging.
