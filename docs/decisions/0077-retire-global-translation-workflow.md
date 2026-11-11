# ADR0077 — Retire global translation authoring and retain localized content

2026-11-11. Product direction confirmed; implementation pending the execution
plan's adversarial and QA gates. Supplements ADR0007/ADR0021: their generic S14
authoring UI/pipeline is retired, while the shared locale kernel/data seams remain.

## Context

Pages, Blog, Properties, Services, Guides, auxiliary content and Settings have
their own manual locale editing workflows. Remaining inbox entries duplicate
those forms. FAQ intentionally uses separate groups selected per Page locale.
City intro has no current public renderer. Image ALT belongs to its consuming
document and language under ADR0076.

## Decision

Remove the global inbox/review/generation surfaces and their navigation. Preserve
authenticated compatibility routes to the owning editors. Close every generic
mutation and direct generation entrypoint for all entity types, including Forms
and unknown types. Compatibility stubs may remain only as explicit denials, with
normal authentication on server actions and no editorial reads/writes/provider
calls. No replacement automatic translator is introduced.

Retain `core/i18n`, translations, slugs, attribution, editorial snapshots and
existing public fallback behavior. Historical FAQ and asset ALT targets remain
readable. No migration, backfill, deletion or content republication follows from
retiring S14. The staff-role refactor is a separate task.

## Consequences

Normal editing occurs in the content's owning form. Old links remain useful;
there is no generic fallback editor for unrecognized entities. Shared contracts
resolve parent identities without cross-slice table access. Verification includes
incremental QA and final public E2E for every Page plus Blog post, Service and
Guide in all four locales, using an isolated new database and normal test login.

See [spec](../specs/translations-retirement-spec.md) and
[execution plan](../specs/translations-retirement-execution-plan.md).
