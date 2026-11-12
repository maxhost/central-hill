# ADR0080 — Configured public header contact

The first public Forms placement is selected by Settings, shared across locales.
No selection keeps the existing ContactForm. Saved definitions and approved locale
copy become public; tests remain authenticated. Header submissions are contact
leads regardless of their starting template. Recipient/configuration stay server-side.

Leads owns immutable captured field labels/values and idempotency keys. Forms owns
a small durable rate-limit table for anonymous attempts. Files are validated with
the existing policy and attached via core/email; bytes are not stored as media.
Resend remains unconfigured; local console/transport checks do not prove delivery.

The Neon HTTP driver has no interactive transaction API. Kernel executeSerialized
compiles trusted Drizzle SQL and runs a READ COMMITTED batch: acquire transaction
advisory lock in one statement, then mutate in a separate statement with a fresh
snapshot. The shared header lock coordinates assignment, form saves/archival and
capture guards. No awaitable database transaction callback is assumed.

Schema-only exception to contract.ts: settings/schema imports Forms' tiny
schema-contract.ts solely for its foreign key. Importing the general runtime barrel
would load server-only/auth/UI modules into drizzle-kit. Server composition also has explicit server-contract.ts entry points, guarded by
server-only, for SQL/capture helpers and placement readers. They are not re-exported
through barrels consumed by client islands; doing so poisoned the client dependency
graph in the integrated build. Runtime cross-slice access uses these declared contracts. The FK remains represented in Drizzle so
future generation cannot silently remove it.

Checkpoint: restore/header-contact-2026-11-12-1794491175278 at34ada31, full local DB
dump and verified isolated restorations. QA writes use headercontactqa20261112;
authored local clone and media remain preserved. No remote migration/push/deploy.
