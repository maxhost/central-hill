# Home live preview — execution

2026-10-18. User requests preview of current unsaved form state; supersedes previous
saved-only/no-live-preview rule for Home only. No autosave, DB write, upload flush,
public cache invalidation or publication from preview. Base5ea4608, clean integration
page-drafts/integration at /private/tmp/central-hill-page-drafts-integration.

## Contract and approach

Reuse authenticated preview route and the SAME HomePage RSC renderer. Shell sends a
bounded serializable working payload to its same-origin iframe after300ms idle and on
ready/refresh. Instance/origin/window checked. Renderer is a staff-only read action,
validates draft shape + media refs, resolves referenced persisted media or validated
same-origin local blob previews, and returns React content without storing it. No DOM
text patcher or duplicate Home rendering tree. Public paths never mount live wrapper.

Generic Backoffice contracts: PageLivePreviewResult (ok/content or validation/server),
PageLivePreviewRenderer(payload:unknown), adapter.previewPayload?:unknown. Bridge preview
message has monotonic revision and payload. PageEditorLivePreview takes server action
as renderPreviewAction, original children, bindingIds/instance, replacing only Home main.
Drop obsolete responses; bounded one in-flight and one latest pending payload. Keep
last valid output on invalid input/error and expose localized status. Render updates must
not steal parent input focus or change iframe URL/reload; preserve iframe scroll. Rebind
selection to fresh DOM after content replacement without refocusing or repeating ready.
Refresh resends local state; locale instances prevent late EN overwriting ES.

Home payload: { envelope: PageEnvelope, localMedia: Record<uuid,AdminMediaPreview> }.
Local blob media stays browser-only data in memory, never gets uploaded by preview.
NodeField optional third callback argument carries MediaField preview; other page forms
remain compatible. Local selected media thumbnails survive field navigation. Existing
Save draft upload flush/publish and per-locale revisions stay intact.

## Ownership and isolated writers

Root lands contracts/exports + ADR/spec first, then writers branch from that commit.

- Root: this spec, docs/decisions/0040*, page-locale-drafts spec/plan/handoff/delivery,
  AGENTS, Backoffice page-editor-types.ts/contract.ts, Pages contract.ts/editorial-types.ts,
  app/(admin)/admin/preview/home/page.tsx, messages/en|es|pt|fr.json; final integration/checks.
- A renderer: Pages admin/live-preview-actions.tsx, admin/live-preview-validation.ts,
  admin/ui/home-contextual-editor.tsx, admin/ui/schema-fields.tsx,
  tests/home-live-preview.test.ts. Worktree/private/tmp/central-hill-home-live-render,
  branch home-live/render. No foreign edits.
- B bridge: Backoffice ui/page-editor-shell.tsx, ui/page-editor-bridge.ts,
  ui/page-editor-preview-bridge.tsx, new ui/page-editor-live-preview.tsx,
  tests/page-editor-bridge.test.ts. Worktree/private/tmp/central-hill-home-live-bridge,
  branch home-live/bridge. No foreign edits.
- Independent QA after integration: docs/specs/home-live-preview-qa.md only; harness/logs
  /private/tmp/central-hill-home-live-qa. No nested delegation or implementation fixes by QA.

Existing own synthetic pagedraftsqa DB5618/proxy4518/storage9067, console email; reuse safe
/private/tmp/central-hill-page-drafts-qa/env.sh. Existing3065 and all prior environments
preserved. Local integration3067 is updated after build. No production env copied. Separate
writer node_modules from approved local dependency tree; no builds on writer branches.

## Acceptance / bounded verification

1. Type naturally EN single/multiple and ES textareas: preview updates without Save, form
   keeps focus/caret, iframe URL unchanged, correct localized output, no input lag.
2. Structural stats/list edits and local selected image render through same renderer.
   New media remains queued, no media_asset/object upload caused by preview.
3. Refresh retains unsaved preview; switching languages preserves independent work and
   stale responses cannot replace new state; preview selections work after rerenders.
4. Editing/preview leaves page_content, page_locale_content and translation unchanged;
   public EN/ES remains published, publish disabled while selected language dirty.
