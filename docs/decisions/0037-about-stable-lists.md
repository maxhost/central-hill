# ADR0037 — About lists retain translation identity

Accepted 2026-10-18 for the authorized About CMS implementation. Amends ADR0012's
fixed-count lists for About only; section composition remains fixed.

About gains bounded lists and private per-list IDs. Legacy IDs `legacy_N` retain
their original `block:list.N.leaf` translation keys permanently. New UUID IDs use
`block:list.@UUID.leaf`. The current array index never identifies a translation.
Retired IDs cannot be reused. This preserves existing translation rows and actors
without a migration or copying targets. Paragraph arrays remain strings.

The kernel exports a source-snapshot SQL CTE builder, independent of any slice
table. Pages composes it with its own compare-and-save CTE and executes one SQL
statement using neon-http. Failure is atomic; a failed optimistic guard yields no
entity IDs and therefore no translation writes. Source changes preserve approved
targets under the existing stale policy; clearing/removing fields clears their
translation rows. No interactive transactions or new driver are introduced.

Pages owns snapshot comparison, list metadata, validation and extraction; i18n
alone owns SQL touching translation. An optional revision on generic page actions
is mandatory for About. Other pages retain their existing save behavior.
