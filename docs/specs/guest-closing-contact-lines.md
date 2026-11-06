# Guest closing panels: editable contact lines — 2026-11-05

User requests the missing contact-text fields under each Closing dual CTA button.
Current guest line is Settings phone/email; owner also includes WhatsApp. Add an
optional localized contact_line to each panel; each text may be independently
authored in EN/ES/PT/FR. Blank/absent keeps its existing Settings fallback, no
baseline content change. No SQL migration, backfill or Settings write.

Both fields stay in the existing single Closing dual CTA inspector, named Guest
panel · Contact line and Owner panel · Contact line using existing four-locale
labels. Owner's line remains outside the separate contact-dialog fields group.
Preview/public GuestPage consume each locale's override through existing renderer.
Preserve absent target overrides when adopting an EN template, just as the new
Guest Hero booking overrides; opening an old locale must not introduce EN text
or false dirty state. Contact form title/intro and preview toggle remain intact.

Base509d785/main/current checkout; preserve all prior pending changes, unused logo,
remote Neon env and running3071. Simple root-only write set: Pages schemas/guest.ts,
admin/home-contextual.ts, editorial-content.ts, ui/guest-page.tsx,
tests/guest-contact-lines.test.ts, relevant guest adapter test, README/data-model,
this report and visual handoff. No kernel, DB/schema migration, upload, save/
publish, form send, commit/push/deploy or original-server restart.

Acceptance: both lines editable/live-rendering per language and used by public
renderer; clear restores Settings, including Settings changes; old snapshots
valid/clean and target independent. Node22 scoped tests/typecheck/lint/compile
with synthetic unreachable DB; actual editor/action/full GuestPage isolated
browser checks with synthetic shared data, no real staff persistence cycle.
## Preview focus finding / scoped extension

The initial compiled-fixture pass confirms EN/ES but loses the first PT edit;
diagnostic replay loses first ES edit. Captured bridge traffic shows ready/select/
preview working, but the parent field is still blank and the payload is blank.
This is not a rejected render: automatic ready synchronization sends two selection
commands that focus the iframe even while the user starts editing an inspector
field. Add optional boolean focus to select messages: automatic ready/selection
synchronization scrolls/highlights without taking focus; explicit selector actions
retain focus behavior. Keep origin/source/instance/ID guards and reject nonboolean
focus flags. Root extends its exact write set to Backoffice page-editor-types.ts,
ui/page-editor-bridge.ts, ui/page-editor-shell.tsx, ui/page-editor-preview-bridge.tsx,
tests/page-editor-bridge.test.ts and README. No new kernel or persistence seam.

## Verification and limits

- Node22 `tsx --tsconfig src/slices/pages/tests/tsconfig.json --test` on
  guest-contact-lines, guest-editorial-adapter, guest-hero-button and Backoffice
  page-editor-bridge:16/16pass, exit0. Covers new field visibility/labels, locale
  preparation/shared guards, legacy absence/blank/dirty behavior, length bounds,
  optional focus flag and existing dialog/message guards.
- `pnpm typecheck`:exit0. `pnpm lint`:exit0, seven existing warnings.
- `pnpm build --experimental-build-mode compile`:exit0 with unreachable synthetic
  DB/auth/media overrides; no full product prerender or DB/persistence claim.
- Scoped built Next16.2.9 webpack fixture3191 uses actual editor/shell/bridges/live
  action/GuestPage, dialog/form and project styles with synthetic shared queries,
  auth and media. Save/Publish/uploads/lead sends disabled. Full fixture build,
  typecheck and synthetic static generation pass.
- Final Playwright pass: both contact lines render after edits in EN/ES/PT/FR,
  Refresh retains state/iframe URL, reopening all four tabs retains their values,
  blank/whitespace restore the correct Settings phone/email/WhatsApp lines,
  mobile390editing works. Both lines remain outside the bordered dialog group;
  that group retains exactly title/intro controls and Show/Hide, with live modal
  title still updating. Public preview=false snapshots use each locale's values,
  emit no editor bindings, and absent/blank legacy values retain Settings defaults.
  Nineteen preview POSTs only; no uncaught browser errors or mutation requests.
- Focus regression confirmed on the previous compiled fixture: replaying a valid
  ready while a field is focused changes parent activeElement to IFRAME. After
  correction the same replay keeps the field focused; immediate language-switch
  edits stick in their controls and render. Initial PT failure and ES diagnostic
  (empty control + empty payload, not rejected rendering) retained as evidence.
  This does not claim every earlier preview timeout had this single cause.
- Independent read-only source reviewer found no blocker in the contact fields
  or the scoped focus correction. Source review is not independent runtime QA.

Evidence: `/private/tmp/central-hill-guest-contact-lines-fixture/` contains fixture
source/config, check-initial.mjs/check.mjs, browser-result.json/browser.log (partial),
browser-diagnostic-result.json/browser-diagnostic.log, focus-diagnostic.mjs,
browser-final-result.json/browser-final.log (final passing run), tests-final.log,
typecheck-final.log, lint-final.log, build-product-final.log and
build-fixture-final.log. `git diff --check` passes. No actual staff/DB session,
Save/Publish or live Settings-write test; fallback continues using the unchanged
getGlobals read. Only owned3191fixture stopped;3071 and all earlier work/logo
preserved. No commit/push/deploy or original server restart.
