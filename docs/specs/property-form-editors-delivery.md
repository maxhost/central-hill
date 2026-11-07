# Property forms — implementation prepared, functional verification pending

2026-11-06. Candidate **8cbd0e0** on `property-forms/integration`, checkout
`/private/tmp/central-hill-property-forms-integration`, base29db0c5. No main merge,
push or deployment. Main0e72983 (Blog/topbar only) and old previews are unchanged.
[Execution/spec](property-form-editors-execution.md), [ADR0061](../decisions/0061-property-forms-and-shared-data.md).

## Implemented behavior

Buildings and nested Apartments use traditional forms, language tabs and explicit
Save draft/Publish per locale. No canvas, inspector or embedded live preview.
English fills untouched working documents; a real localized text, SEO or booking
edit pins that language, including unsaved work. Shared edits/no-ops do not pin.
Existing own/pending translations and previously edited snapshots remain independent.
Each public language still requires its own publication; published text/SEO stays
fixed until that language Publish. FAQ structure is localized with stable identities.

Images and physical facts have one common value, editable in every tab and live
for already published languages on Save. Localized text/SEO stays in its own draft.
Common revision/CAS and fresh SQL overlays prevent a text Save restoring stale
common data. Responses contain normalized persisted media previews. Public reads,
admin listings and apartment counters use current common facts. Parent publication,
archive/delete/order and legacy translation guards remain. Apartment SEO is exposed;
there is no new public Apartment route. Old hidden prose/legacy values are retained.

A source review found direct Publish could apply or discard pending common changes
from an old EN draft before common Save. Both stores now reject Publish while that
compatibility pending state exists, preserving it until explicit Save. Prepared DB
regressions cover this, but have not yet executed.

## Current verification and limits

- Typecheck and full lint on integrated d3d160d: exit0, seven existing lint warnings.
- 92/92 pure/state/validation/consumer tests: exit0. Explicit files and commands in
  execution log; **no DB integration suite included**.
- Compile-only Next build on d3d160d: exit0. This is not `pnpm build` with static
  generation and is not a functional runtime check.
- Both guard corrections passed writer typecheck/scoped lint/diffcheck. Root final
  typecheck/compile-only confirmation on8cbd0e0 both exit0; logs
  typecheck-final.log/build-compile-final.log.
- `pnpm db:check`: exit0,27migrations, historical0008 breakpoint warning only.
- Independent source review in [QA report](property-form-editors-qa.md), commit8c6521b,
  confirms both guard fixes and no other blocking source finding; **no functional QA approval**
  or browser/save/reload/upload/public-revalidation result is claimed yet.

## Pending explicit DB authorization

Migration0026 adds only `building_shared_content` and `apartment_shared_content`.
It is prepared and reviewed, **not applied**. User approval was requested for this
new local schema change and new synthetic fixtures in existing `propertylocalesqa`.
The question remains pending; earlier approvals are not treated as authorization
for this new schema application.

Artifacts `/private/tmp/central-hill-property-forms-qa` contain:
`env.sh`, `apply-migration.cjs`, `seed.cjs`, `verify-db.cjs`, `storage.cjs`,
`start-preview.cjs`, copied synthetic media and check logs. SQL read-only identity
verified database and role both propertylocalesqa through proxy4558, with remote
Neon blocked by preload. Previous d*/f* fixture hashes are recorded. No data was
created/modified and no migration applied during this task's preparation.

After approval: apply only0026 transactionally (this local DB has no Drizzle
ledger; do not replay0000..0025), create only own e* fixtures, run the prepared
DB integration suites, full `pnpm build`, start storage9077/preview3077, then bounded
independent browser Save/reload/public/media QA. Preserve3071/3073/3075, old fixtures,
and all worktrees. Publish each language explicitly and validate common Save affects
all published locales while their private text drafts remain private. Do not merge
Properties to main until the user reviews and authorizes that integration.
