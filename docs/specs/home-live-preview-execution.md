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
