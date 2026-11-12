# ADR0079 — Explicit form rows and columns

2026-11-11. Implements the user-approved row/column/field plan, extending ADR0038
and preserving ADR0078 Date/File. No kernel, SQL schema or public placement change.

Form JSON v2 owns ordered rows with a stepId and one or two ordered columns. Each
column references zero or one existing field. Fields remain a flat identity catalog;
their visual order and step derive from rows, removing redundant width/stepId on fields.
Step/field/option UUIDs and translation paths remain unchanged. Row/column IDs are
UUIDs for new structures and deterministic `legacy-row:<fieldUUID>` /
`legacy-column:<fieldUUID>:0|1` for conversion; row/column ID validators accept those
respective namespaces as well as UUIDs. They never enter translated text paths.

Persisted v1 remains readable with its own strict schema. Validated definitions
normalize purely in memory; GETs and target-locale saves do not rewrite legacy JSON.
Explicit EN Save writes v2 with the existing optimistic revision guard. Old v1 write
payloads are refused with a reload error, preventing downgrade or layout loss.
Historical test snapshots remain untouched; new tests snapshot the normalized saved
definition with its saved revision, approved copy and verified attachment metadata.

One shared layout module owns immutable operations and visual traversal. Legacy grid
conversion is sparse, by step: full-width fields close pending half rows, never moving
a later field backward across them. IDs are deterministic without writes or new UUIDs
on load. Two occupied columns collapse into two consecutive one-column rows; no field
is discarded. Layout operations reject limits atomically. Forty fields/rows and six
steps remain bounded. Empty rows/slots are editor scaffolding; runtime omits empty rows
and stacks occupied columns on mobile while preserving right-only placement on desktop.

Layout edits use EN; target languages keep their current text-only controls and fallback.
Reordering does not change text hashes, translation state or field identity. Email and
validation iterate the same visual order. Date/File, recipient, reply-to, staff gates,
archived/revision checks and existing email provider configuration remain in force.
