# ADR0081 — Shared About Contact assignment

About owns an optional nullable `contact.form.form_id` in its existing JSON envelope.
Its published EN snapshot is the sole common assignment for all four public locales;
target locale text snapshots remain independent. Absence/null retains the original
About contact. No schema migration or backfill is required. Header Settings keeps
its separate assignment.

The contextual editor edits the assignment only in EN. Its authenticated ephemeral
preview receives the explicit EN working reference, including unsaved edits while
viewing a target language. Preview resolves a saved definition and remains inert.
Public composition reads only the published assignment and an explicit public DTO.
Recipient, test data and pending translations do not enter that DTO.

Pages exports its placement reader, usage and capture guards only through a
server-only `server-contract.ts`, consistent with ADR0080. Forms reuses its public
runtime, saved definition validation, rate admission and notification pipeline.
Leads records About captures with source_page=about-contact and immutable fields.
Idempotency is bound to verified placement; prior header captures retain replay
compatibility. A published assignment identity uses form ID and published_at,
independent of editorial draft revision. Publishing EN refreshes this identity;
saving its draft does not invalidate the open public form.

About Save/Publish, Forms Save/Archive, Settings assignment and capture share the
existing HEADER_CONTACT_LOCK. The kernel runs its advisory lock statement then
fresh mutation snapshot in a READ COMMITTED Neon HTTP batch. Existing editorial
EN-first row locks and revision/template predicates remain in place. Archive checks
both EN draft and published About references, in addition to the header usage.

Form Save/Approve invalidates its public DTO and assigned About routes in all four
locales. EN About Publish invalidates the common assignment and four About routes.
Form configuration becomes public on its valid Save; placement changes become
public only on About EN Publish.

Resend remains unconfigured. Console/simulated transports verify construction and
capture durability, without asserting actual delivery or inbox attachment receipt.
The task is local only; no remote migration, external setup, push or deployment.
