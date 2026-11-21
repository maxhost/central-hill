# Guests Welcome media — execution

Work in progress on `fix/guests-welcome-media`; no merge before the complete matrix passes. No push or deployment.

The source checkpoint is `ec7f610f2364683e445060c75374fe71f6bc499e`, reference `restore/guests-welcome-media-2026-11-21`. Private artifacts: `/private/tmp/central-hill-guests-welcome/checkpoint/RESTORE.md`. Complete dump:49 tables1534rows including auth/ledger. Code archive1416regularfiles compared with the new checkout; bundle verified. Restores `welcomerestore20261121` and `welcomeqa20261121` match visible schema, constraints, counts and all row hashes (only dropped-column physical ordinal gaps normalized). Restore base stays intact. Both media target directories are empty at this checkpoint; no recovery claim for older assets. Current untracked plan, env, logo files and symlink definitions preserved privately. Recovery preserves later state first and uses new checkouts/databases.

Main remains on its original branch and SHA. Integration worktree: `/private/tmp/central-hill-guests-welcome/worktree`; renderer and E2E writers have independent `media`/`e2e` worktrees. The existing media9081process was retained. Main3071was already absent in the initial process inspection; no restart or authoring action was performed.

## Product

IntroSplit has opt-in `imageFrame="3:2"`; only Welcome uses it. Its default stretch/minimum heights remain. The new media renderer owns MIME selection without geometry; sideMedia preserves original4:5 root nodes and classes. Welcome reserves the frame before media load, handles confirmed failures with neutral section background, shows a localized preview status, and resets on replacement. Video buffering/autoplay denial do not become resource failures. Lottie is imported dynamically; readiness means first canvas render. Existing reduced-motion behavior is retained, including the prior animated-WebP limitation.

The inventory/E2E expanded scope: legal working state adopts the EN-only OG picker while its complete own-locale publication stays unchanged until its own Save/Publish; Settings social-image hint names its actual consumers; Service itinerary thumbnails keep a centred square frame for portrait uploads; rich Blog body accepts image reservation completion without unlocking Save/Publish. Calculator and City hints describe their real display contracts. Welcome also disables only its own blurhash to keep slow-image loading neutral. The plan documents findings and fixes. The initial expectation of automatic EN OG activation across locales was incorrect; public readers retain their original per-locale publication semantics.

## Validation environment

Application3091uses only `welcomeqa20261121`; baseline3092uses only `welcomebaseqa20261121`. Both roles/databases were created for this task. S3rver9092and9093store actual bytes in independent private directories. Browser uploads execute the normal presign→PUT→finalize path, then the actual editor Save/Publish actions. There are no fake upload success responses or DOM fixture substitutes. Only QA Next configuration permits loopback image optimization; this private override must be removed before merge. Original product configuration remains separately preserved.

The original local Neon proxy saturated under parallel E2E and a build; interrupted cases remain unapproved until retested. Only task-owned QA servers were restarted. A private global4request gateway was added, then its forwarding changed to a PostgreSQL-backed HTTP bridge to remove shared-proxy latency. The bridge preserves the actual Neon client/Drizzle path, SQL parameters, row-array/text protocol, real owner-role identity and batch transactions. Parity against the original proxy covers JSON/arrays/numeric/int8/date/timestamps and actual media/Page rows; READ COMMITTED, advisory transaction locks, rollback and error codes were verified. See private `http-conformance.json`. A persistent QA-only preload also preserves the guard through Next fetch wrappers and limits client HTTP concurrency. Diagnostic logging identified rare local ECONNRESET errors; the own HTTP bridge keep-alive was extended in place from5seconds to10minutes without interrupting transactions. Failed attempts were retained and affected cases retested. The existing authoring proxy/database configuration was not changed.

## Verification receipts

- Baseline real image2250×1500:535.8×669.73desktop,334×417.5mobile,4:5. Real WebM and Lottie JSON reproduce the same geometry through upload, draft, reload and publication, with advancing video time and nonempty changing canvas. Evidence: private `baseline/` and `baseline-playback/`.
- Typecheck passed;18initial focal contracts plus7legal tests passed. Final relevant checks will be recorded after all fixes.
- The first complete isolated build passed229generationitems/2workers: compile34.6s,TypeScript17.5s,static15.4s. A further build is required for the later neutral-loading/Service-itinerary corrections; private concurrency limits only. Earlier own build was stopped130to avoid competing for DB connections and is not counted as passed.
- Design detector on all changed UI: `[]`.
- Authoring database compare:49tables1534rows exact, including auth and ledger, after QA setup. Final compare remains required.

The per-field inventory and final QA reports are the acceptance record. Incomplete, blocked or missing evidence never counts as approval. Chromium evidence does not claim Safari coverage. Private credentials, files, generated media and database backups remain outside Git.
