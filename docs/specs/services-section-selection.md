# Services: one Element entry per section — 2026-11-05

User requests Services match the previous Pages consolidations and explicitly
asks to verify unsaved live preview. Base509d785/main/current checkout; preserve
all prior pending work, logo, remote Neon env and running3071.

Root-only write set: Pages admin/home-contextual.ts, Pages README, this report and
visual handoff. Reuse selectAsGroup for Services: Hero, intro and closing CTA each
open all editable fields together; catalogue stays an informational external entry
managed in Services CMS. Hidden retired how_it_works/eyebrows remain hidden; SEO
stays on its toolbar. No schema/content/public/locale/transport/persistence change.

Acceptance: four Element options without duplicate child options; actual editable
blocks render unsaved EN/ES/PT/FR copy/closing button/contact note and Refresh;
locale values survive switching, canvas child selection opens complete section.
Narrow source inspection and user-requested functional browser check with actual
editor/action/Services renderer and synthetic catalogue/settings/auth/media.
No aesthetic QA/full check suite, real staff/DB/save/publish/upload, commit/push/
deploy or original-server restart.

## Verification and limits

Built Next16.2.9 webpack fixture3189 uses actual PageContextualEditor/shell/bridges,
renderPageLivePreview/Services adapter, full ServicesListingRenderer, three
editorial renderers and ServiceCard with project styles. Auth/shared settings/
catalogue/media are synthetic; backend mutation actions disabled. Initial valid
content is sparse `{}`, exercising first edits into all three optional blocks.
Fixture full build, TypeScript and synthetic static generation pass.

Playwright grouped pass:12section cases (headline +body for each editable block
in EN/ES/PT/FR), four Refresh checks with stable iframe, reopening all four locale
values, localized closing button href/label and contact note combined with
synthetic Settings email/WhatsApp. Exactly four Element options/no optgroups or
child duplicates; hidden how_it_works absent. Catalogue shows its synthetic card
and informational inspector without fields. FR mobile390Hero edit and clicking
intro.headline opens the complete intro inspector (headline +body). Only preview
POSTs; zero uncaught browser errors. No renderer/transport fix needed in this task.

Evidence retained at `/private/tmp/central-hill-services-groups-fixture/`:
fixture source/config, `check.mjs`, `browser-result.json`, `browser.log` and
`build-fixture.log`. `git diff --check` passes. No full product/aesthetic QA/check
suite, real staff/DB persistence, Save/Publish/media upload or independent QA claim.
Only owned3189fixture stopped; original3071 and all prior work/logo preserved.
