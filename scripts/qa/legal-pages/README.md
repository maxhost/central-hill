# Legal Pages independent QA

These scripts operate only on the explicitly provisioned local database/role
`legalpagesqa20261121`, via `legalpagesqa20261121.local` and the existing local
Neon HTTP proxy4558. Browser actions accept only loopback HTTP3090. They refuse
the authored main database and any remote database. They do not provision or drop
databases, alter schemas, export auth sessions, or send mail.

The orchestrator creates the paired checkpoint and isolated database first.
Credentials, content snapshots, recordings and results stay outside Git under
`/private/tmp/central-hill-legal-pages/qa`. The committed harness contains no
credentials or populated results.

Use Node22 from the repository root and the isolated environment file:

```sh
export QA_ENV_FILE=/private/tmp/central-hill-legal-pages/legalpagesqa20261121.env.local
export QA_NODE=/Users/maxi/.nvm/versions/node/v22.23.3/bin/node

# Exactly once, after database provisioning and before browser mutations:
"$QA_NODE" --env-file="$QA_ENV_FILE" \
  --require ./scripts/qa/legal-pages/runtime.cjs --conditions=react-server \
  --import ./node_modules/tsx/dist/loader.mjs \
  --import ./scripts/qa/legal-pages/register.mjs \
  ./scripts/qa/legal-pages/create-admin.mjs

# Only after the orchestrator starts the candidate on isolated localhost3090:
"$QA_NODE" --env-file="$QA_ENV_FILE" \
  --require ./scripts/qa/legal-pages/runtime.cjs \
  ./scripts/qa/legal-pages/run.mjs all

"$QA_NODE" --env-file="$QA_ENV_FILE" \
  --require ./scripts/qa/legal-pages/runtime.cjs \
  ./scripts/qa/legal-pages/state-checks.mjs

"$QA_NODE" --env-file="$QA_ENV_FILE" \
  --require ./scripts/qa/legal-pages/runtime.cjs \
  ./scripts/qa/legal-pages/checks.mjs
```

The standalone auth provisioning import uses tsx and a `server-only` marker
loader. It invokes the actual Better Auth API, creates only its own synthetic
admin, grants only that user a staff role, and stores its password0600. Browser
automation subsequently uses the normal sign-in page. The login-page video is
deleted; each new Page in that same logged-in context records one complete legal
page sequence without copying cookies or storage state.

`run.mjs` accepts `all`, `privacy_policy`, `cookies_policy`, or `complaints_book`.
Each case authors real content through BO controls, verifies unsaved live preview
and private drafts, publishes EN, clicks the public footer destination, translates
and publishes ES, changes EN text and paragraph/list structure, proves the complete
ES publication/revision remains unchanged, and navigates the PT footer destination
to the current EN fallback. Public content is also verified in an anonymous
context. FR fallback is checked as an additional read-only case.

Videos use native Playwright WebM output in timestamped directories. Case JSON
contains the exact corresponding video path; existing recordings are retained.
If a case needs a focused rerun after a correction, initial-unpublished checks run
only when no publication exists. The report must distinguish that rerun from the
original first-publication evidence.

`checks.mjs` verifies footer labels/links in all four languages, navbar exclusion,
anonymous BO/preview protection, desktop/mobile overflow and captures, and exact
hash/count conservation of all unrelated public business tables and original
Page rows plus the migration ledger. Only the three newly authored legal pages
and the QA account's normal auth activity are outside that conservation set.

`state-checks.mjs` additionally saves an unpublished own PT draft and proves it
does not replace the public EN fallback, exercises a real stale-save conflict in
two normal BO tabs, restores its own EN draft through the BO, and opens one
preexisting Blog post without saving to verify the full Rich toolbar remains.
Any preexisting unavailable Blog content is recorded explicitly, not counted as
a passing editor check.

Recordings and snapshots are QA fixtures, not legal policy copy for publication.
Never copy the QA environment or its authored content into main or production.
