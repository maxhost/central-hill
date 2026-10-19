# ADR0039: Home contextual editor pilot

Accepted 2026-10-18. Base c28615f. User authorized implementation of the closed Home plan.

Backoffice owns a page-independent contextual shell and private iframe bridge, exported
through its contract. Pages owns the Home adapter, bindings, schema, persistence and preview.
The private authenticated preview uses the same Home renderer as public RSC/ISR, with optional
preview-only instrumentation. Public calls omit instrumentation and never load bridge code.
No shared-kernel changes are planned; no alternative renderer, Forms placement, Avantio
configuration, public submissions, live/durable drafts or rollout to other pages.

Home source writes atomically synchronize kernel translation source rows and compare revisions.
Stable list identities preserve legacy numeric translation keys and use @UUID for new rows;
retired identities cannot be reused. Target writes use the existing kernel translation table,
source/revision guards and needs_review/approved semantics. Shared structure remains EN-owned.
Private preview is noindex, uncached, staff-only and blocks navigation/submission; Avantio
is represented by an external-integration notice, never an active reservation form.
