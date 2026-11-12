# Neon content copied into a separate local database

2026-11-11. User requests downloading Neon information to use the same information
locally. Authorizes remote reads and a new local content clone; no remote mutations.
Current application main280d23b. Existing propertylocalesqa/fixtures/cache/env remain
preserved for rollback. Production credentials stay in their existing ignored backup
file and are read only by root, never passed to implementers/QA or printed.

Preflight: original source endpoint verified from the known ignored env backup,
neondb/neondb_owner, PostgreSQL17, explicit READ ONLY REPEATABLE READ transactions.
Remote30migration ledger entries,47publictables (42business +5auth). Owners legacy1
and locale0. No business foreign keys point to auth tables. Media183R2objects,
125,428,007bytes. No Stream media. Remote content42tables will be copied exactly;
production user/account/session/verification/staff_role are excluded. The current
local propertyqa Admin user/account/role is preserved in the new database; no session
tokens are copied. Root verifies local identity before any provisioning/write.

## Ownership / workflow

Root: export/import/provision/schema comparison, guarded runtime/env, local Admin
mirror, fingerprints, switch localhost and this document. New target DB/role
neoncontentlocal20261111, port4558 existing local proxy, new guarded preload.
Export is one consistent readonly snapshot with raw JSON text for exact timestamps
and values; schema/ledger/FKs checked. Fresh clone migrations may seed rows: only
new own clone is cleared/replaced in a guarded transaction, never old/local/source.

Artifact root /private/tmp/central-hill-neon-content-local-copy (mode700). Separate
read-only source export/private auth transfer mode600; no production credentials in
exports. Source auth/session data is never exported. Root generates only synthetic
local runtime/storage credentials for the clone.

Implementer A: only new scripts local-media-server.mjs + local-media-server-check.mjs
under artifact root. Local-only HTTP/S3-compatible storage on127.0.0.1:9081 with own
bucket neoncontentlocal and directory storage/neoncontentlocal; never production R2.
Basic GET/HEAD/PUT/DELETE/OPTIONS, traversal guards, own bucket only, correct MIME/
CORS. No env/source credentials read, no DB or remote mutation. Isolated worktree
/private/tmp/central-hill-neon-copy-storage, branch neon-copy/storage, verified
base280d23b; writable files only in the artifact root. No repository source writes.

Implementer B: only new scripts copy-media.mjs + copy-media-check.mjs under artifact
root; input root-provided manifest of183public URLs/keys/MIME/bytes, destination own
storage, concurrency4, retries bounded, exact file sizes/SHA256 evidence, no deletes
or overwrites of unrelated paths. No credentials/env/DB access. Unknown failures
reported, never invented media. All writes only new task storage. Worktree
/private/tmp/central-hill-neon-copy-media, branch neon-copy/media, verified280d23b;
no repository source writes. Neither implementer received production credentials.

QA independent: read-only source scripts and data validation/browser after root
switch, own artifacts qa-*.mjs/json/md only. Normal local login, no cookie/token
extraction. No Save/Publish/upload during final browser check; content counts/hashes
and media requests compared. No product edits or independent production credentials.

Main env switched only after clone/import/media checks. New public/neoncontentlocal
symlink serves own downloaded media; existing public/propertylocalesqa retained.
Email stays console; app storage credentials point only to localhost. No production
R2 keys/providers adopted, no push/deploy, no product source/schema changes. Root
retains original/current env backup and old preload for immediate rollback.

## Status

**Local clone activated and independently QA-approved.** Source export captured in
one READ ONLY REPEATABLE READ transaction at2026-11-12 01:54:15.01321+00,
snapshot612353:612353:. All42business tables,1,473rows. Raw JSON text preserves exact
timestamps/numeric values; no source auth export. Source30ledger hashes/timestamps
exactly match unchanged local SQL. Private export/local Admin transfer mode600 under
directory700. Root's source fetch guard requires READ ONLY batch headers.

