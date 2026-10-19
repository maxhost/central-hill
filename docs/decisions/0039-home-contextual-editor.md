# ADR0039: Home contextual editor pilot

Accepted 2026-10-18. Base c28615f. User authorized implementation of the closed Home plan.

Backoffice owns a page-independent contextual shell and private iframe bridge, exported
through its contract. Pages owns the Home adapter, bindings, schema, persistence and preview.
The private authenticated preview uses the same Home renderer as public RSC/ISR, with optional
preview-only instrumentation. Public calls omit instrumentation and never load bridge code.
The orchestrator owns a minimal opt-in `Hero.editorBindings` kernel instrumentation seam: 
background/root, eyebrow and subtitle annotations, no style or layout changes. All public calls
omit it; no annotation values or bridge JS reach the public page. Ordinary background clicks
resolve the media binding even when the video itself is behind the scrim/content container.
No other shared-kernel changes; no alternative renderer, Forms placement, Avantio
configuration, public submissions, live/durable drafts or rollout to other pages.

Home source writes atomically synchronize kernel translation source rows and compare revisions.
Stable list identities preserve legacy numeric translation keys and use @UUID for new rows;
retired identities cannot be reused. Target writes use the existing kernel translation table,
source/revision guards and needs_review/approved semantics. Shared structure remains EN-owned.
Private preview is noindex, uncached, staff-only and blocks navigation/submission; Avantio
is represented by an external-integration notice, never an active reservation form.
