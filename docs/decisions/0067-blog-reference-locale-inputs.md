# ADR0067 — Manual Blog author/category locale inputs

2026-11-06. Accepted for authorized local implementation.

Keep a single author/category identity and existing one-Save form, adding visible
EN/ES/PT/FR inputs rather than tabs. Author name/bio and category name reuse core
translation rows; nonblank manual targets are approved, blanks clear only that
target field for EN fallback. Omitted target payload preserves old-client data.
Admin reads raw pending/authored targets; public and preview resolve post locale.
Post selectors localize labels without changing shared reference IDs/snapshots.
Existing Blog cache tags invalidate readers without republishing posts.

The core source write seam clears all locales by default for null/empty fields.
Add an explicit optional preserveTargetsOnClear flag to setSourceContent. When
true, its clear predicate includes locale=en. Default behavior and all existing
callers remain unchanged. Blog author Save opts in so clearing EN bio cannot erase
independent target bios, including when old clients omit translations. This is a
kernel code change only, no schema or new direct slice access to i18n tables.

Retire author/category legacy Translation inbox/actions/generation through Blog's
existing policy, redirecting old review routes to their forms. Preserve all stored
rows, slugs, status/media/shared properties and post publications/revisions. Global
Translations and other auxiliary editors stay outside this delivery.
