# One Home Figures selector entry — 2026-11-05

## Expanded to every Home block

User subsequently identifies the same redundant parent/child choices for Hero,
Guests pitch and the rest of Home. Enable the existing selectAsGroup flag for
every Home section: one Element option per block opens all its fields. Child
bindings remain available to the inspector and private preview; clicking an
annotated child opens its owning block. FAQ title/group stay together, SEO keeps
its dedicated toolbar and the removed Avantio option stays excluded. Other Pages
are outside this follow-up. No content/URLs, schema, locale-state or persistence
changes. Same L0 manual-review/no-check/no-DB/no-commit delivery boundary below.

This follow-up changes only Pages admin/home-contextual.ts plus Pages/Backoffice
READMEs, this spec and current visual handoff. All prior pending work preserved.

## Original Figures refinement

User questions why Home statistics exposes Figures (whole section), Title and
Figures (counter list) when the whole section already edits both. Consolidate this
block into one Figures entry; title and counters stay together in its inspector.

Small UI refinement by root on main/509d785 with all earlier pending work retained.
Backoffice EditorSection gains optional selectAsGroup metadata; Pages enables it
only for Home stats. The shell renders a single standalone option, without a
duplicate optgroup caption or child options. Binding IDs and field definitions
remain intact for preview and inspector. Existing child selections resolve to
the whole block, including a child still selected locally before this refinement;
the inspector displays both fields and the selector shows Figures consistently.

Owned files: Backoffice page-editor-types.ts and ui/page-editor-shell.tsx; Pages
admin/home-contextual.ts and admin/ui/page-contextual-editor.tsx; Pages/Backoffice
READMEs, this spec and current visual handoff. No kernel, schemas, data, URLs,
locale draft/publication, preview transport or other page-group changes.

L0: source review only, user validates on running localhost3071. No tests, check
suites, automated browser QA/detector, database writes, save/publish or uploads.
No commit/push/deploy/restart requested. Preserve prior new/untracked artifacts,
the unused base-logo PNG and the existing runtime. Earlier functional verification
does not cover this later UI refinement.
