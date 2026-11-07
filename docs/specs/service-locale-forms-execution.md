# Services locale forms — executable inventory and plan

2026-11-06. Authorized implementation from main `b1b75d7`. Only pre-existing
untracked files: original logo PNG and `public/propertylocalesqa` symlink; preserve
both, ignored environments, fixtures, worktrees and storage. Deliver local main,
one actual-main dev localhost3071. No push/deploy/remote writes. Current listener
84793, cwd main; retain until candidate is ready. Node22/pnpm, safe environment
`/private/tmp/central-hill-building-status-qa/env.sh`, synthetic propertylocalesqa
Postgres5658/proxy4558/storage9077. Verify DB and role before writes. Existing
synthetic content QA permission applies to new e780/e781 fixtures only; migration
0027 execution needs explicit new approval. No old fixture mutations.

## Complete field inventory and behavior

| Location | Localized | Shared |
|---|---|---|
| Identity | name, excerpt, body, duration_label | one id, slug map (preserve existing localized slugs), position, category_id, rating_tenths |
| Booking | price_suffix, cta_label, cta_url | price_from cents, booking_type enquiry/external/none |
| SEO | meta_title, meta_description | cover_media_id, og_image_media_id, ordered gallery |
| Detail title/booking | badges, about_title, included_title, price_note, booking_rows label/value | no additional media |
| Facts | title, note, list content/order | icon by stable fact id; EN chooses icon |
| Itinerary | time, title, text, list content/order | optional media_id by stable step id |
| Options | group title, item name/desc, structure | none |
| Pricing | column labels, row labels/cells, footnote, structure (display strings, not cents) | none |
| Extras | label, price display text, desc, structure | none |
| Partners | name, desc, cta_label, URL, structure | none (no partner image/icon field exists) |
| Good to know | included/cancellation/practical strings, legacy notes | none |
| Copy | all 38 optional copy keys, including hidden retired overrides | none |
| Presentation | none | section visibility flags, price_display, seven icon overrides; icons chosen EN |
| Category taxonomy | name EN required, ES/PT/FR optional; approved manual targets, blank uses EN | id/slug/icon/position; one selected category across tabs |

Keep the existing Service form/cards/conditional modules/media queue/validation,
not a Pages canvas. Tabs use exact incumbent Blog/Building classes and EN source
label; EN starts selected. Each language keeps unsaved work, saved draft and
explicit publication. Tab changes/shared-only edits do not take ownership. Compare
actual localized values against current persisted working content on server;
first real localized edit sets localeMode=custom permanently. Untouched targets
follow saved EN draft (or EN publication), while public text always uses its own
published snapshot. EN Save/Publish never publishes another locale. Public list,
detail, metadata, related services, Home teasers and static params use selected
publication. Legacy services without rows retain their historical public fallback.

Shared Save updates public data across all already published languages immediately,
including media, category, icons and neutral data, without consuming their drafts
or changing localized text/SEO/revision. Category and all icon choices are EN-only
in UI and enforced on server. Images may be edited from any tab and remain common.
Booking label+URL are localized; retain legacy values and enquiry/external/none
behavior. Existing legacy slug map stays unchanged on ordinary Save.

Facts/itinerary gain optional persisted `id` (backward compatible JSON schema).
Legacy rows without ids receive deterministic `legacy-fact-N`/`legacy-step-N` keys
at projection/bootstrap only, representing their existing positional slots.
Thereafter shared maps are keyed by id, never joined by current array index.
New rows use random UUIDs; reorder retains ids. Shared maps retain removed keys
so an EN removal cannot destroy an independently authored target's row/text.
Legacy target-only slots are retained in the shared map; EN wins existing shared
slot collisions when bootstrapping. Textual array structure remains localized;
an EN structural edit does not rewrite customized target arrays. Non-EN may
reorder/remove existing rows, but adding icon-bearing facts is EN-only. New
itinerary rows can have no image until a shared selection is saved.

## Architecture and contracts

ADR0065 adds service_locale_content (service_id+locale unique, draft/published JSON,
monotonic revision, timestamps, actor text) and service_shared_content (one shared
JSON, monotonic revision/actor). Additive migration0027 creates empty tables only;
no eager backfill. No kernel API changes. GET projects legacy without writes;
first mutation bootstraps four locales conservatively: approved legacy public
content preserved, pending targets loaded privately, any authored target stays
custom. Invalid stored JSON blocks mutation, never silently deletes content.
New identities start with empty unpublished locales, only EN may create.

