# Visual editor page navigator — 2026-11-05

User authorizes a horizontal page navigator above device preview options, modeled on
the supplied screenshot, to move directly between Pages editors. Unsaved local changes
require an English modal with Cancel / Continue. Root handles this bounded feature
on local main (base `c9484b6`); preserve all earlier pending BO layout/sidebar/list
changes, ignored local authentication-origin correction and untracked logo.

## Result

- Pages owns `admin/ui/page-navigation.tsx`. A segmented, horizontally scrollable
  Page strip highlights the current page and navigates directly to `/admin/pages/[key]`.
- Pages list and navigator share `admin/page-order.ts`: Home, Owners, Buildings,
  Real Estate, Guest, Guides, Services, About, Blog. Labels use the existing Pages
  translations; no public page or route is changed.
- Backoffice adds optional `PageEditorAdapter.pageNavigation` rendered above its
  preview/inspector grid, hence above device controls. No Pages internals enter
  Backoffice; existing 500px left inspector/preview positioning is preserved.
- `PageContextualEditor` supplies an aggregate dirty flag across started locales:
  working content is compared to that locale's saved draft, otherwise publication.
  Unvisited automatically prepared target snapshots do not cause a false warning.
  Started-locale tracking moves from a ref to state so navigation can derive this flag.
- Saved drafts need not be published to navigate. An unsaved change in another visited
  language still prompts even if the currently visible language is clean.
- Native modal dialog: “Unsaved changes” / “Your changes haven't been saved. If you
  move to another page, they will be lost.” Cancel receives initial focus; Escape
  cancels, native modal focus containment/return applies, and Continue confirms leaving.
- Navigation is disabled while preparing media, saving or publishing, or transitioning
  to the chosen page. Clicking the already active page does nothing.
- Leaving through the navigator dequeues only this page's tracked blob previews and
  revokes their URLs, without uploading files, touching persisted assets or deleting
  saved drafts. Cancel keeps all local work and media. Navigation does not save/publish.
- Modal/strip copy supplied in EN/PT/ES/FR; BO remains pinned to English as requested.

## Owned files

Pages `admin/page-order.ts`, `admin/queries.ts`, `admin/ui/page-navigation.tsx`,
`admin/ui/page-contextual-editor.tsx`; Backoffice `page-editor-types.ts` and
`ui/page-editor-shell.tsx`; four locale message files; Pages/Backoffice READMEs,
this spec and current visual handoff. No kernel, DB/schema, public form, ISR,
provider integration or publication engine changes.

## Review / delivery limits

After local iteration, user authorizes the combined BO checkpoint commit before clear,
without push/deployment. Resolve its hash with `git log -1`. No new checks or persistence
actions are included in this checkpoint; earlier boundaries below are historical.

Guard scope is the new page navigator, not browser Back/refresh, sidebar links or
external navigation. No new global navigation interception is introduced.

Per user's existing review preference, no automatic tests/check suites, browser QA,
actual draft saves/publications, media uploads, DB changes or form submissions run.
Source review only; runtime review belongs to the user on localhost3071. No commit,
push or deploy requested. User can review clean switching, Cancel/Escape/Continue,
and an unsaved edit in another language without needing to persist any content.
