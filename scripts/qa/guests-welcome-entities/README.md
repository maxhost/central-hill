# Entity image E2E — isolated Welcome QA

Requires Node22, pnpm dependencies, private QA env/credentials, PostgreSQL bridge
preload and a real isolated S3 byte store. Never run against authored or production
data. `common.mjs` asserts database/role `welcomeqa20261121` and uses only
`http://127.0.0.1:3091`. Login credentials and artifacts stay under the private
`WELCOME_QA_ROOT` (default `/private/tmp/central-hill-guests-welcome`).

Run with the same private guard/preload used by the QA application:

```sh
node --env-file=/private/tmp/central-hill-guests-welcome/qa.env.local \
  --require=/private/tmp/central-hill-guests-welcome/runtime.cjs \
  scripts/qa/guests-welcome-entities/create.mjs
```

Create references/building with `create.mjs`, then `create-content.mjs` for
Service/Guide/Post. Existing fixture identities are resumed from private
`entities/state.json`. Run `references.mjs`, `settings.mjs`, `buildings.mjs`,
`services.mjs`, `guides.mjs`, `posts.mjs`, `apartments.mjs` and `galleries.mjs`.
Then run `post-creation-and-locale.mjs`, `fallbacks.mjs`,
`apartment-locales.mjs` and `structured-data.mjs`. Finish with the passive
`audit-assets.mjs` and `audit-results.mjs` checks. The former compares every
selected asset's actual S3 bytes with its original fixture SHA256 and dimensions;
the latter rejects an incomplete case/template/gallery/locale matrix.
When running from a separate writer worktree without the shared Pages helpers, set
`WELCOME_QA_HELPERS` to that integrated `guests-welcome-media/common.mjs` file.
For the final Apartment locale supplement, the private compiled helper selects
origin3094 with the same QA database; all ordinary matrices used3091. The helper
records bounded RSC stream completion, document reload, exact persisted local
copy, restored QA names and unchanged EN rows.
Keep at most two runners active; `galleries.mjs` changes the same fixtures and must
run after the corresponding main matrices. Incomplete cases are never approved.

All uploads use browser file inputs, real presign/PUT/finalize, Save/reload/Publish.
There are no successful-upload mocks, DOM fixtures or direct content SQL writes.
Generated marked PNG fixtures, measurement JSON and desktop/mobile screenshots are
private artifacts. Code and documented N/A controls are checked against current
routes, not historical screenshots or an obsolete editor.
