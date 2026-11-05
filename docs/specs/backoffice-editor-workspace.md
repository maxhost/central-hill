# Focused visual page editor — 2026-11-05

User requests hiding the Backoffice sidebar while editing a page, with an icon to
reopen it, and making the editing-options column 20% wider using the reclaimed space.
Root handles this small local UI change on main, base `c9484b6`. Preserve the pending
Pages list/sidebar organization and the unrelated untracked Central Hill logo.

## Implementation

- New internal Backoffice `ui/admin-workspace.tsx` owns layout visibility only.
  `/admin/pages/[key]` starts with the desktop sidebar hidden. An accessible topbar
  icon toggles it; no browser storage, cookie, window-dependent initial render or DB
  write. A pathname-keyed layout starts fresh on route changes. The editor remains
  mounted when the toggle changes, preserving its current local edits/selection.
- `ui/admin-shell.tsx` remains server-rendered for staff identity and contributed nav.
  It passes sidebar, identity and sign-out action slots into the client workspace.
  Authentication and role filtering stay in their existing server boundaries.
- Page editor routes use full available main width; other BO screens retain
  `max-w-6xl`. Sidebar/toggle remain desktop/tablet (`md` and up); below `md` the
  existing hidden-sidebar layout remains. No new mobile drawer is introduced.
- Shared `ui/page-editor-shell.tsx` inspector is now 500px on the left at `xl`, per the user's
  latest follow-ups (320→384→400→450→500px, then moved left). Canvas sits on the right, gets remaining width and uses its existing ResizeObserver
  fit scaling. At smaller widths, preview/inspector keep the existing stacked layout.
- `messages/{en,es,pt,fr}.json`: Show/Hide navigation labels for the icon button.
- The shared editor header (title, locale selector, state and Save draft/Publish)
  is sticky at viewport top with an opaque background above preview controls,
  per the user's subsequent screenshot request. Page navigator remains in flow.
- Backoffice README and current visual handoff document this change.

No core/kernel, public contracts, page adapters, schemas, draft/publish logic,
translation data or persistence changed. All nine visual Pages editors share the
same workspace. Other admin routes still start with the sidebar visible.

## Delivery boundary

Subsequent user requests started localhost3071 for review and corrected the ignored
local auth URL to that port. At the end of this arc, user authorizes a local checkpoint
commit before clear, without push/deployment. Resolve its hash with `git log -1`.
Earlier local-only implementation boundaries below are historical.

Local source only. No commit/push/deploy, database writes, form submissions or restart
of stopped localhost3071 requested. Aesthetic L0: no automatic tests/check suites or
browser QA. Runtime/visual review belongs to the user; no verification claim is made.