5. Staff/origin/source/instance validation, incomplete/invalid input retains last valid
   preview with honest localized feedback; no arbitrary URLs or unsafe rich HTML.

Max4 new focused cases: A2 for validation/blob refs; B2 bridge preview message guards.
Existing bridge tests may run. One browser EN/ES desktop/mobile pass including continuous
keyboard input (not only fill), image fixture, refresh and locale switch, DB/public
before-after. No repeated nine-case persistence suite or old149 tests.
Root once integrated: Node22 pnpm typecheck, lint, exec tsx --test explicit above files,
pnpm build with safe env. No migration/db:check needed. Logs under home-live-qa. QA consumes
those logs, no duplicate checks; one confirmation only for actual defects.

Local commits only, no main/push/deployment/GitHub/production. Handoff and preview3067 final.

## Integration

Contracts5a9257d; renderer733b7e5/ad0c2f8 (A commitsbe03e52/c13d91f);
bridge9cfc90c cherry-picked by root. Root additionally owns Pages/Backoffice README
updates documenting the optional read-only seam. No kernel change or migration.
Page Editor Refresh resends local snapshot without iframe reload when live/ready; if
not ready it retains existing iframe retry. Node22 focused A2/B5 tests and lint passed
on branches; global checks only below on integrated code.

## Integrated checks

Code8da3519 (base5ea4608); safe env pagedraftsqa only, Node22.23.3.
Logs/private/tmp/central-hill-home-live-qa:

| Command | Exit | Evidence |
|---|---:|---|
| pnpm typecheck |0|typecheck.log final|
| pnpm lint |0|lint.log;7 existing warnings|
| pnpm exec eslint src/slices/pages/admin/live-preview-actions.tsx |0|lint-mime-fix.log|
| pnpm exec tsx --test src/slices/backoffice/tests/page-editor-bridge.test.ts src/slices/pages/tests/home-live-preview.test.ts |0|tests.log;7 cases,4 new|
| pnpm build |0|build.log final|

Initial typecheck/build caught PageMedia.mime optional vs strict MIME helper; A fixed
to explicit media.mime??"" (01b58cf→8da3519), rejecting unknown types, then both passed.
Initial failed logs preserved with initial-failed suffix. Lint/tests ran on597fb2d; after
that one-line type-mapping correction only affected action lint was repeated, test files
unchanged. No broad persistence suite or migration check required. Boundaries reviewed:
public Home routes/renderer unchanged; all cross-slice new imports through contracts;
no kernel edits, DB write/queue flush/ISR call in read renderer. Four-locale keys match.
Design detector once on changed UI returns[]; no styling polish loop.
Production3067 serves8da3519, root PID25042/session29066, synthetic storage9067 remains
PID90200/session59103. Home3065 unchanged. Independent QA browser completed; see home-live-preview-qa.md.

## Delivery / browser result

Executable8da3519: single EN/ES desktop/mobile edit pass passed continuous typing/focus/caret,
latest-wins delayed request, Refresh with stable iframe URL, language separation, structural
stats changes, decoded local blob image without PUT/upload, scroll/selection after rerender
and invalid-input last-good output. Read-only continuation confirmed full content/translation
rows + media count byte-identical, public EN/ES headline/SEO unchanged, reopen/reload saved
baseline and no blobs/browser errors. No Save draft or Publish calls in this QA.

Harness-only continuation details: full public innerText included animated counters0 vs25/12;
use stable published headline/SEO and complete DB snapshot for final comparison. The fresh
APIRequest login after public pages (cookies present) needed the normal Origin header;
header addition resolved it. Initial non-ok boolean lacked captured status, so no specific
403/rate-limit claim. No app/auth code changed or full edit sequence repeated.

No new migration/dependency/kernel changes. Integrated branch remains page-drafts/integration,
no main/push/deploy/GitHub/production. Worktrees home-live/render/bridge retained with
be03e52/c13d91f/01b58cf and9cfc90c. Only root closure docs follow executable code.

Independent QA approved8da3519 with no open defects; report commitf8d7c91. Final
closure only documentation, no code changes after verified candidate. Git clean after
closure commit; preview3067 remains available.
