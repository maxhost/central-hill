# Guest Hero: editable booking label and URL per locale — 2026-11-05

User explicitly requests Hero Book Now label/link in Guest for each language.
Base509d785/main, current checkout; all preceding pending work, logo and3071
preserved. Simple root-only implementation, no additional writers.

Existing `hero.cta` is hidden and ignored by GuestPage (Settings label + fixed
English booking URL). The seed stores a stale “Browse Our Apartments” / Buildings
destination there; activating it would silently change untouched public content.
Preserve that object hidden/unused. Add optional localized `hero.cta_label` and
`hero.cta_url` booking overrides instead. URL accepts HTTP(S) or blank; absent/
blank retains the existing Settings label/fixed booking URL, even on published
snapshots. No SQL migration/backfill needed. Both preview and public GuestPage
consume the current locale's overrides; other destinations remain fixed/hidden.

Keep one Hero option with both fields together; target locales use URL inputs.
Real anchor selection uses existing ButtonLink.editorBinding seam (ADR0055),
public callers omit it. Target preparation preserves absent legacy overrides
instead of adopting newly authored EN overrides or creating false unsaved work.

Root owns Pages schema guest.ts, editorial-content.ts, admin/ui/page-contextual-editor.tsx,
ui/guest-page.tsx, focused new tests/guest-hero-button.test.ts and affected existing
guest-editorial-adapter/pages-admin tests, Pages README/data-model/visual handoff
and this spec. No SQL migration, DB backfill/write, upload, save/publish, commit,
push/deploy, kernel or shared settings change.

Acceptance: label+URL visible EN/ES/PT/FR, independent through locale switches and
template preparation/shared-field checks; preview+public same locale anchor;
Refresh preserves state, actual anchor click selects whole Hero, unsafe URLs
rejected, defaults/old snapshots remain valid. Node22 focused tests,
typecheck/lint/compile-mode build with unreachable synthetic DB env; scoped
isolated actual editor/action/GuestPage browser checks. No real staff DB session
or persistence cycle; existing3071 uses remote Neon.

## Results and limits

- Node22 four focused files (`guest-hero-button`, `guest-editorial-adapter`,
  `home-button-links`, `page-live-preview-media`), via tsx with Pages test tsconfig:
  13/13pass, exit0. New cases cover locale URL metadata, visibility, shared-field
  equality, preparation, HTTP(S)/unsafe/blank validation, and old ignored CTA plus
  absent overrides remaining clean. First new legacy test fixture used differing
  EN/target shared URLs; corrected fixture to share the same legacy baseline.
- Two affected `pages-admin.test.ts` cases selected by `^guestSchema: `:2/2pass,
  exit0 after aligning the expectation with the whole historical Hero CTA being
  hidden. Earlier broader `guestSchema` selection had8/9, with unchanged S4 test
  expecting manual teaser items to be visible arrays (they intentionally stay
  hidden). Do not unhide catalogues or claim that broad historical case passes.
- `pnpm typecheck`:exit0. Initial new test needed explicit PageEnvelope<guest>
  annotation (generic otherwise inferred Home); corrected before final check.
- `pnpm lint`:exit0 with seven existing warnings. `pnpm build
  --experimental-build-mode compile`:exit0 on final product source, with synthetic
  unreachable DB/auth/media env overrides. No full prerender/DB claim.
- Actual editor, shell/bridges/live action/adapter/full GuestPage Next fixture on
  3193: independent label+URL edits in EN/ES/PT/FR, Refresh, reopening all four
  unsaved locale states, FR mobile and clicking the real anchor to open complete
  Hero all pass.14render POSTs only; zero uncaught browser errors. Public GuestPage
  (preview=false, synthetic injected snapshots) verifies exact label/href in all
  four locales and no editor annotations. Blank override with stale historical
  Browse Our Apartments/Buildings CTA still renders Book Now/original booking URL.
  Public persistence/getter/Save/Publish not exercised; shared dependencies/auth/
  media are synthetic and mutation actions disabled. Initial browser attempt on
  the superseded existing-field strategy timed out on its anchor; final optional
  override fixture passes; both artifacts retained.
- Independent read-only source review identified the legacy activation risk and
  confirmed the optional-override correction. It also identified the test-fixture
  shared-URL mismatch above. This is source review, not independent runtime QA.

Evidence retained at `/private/tmp/central-hill-guest-hero-button-fixture/`:
browser-final-result.json/browser-final.log, fixture source/config,
tests-final.log, admin-tests-confirmed.log, typecheck-final.log, lint-final.log,
build-final.log. `git diff --check` passes. Stop only owned3193fixture; original
3071/user state and unrelated pending work/logo preserved. No DB writes,
save/publish/upload, commit/push/deploy or existing server restart.
