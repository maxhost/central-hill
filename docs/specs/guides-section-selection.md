# Guides: one Element entry per section — 2026-11-05

User requests Guides match Home/Owners/Buildings/Real Estate/Guest consolidation
and explicitly asks to verify unsaved live preview. Base509d785/main/current
checkout; preserve all previous pending work, logo, remote Neon env and3071.

Root-only write set: Pages admin/home-contextual.ts, Pages README, this report and
visual handoff. Reuse selectAsGroup: Hero, city filter, catalogue, recommendations,
closing CTA and shared guide aside each open all their editable fields together.
SEO stays in its toolbar. Hidden legacy copy stays hidden. Existing enabled=false
filter collapse retains only its EN toggle; guide_aside retains shared_aside
surface, publication scope/layout and underlying schema/paths.

Acceptance: six Element entries with no redundant child options; unsaved edits
render EN/ES/PT/FR, including catalogue's required {city} token, closing button
and shared aside surface/Refresh; city toggle disable/re-enable behaves correctly.
Narrow source inspection plus user-requested functional browser check using actual
editor/action/Guides renderer/aside, synthetic city/guide/recommendation data and
disabled backend. No aesthetic QA/check suites, DB writes, staff login, save/
publish/upload, commit/push/deploy or original-server restart.

## Verification and limits

Built Next16.2.9 webpack fixture3190 uses actual PageContextualEditor/shell/bridges,
renderPageLivePreview/Guides adapter, GuidesListingRenderer, GuidesCityFilter,
GuideCard/RecommendationCard and GuideSharedAside with project CSS. Shared
queries/auth/media are synthetic; one city/guide/recommendation exercises rendered
catalogue/type copy. Backend mutation actions disabled. Fixture full build,
TypeScript and synthetic static generation pass; no product DB or staff session.

Playwright grouped pass succeeds:24section cases (six per EN/ES/PT/FR) and8Refresh
checks (page +shared_aside per locale), reopening all four aside values, correct
aside button locale href, catalogue {city} substitution and card button text,
recommendation heading/type label, Hero body and closing button text. Exactly six
Element options, no optgroups/children, all selectAsGroup. EN filter disable removes
its preview/other inspector fields while retaining its toggle, then re-enable
restores edited label. FR mobile390Hero edit and canvas child selection open the
whole Hero inspector.63preview POSTs only; zero uncaught browser errors.

Evidence retained at `/private/tmp/central-hill-guides-groups-fixture/`:
fixture source/config, `check.mjs`, `browser-result.json`, `browser.log`,
`build-fixture.log`. `git diff --check` passes. No blanket aesthetic QA/full product
check suites, persistence/save/reload/publication/media-upload checks or independent
QA claim. Only owned3190fixture stopped; original3071 preserved unchanged.
