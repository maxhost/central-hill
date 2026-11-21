# Guests Welcome media upload QA

This harness operates only on the task's isolated application at `127.0.0.1:3091`,
PostgreSQL database/role `welcomeqa20261121`, and real local S3-compatible storage
at `127.0.0.1:9092/welcome-qa`. It runs the unmocked application upload reservation,
PUT, finalize, Save draft, reload, and Publish controls. No browser DOM is replaced.
Measurements inspect the selected asset and decode actual bytes. Dynamic test
images carry center/edge marks and known dimensions; fixtures and evidence stay
outside Git under `/private/tmp/central-hill-guests-welcome`.

Use Node22 and the repository's installed dependencies. Private prerequisite files
are `qa.env.local`, `login-private.json`, and a strict local `runtime.cjs` preload.
The preload must reject every other database/role/hostname. The task used a bounded
HTTP gateway and a parity-checked bridge to the **same real local PostgreSQL**, after
the older HTTP proxy exhausted connections. No SQL results or upload success are mocked.
Keep email disabled and never copy authoring/production credentials into this harness.

```sh
node --import tsx scripts/qa/guests-welcome-media/inventory.ts
node --require /private/tmp/central-hill-guests-welcome/runtime.cjs \
  scripts/qa/guests-welcome-media/baseline.mjs
node --require /private/tmp/central-hill-guests-welcome/runtime.cjs --import tsx \
  scripts/qa/guests-welcome-media/pages.ts home
```

Run `baseline.mjs` against the stable checkout **before** product edits. It uploads
2250×1500 through the actual Guest editor, saves, reloads, publishes, and captures
1440/390 public geometry. A frame farther than1px from3:2 exits1, intentionally on
baseline. The first task run's public frame measurements are the original defect
receipt; its early preview capture still showed the fallback and is not credited
as selected-media preview evidence. The final harness waits for the exact blob.

`pages.ts <page-key>` exercises every visible image field and every current repeated
instance in that page. It compares the input count against the schema-derived field
inventory, checks each exact local blob, then verifies real media metadata, persisted
IDs after reload and Publish, selected-file decoding, frame ratio/fit/centering and
no overflow in desktop/mobile public output and live preview. About Story/Community
also check their intentional intrinsic/stretch rule; issuer logos check contain,
48px height and max160px width. A failed or unavailable destination remains a failure.

Useful options:

- `QA_RATIOS=3-2,2-3,1-1,recommended` (default): skip only a recommended ratio already covered.
- `QA_FIELDS=path.one,path.two`: narrow an affected retest without implying other fields pass.
- `QA_REPORT_SUFFIX=images`: preserve distinct reports for a page's separate conditional cases.
- `QA_GUIDE_DESTINATIONS='["/en/guides/<city>/<slug>"]'`: explicit real detail destinations for the shared Guides aside. Its private preview uses the actual `shared_aside` surface.
- For Services, first run main media image fields with `QA_FIELDS=hero.media_media_id,final_cta.media_media_id`; then run `QA_POSTER_VIDEO=1 QA_FIELDS=hero.poster_media_id,final_cta.poster_media_id`. The latter queues a real MP4 through both media controls and uses reduced motion so each selected poster is actually displayed and decoded. It requires the private `fixtures/loop-3-2.mp4` fixture.

`create-list-item.mjs <page> <section> <list-path>` adds a real list row, fills required
copy/icon controls, uploads, checks local preview desktop/mobile, saves, reloads,
publishes and measures public desktop/mobile. Follow with `pages.ts` narrowed to the
new image paths for replacement ratios. Fixed-count lists cannot add beyond their
schema bound; every existing image slot is replaced instead. `tablet.mjs <page>`
checks the published repeated fields at768px to cover the intentional intermediate
grid layout. No new upload is claimed by a read-only supplementary viewport check.

Reports preserve each completed pass independently. Historical reports may contain
a subsequent harness/infrastructure interruption; only their completed per-field
checks with measurements/evidence are credited. Retest only interrupted or affected
cases. The inventory document is the coverage ledger; a runner exit0 alone does not
prove the whole63-active-field matrix. Welcome video/Lottie playback and the entity,
Settings and OG matrices have separate task-owned runners and receipts.

Chromium only; these runs do not establish real Safari coverage. Preserve all task
fixtures, snapshots, databases, environments and evidence. Never merge until the
complete plan's gates pass, and never push/deploy from this workflow.
