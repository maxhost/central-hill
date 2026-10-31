# Owners numbers heading — local delivery

User request 2026-10-31: add “Numbers That Speak for Themselves” to Owners
`#numbers`, matching Home's stats heading, and expose its copy in the BO.

Implemented in the existing checkout; no database writes or migration.
`OwnersContent.stats_title` is optional translatable copy (max 160 characters),
leaving the existing `stats` array and row identities unchanged. Blank or missing
copy uses the new localized `pages.owners.statsTitle` fallback in EN/PT/ES/FR.
The renderer passes the title into the same `StatBand` used by Home.
No figures still hides the band and its title.

Both legacy layout and contextual editor group the title with the existing
stats section. Schema-driven draft/save/publish and translation discovery pick
up the optional field; existing saved JSON remains valid. The field is stored
only when the user explicitly saves in BO. Existing preview and publish flows
remain in use.

Changed paths: `schemas/owners.ts`, `ui/owners-page.tsx`,
`admin/home-contextual.ts`, `admin/layout.ts` under `src/slices/pages`, and
`messages/{en,es,pt,fr}.json`, plus this note.
L0 aesthetic/editor copy change: user validates on localhost; no automated QA
or tests run, per current instruction. No independent QA claim.
