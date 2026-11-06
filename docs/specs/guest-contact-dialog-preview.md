# Guest owner contact form in the live preview — 2026-11-05

User explicitly requests a button in the editing form to show the form in preview
and see the text being edited. Base509d785/main/current checkout; preserve all
previous pending changes, unused logo, remote Neon env and running3071.

Bounded root-only implementation: a Show/Hide contact form control in Guest's
Closing dual CTA inspector opens the actual Settings ContactDialog in the iframe.
Title/intro update from current unsaved locale payload through the existing
renderer. Keep form visible through live renders/Refresh and locale changes;
hide outside Closing dual CTA. Hide control, modal Close/backdrop and Escape
close it. Opening the preview never saves, uploads, submits, navigates or publishes.
Public dialog behavior stays unchanged; navigation/submission/input blocking
remains active in the preview apart from its explicit dialog close controls.

Contract first: optional PageEditorAdapter.previewDialog {bindingId, open,
onOpenChange}, guarded same-origin/source/instance/allowlisted binding dialog
messages with boolean open. Private bridge owns `central-hill-preview-dialog`
CustomEvent {bindingId,open} plus a document marker to restore visibility if the
dialog mounts after the command. Settings ContactDialog opts in only through
editorPreviewId, supplied only by GuestPage preview; public callers omit it.
No runtime foreign internals imported; existing public component contracts used.

Root write set: Backoffice page-editor-types.ts, ui/page-editor-bridge.ts,
ui/page-editor-preview-bridge.tsx, ui/page-editor-shell.tsx, tests/page-editor-bridge.test.ts,
README; Settings ui/components/contact-dialog.tsx and README; Pages
admin/ui/page-contextual-editor.tsx, ui/guest-page.tsx, README; messages four JSONs;
this spec/visual handoff. No kernel/schema/DB/storage/persistence changes.

Acceptance: EN/ES/PT/FR show/edit/Refresh/close/reopen and mobile; typecheck/lint,
focused bridge tests and compile-mode build with synthetic unreachable DB env;
actual editor/action/GuestPage/ContactDialog/ContactForm isolated browser fixture,
no real staff login/DB writes/real form sends. Independent scoped source review
after integration. No commit, push, deployment or original-server restart.

## Functional verification (before the later L0 grouping)

- Node22 `pnpm typecheck` and `pnpm lint`:exit0; seven existing lint warnings.
-13focused cases pass via `tsx --tsconfig src/slices/pages/tests/tsconfig.json
  --test` on Backoffice page-editor-bridge, Pages guest-hero-button and
  page-live-preview-media. New dialog cases reject invalid boolean/unknown ID/
  origin/window/instance/channel while preserving bounded live payload checks.
- Product `pnpm build --experimental-build-mode compile`:exit0 with synthetic
  unreachable DB/auth/media overrides. This is not full production prerender.
- Actual editor/shell/bridges/live action/GuestPage/Settings ContactDialog/Leads
  ContactForm + project CSS in isolated fixture3192. Shared queries/auth/media
  synthetic; all persistence and lead sends disabled. Confirmed EN/ES/PT/FR live
  title/intro, continuous inspector focus, Refresh preserving modal, close/reopen,
  modal Close/backdrop, Escape from iframe and parent inspector, section changes,
  mobile390preview and blocked submit. Opening does not dirty the snapshot.
  Nine preview POSTs only and zero uncaught page errors. Actual public dialog
  without preview prop opens/closes with expected title/intro and no private attrs.
- Initial dev-browser pass confirmed EN then the fixture fully reloaded during ES,
  resetting editor state (no uncaught error). Final confirmation uses local built
  fixture without HMR and passes all cases. Fixture bootstrap needed removal of
  an unused inherited Buildings route and its missing @/* TS alias; no product
  workaround. Fixture's full webpack build/typecheck/static generation passes,
  with only synthetic/no-DB routes.
- Independent source review found no public/submission blocker; its inspector-
  Escape limitation was fixed and verified in the browser. This is independent
  source review, not independent authenticated runtime/persistence QA.

Artifacts: `/private/tmp/central-hill-contact-dialog-preview-fixture/`, including
fixture source/config, browser-dev-result.json/browser-dev.log (partial),
browser-result.json/browser-final.log (final pass), desktop.png/mobile.png,
build.log, build-fixture.log, typecheck-final.log and lint-final.log. Desktop
capture shows the real fixed overlay/form; mobile capture is the scrolled
inspector, while mobile modal title/visibility is functionally asserted. No mobile
modal visual-approval claim. No actual staff/DB session, form send or save/publish.

## Later user-requested L0 grouping

User requests Show/Hide immediately above Owner contact dialog title, enclosed
with title/intro inside a border matching Owners Why benefits. Moved controls
from the section heading to the two contact fields, grouped by their exact paths
in EN and target inspectors. Wrapper reuses `space-y-3 rounded-md border
border-line p-3` from AboutListEditor's Benefits item. Help note stays inside;
button directly precedes title/intro. Other fields retain their order and controls.

This later change is presentation only: source review/manual localhost3071 review,
no automatic tests/QA/suites/detector/browser after grouping. Functional evidence
above precedes this refinement. No data or preview/dialog behavior changed.
Stop only owned3192fixture; original3071, all earlier work and logo preserved.
