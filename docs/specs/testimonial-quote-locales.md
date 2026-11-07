# Testimonial Quote EN/ES/PT/FR — execution

2026-11-07. User authorizes Quote per language in same ficha, blank uses EN,
public uses selected language. Base main a321f2d, tracked clean; only pre-existing
untracked original PNG logo/publicmedia symlink. Local main + one3071, no push/
deploy/remote writes. Preserve all files/worktrees/data/envs/runtime artifacts.

## Inventory and contract

Testimonial schema already has only quote in translation; neutral author name/
country/property_location/audience/rating/position/status unchanged. Existing CRUD
Save writes EN quote through setSourceContent; public listTestimonials(locale,
audience?) already approved-target/ENfallback, position/published/audience filters,
cache testimonial-list. Home mixes audiences, Guests filters guest, Owners filters
owner via same TestimonialsRow. Pages JSON/SEO/draft/publication never changes.
No images in testimonial; public cards render author country flag, unchanged.

EN quote remains quote:string trimmed/min1/max1000. Add optional translations:
{es,pt,fr}:string trimmed/max1000, explicit blank allowed, strict complete three
keys if present. Old clients omitting targets preserve every raw existing target.
EditData adds optional raw translations, including pending; missing blank (no EN
copies). Four textareas in current Quote card, EN first/required, no tabs; existing
Save and controls in place, no visual-editor conversion or redesign. UI submits
all targets, proper IDs/labels/max/errors/disabled pending, preserves input onerror.
Nonblank manual targets approved via existing setTargetTranslation; blank deletes
only that field/locale via deleteTranslation. Later EN preserves custom targets.
No migration/schema/kernel/package change. Existing sequential seam, no new
atomicity promise. No eager/backfill/GET writes. Cache refresh through existing
revalidateTestimonials. Old review links redirect to ficha; generic testimonial
inbox/actions/generation blocked before any write, other types remain unchanged.

## Owners and worktrees

Root prepares contracts before consumers: quote-locale-types.ts, validation.ts,
EditData optional field, contract exports, editorial-translation-policy.ts, ADR0070/
index/spec. Root owns messages4, Translation admin/actions.ts, queries.ts,
ui/review.tsx, server/generate.ts, Translation README, testimonial README, data-model,
roadmap/AGENTS; new tests/quote-locales.test.ts, Translation tests/testimonial-quote-guards.test.ts, fixture/runtime/integration.
Integration: /private/tmp/central-hill-testimonial-quote-locales-integration,
branch testimonial-quote-locales/integration.

Backend: /private/tmp/central-hill-testimonial-quote-locales-backend,
branch testimonial-quote-locales/backend. Owns ONLY testimonials/admin/actions.ts,
admin/queries.ts (implementation, prepared interface retained), new server/
quote-locales.ts, tests/quote-locales.integration.test.ts. Implement raw quote
mapping and target writes, read/public fallback and old clients. Real DB tests
only new e830 rows, cleanup; verify DB hostname+SQL DB/role before writes. No
nested agents; return commit/files/tests/limits, no main or runtime change.

UI: /private/tmp/central-hill-testimonial-quote-locales-ui, branch
 testimonial-quote-locales/ui. Owns ONLY testimonials/admin/ui/testimonial-form.tsx.
Current layout authoritative; add four quote fields, raw targets/payload/error IDs/
max/busy behavior, no tabs/no unrelated changes. Root provides message keys:
admin.quoteLocales.label({locale}) and fallbackHint; updated formSubtitle.
Use Impeccable, context launcher ALREADY ran this conversation (do not rerun),
read craft-floor immediately before UI edit. Scoped typecheck/lint sufficient for
writer; persistence/browser tested integrated. No aesthetic tests/screenshots/loops.

Independent QA after assembly owns ONLY docs/specs/testimonial-quote-locales-qa.md
and artifacts /private/tmp/central-hill-testimonial-quote-locales-qa/independent.
Three normal bounded groups:1New/Edit raw pending/blank/privacy and Save/reload;
2four public guest locales +HomeEN mixed audience, IDs/rating/author unchanged and
Page JSON/SEO/pub/rev immutable;3ENrename/clearES fallback while PT/FR custom,
mobile/old review redirect/inbox exclusion/auth. Store tests cover owner filtering,
omitted targets and guards, no broad Pages suite or repeated full matrices.

## Safe environment and evidence

Keep maindev3071PID70494/parent70488/session75835 until candidate ready; root alone
switches production QA→actualmain sole3071. Existing synthetic propertylocalesqa
DB5658/proxy4558/storage9077PID30456 via safeenv
/private/tmp/central-hill-building-status-qa/env.sh. Verify hostname and SQL DB+role
before all writes. Existing synthetic-content authorization applies; no schema
needed/new DB permission. Block Neon remote with existing preload, no secretcopy.

Root snapshots42business hashes before seed (auth tables excluded). New browser
e831guest+owner testimonial fixtures only, pending/custom quote rows; new creation
UUID recorded. Old Pages/Home/d/f/e78/e79/e80/e81/e82 protected; no fixed-page
snapshot/delete/restore, no source Pages writes for tests. Public current Guests4
andHomeEN reused read-only; no Owner4 page fixture invented if absent. Existing
owner filter proved by store tests and mixed HomeEN public. If no current Guests
locale publication, report and use existing reader rather than overwrite content.

Checks actual: pnpm typecheck/lint, tsx explicit tests testimonial existing14+
new schema/policy/DB guard tests and translation derive pure regression. Build
CIRCLE_NODE_TOTAL=3/2workers only AFTER e830 cleanup. No pnpm test placeholder;
no broad known-stale Pages matrix. Browser real auth/Next actions/revalidation;
external test-only loader for Node auth/nextcache outside request if needed.
After independent approval main ff (check new user changes), sole actual-main
safeenv dev3071 and read-only opening, final docs/commit. No further task automatic.