`editorial-types.ts` and `locale-content.ts` are root-owned shared contracts.
Envelope v1 contains localeMode and full Service content (without identity/status).
Shared content overlays root fields and nested id maps. Model exposes four locale
models, shared revision/content, slug map, previews, status. Save request includes
serviceId, locale, expectedRevision, templateRevision, expectedSharedRevision,
payload and creation slug. Result returns refreshed full model; clients preserve
unsaved other-language edits while rebasing shared state. Publish takes selected
revision only, consumes saved draft only. Dirty selected work must be saved first.
Server uses existing db.batch/graph lock and CAS, including shared+locale atomicity;
stale locale/template/shared writes fail without partial mutation. Validate category,
image availability/MIME and effective conditional/booking constraints. Enforce size
limits and staff auth on every action. Existing live saveService must reject adapted
identities, preventing old clients from bypassing independent publication.

Taxonomy retains field `name` and existing core i18n read/write seams. Manual targets
approved on one Save, raw pending targets load without English copies. Omitting
translations preserves targets; explicit blank deletes only that target. Existing
sequential taxonomy writes retained (no new atomicity claim). Revalidate service-list
and admin category/service routes, so rename needs no Service republish.

## Ownership and sequence

Root first commits this plan, ADR0065, types/helpers, schema/migration/journal and
category validation additions. Integration branch `service-locales/integration`,
worktree `/private/tmp/central-hill-service-locales-integration`. Root owns messages
in `messages/{en,es,pt,fr}.json`, docs,
contract.ts and all composition routes `src/app/(admin)/admin/(panel)/services/**`.

Backend writer: `service-locales/backend`, worktree
`/private/tmp/central-hill-service-locales-backend`. Owns services/server/**,
admin/actions.ts, admin/queries.ts, new admin/locale-actions.ts, README.md,
tests/service-locales.integration.test.ts and tests/service-locale-model.test.ts.
No schema/types/helpers/UI/messages/core edits without root scope expansion.

UI writer: `service-locales/ui`, worktree
`/private/tmp/central-hill-service-locales-ui`. Owns admin/ui/**,
admin/detail-draft.ts, admin/form-model.ts, new admin/locale-form-state.ts,
tests/service-locale-form-state.test.ts. Preserve modules and old pure test behavior;
use common types/helpers. Request message keys from root. No server/schema/core edits.

Root assembles sequentially, reviews boundaries, runs real integrated checks, builds
with local CIRCLE_NODE_TOTAL=3 (2 workers), then switches sole app3071 to candidate
for independent QA. QA owns `docs/specs/service-locale-forms-qa.md` and private
artifacts `/private/tmp/central-hill-service-locales-qa/independent`, no product edits
or nested delegation. Root merges approved candidate locally, returns actual-main
dev3071 and performs bounded read-only opening check. Preserve all worktrees.

## Acceptance and checks

Typecheck, lint, explicit affected services tests via tsx --test, integrated build,
db:check and migration review. Backend tests use runtime loader/preload established
by property/amenity tests, verified DB/role and own e780 fixtures, clean only those.
No remote credentials printed/copied. Migration only after authorization and
verified database identity, with exact SQL/hash and result recorded below.

Independent QA: four bounded functional groups (desktop/mobile, no aesthetic loop):
1. Legacy GET no-write, old publications/SEO/slugs/pending/hidden copy preserved;
   new/edit tabs, per-language Save/reload/Publish and EN inheritance/custom ownership.
2. Shared root and nested media/icon/category changes, stable row reordering,
   custom PT text/SEO untouched, all conditional modules and booking types intact;
   queued upload success/failure and navigation guard for work across tabs.
3. Category four inputs/raw pending/manual Save/blank fallback, selector+public
   names in four locales, one selected id, rename without Service republish.
4. Validation/stale revision/permissions, public listing/detail/metadata/static
   locale exclusion, existing fixture hashes unchanged, no pageerrors.
Only new e781 demo rows/media may be changed by browser QA. Store tests and browser
groups complement one another; do not repeat an approved matrix without cause.

## Progress

Inventory complete. No product implementation or DB changes at this plan checkpoint.
Contracts d447c10 committed before branching both consumers. User explicitly approved
0027 only propertylocalesqa. Root generated complete snapshot metadata, then
verified hostname/DB/role and applied its four statements atomically. SHA256
8c980d837972ab7f2f8e7cf3ad056b33683b21872eb6cb7c9eec44dba27e4730.
Two new empty tables; pre-existing service/category/media/translation/slug and
Property table hashes unchanged. No eager backfill. Artifacts
`/private/tmp/central-hill-service-locales-qa/migration.json` and
`pre-migration-data.json`. Typecheck0 and db:check0 (one pre-existing0008warning)
on contract base after snapshot generation. Earlier local sandbox tsx socket
restriction resolved by permitted escalation; initial missing next-env.d.ts in
new worktree copied from actual main, then typecheck passed.
Backend/UI implementation in progress in separate named worktrees.