Created only new localDB/role neoncontentlocal20261111 with exact URL+SQL identity
guards. Applied all30unchanged migrations locally; source vs target columns,
constraints and ledger match exactly. Replaced only the new DB's migration-seeded
business rows in one guarded transaction, imported42tables in FK order, then mirrored
the existing local Admin user/account/role. No source accounts/passwords/sessions
copied. Counts/fingerprints42/42exact; one preserved Property QA Admin/account,
zero sessions before ordinary local login. No repository SQL/schema/product changes.

All183publicR2objects downloaded with size checks/SHA256, zero failures. Actual
bytes125,758,058; DB-known size sum125,428,007 plus one bytes:null asset330,051bytes.
The null stays unchanged. No sourceR2objects or credentials written/adopted. Local
storage17/17checks and copier6/6checks pass, Node22/own ephemeral fixtures. Localmedia
127.0.0.1:9081PID13693, root session68858, serves copies and future local uploads.
Root separately verified real SDK presigned PUT→local storage→public GET200 with one
own temporary text object, then DELETE cleanup. No app UI upload or DB write; this
is root evidence, not an independent QA pass.

Main.env.local now points only to cloned localDB/localstorage, EMAIL_PROVIDER=console;
no production providers/keys. Old env privately backed up as previous-main.env.local,
original production backup unchanged. Prior .next archived intact as previous-main.next
before restart, keeping caches separate. New public/neoncontentlocal symlink serves
only copied media; prior public/propertylocalesqa/logo preserved. Actual main workspace
remains active for future code edits. Node22localhost3071PID14553/session2803,
target-only runtime.cjs guard, cwd independently verified. Prior87925stopped.

Root compared previous propertylocalesqa's42business tables after copying: all
counts/hashes exact, previous-local-final.json differences[]. Old DB/content intact.
This is a one-time independent snapshot, not automatic synchronization with Neon;
local edits stay local.

Independent QA before/after browsing matches42source counts/hashes/1,473rows and
30ledger entries,183physical objects/sizes/SHA256. Twelve bounded browser cases:
Owners EN/PT200, Building/Blog/Guide/Service published details200, localmediaHEAD
and Nextimage200, localvideo206, normal Admin/login+privateOwnerspreview+apartment
ficha200. Targeted final Owners confirmation waits parentaria-busy=false and iframe
stateidle/revision1; no loading/error overlay, pageerrors0/hydration0/mediafailures0.
Content remained byte-equivalent to the snapshot throughout; no Save/Publish/extra
content fixtures or real emails. Initial harness input filled before hydration and
its screenshot caret-hiding style caused comparison warnings; only harness timing/
capture changed. Public cases were retained, with one targeted bridge confirmation;
no product/data correction. Source/current product unchanged from280d23b.

Evidence under the artifact root: import-result.json,source-fingerprints.json,
media-copy.json,previous-local-final.json,qa-data-*.json,qa-media.json,
qa-browser-*.json,qa-independent.md,logs and captures. Scripts/export/private auth/
env/cache,media and worktrees retained. No source DB or remoteR2 mutation,push/deploy.

## Runtime and rollback

Both owned services are needed. From the main workspace, with Node22:

```sh
node /private/tmp/central-hill-neon-content-local-copy/local-media-server.mjs
NODE_OPTIONS='--require=/private/tmp/central-hill-neon-content-local-copy/runtime.cjs' pnpm dev --port 3071
```

Do not restart with the old propertylocalesqa preload or without the current guard.
Rollback retains both datasets: stop only the owned app, restore previous-main.env.local
to .env.local, retain the clone's current .next separately and restore previous-main.next;
restart using prior /private/tmp/central-hill-localhost-20261111/preload.cjs. Never
drop either DB or delete storage/cache/env artifacts as rollback. Same local Admin
credentials remain; production users/session tokens were not imported.
