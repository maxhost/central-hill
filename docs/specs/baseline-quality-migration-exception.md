# Historical migration breakpoint exception

`db:check` recognizes only `0008_faq_groups_and_page_faq_key` with full SHA256
`73dc6c8dd704099ed5a81d15cb568a2f82950c150e514aee394c7d22d5bb2538`.
This applied file contains a DO block and three UPDATE statements without
`--> statement-breakpoint`; all four were applied through the current websocket Pool driver.
Applied SQL and its ledger identity must remain immutable. The checker reports this
reviewed exception visibly as information, without recommending an edit to applied SQL.
A different hash for the same tag fails, including an attempted breakpoint insertion.
This exception does not certify compatibility with a future driver; that requires separate review.

Generic missing-breakpoint warnings remain active for other multi-statement SQL.
Journal order, SQL/journal correspondence, snapshot chain and the existing comment,
string-literal and dollar-body handling remain unchanged. No SQL, journal, snapshot,
ledger or database is modified by this change or by its tests.

`node --import tsx --test scripts/tests/check-migration-order.test.ts` runs seven
filesystem fixture contracts M01a–g: exact exception, hash drift, generic warning,
separators/literals/comments/dollar bodies, journal ordering, missing SQL and broken
snapshot chain. Fixtures live only in new OS temporary directories and are removed
by their owning test; repository migration files are only read.
