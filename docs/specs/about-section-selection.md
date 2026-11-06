# About: one Element entry per section — 2026-11-05

User requests About match Home/Owners/Buildings/Real Estate/Guest/Guides/Services
consolidation and explicitly verify live preview. Base509d785/main/current checkout;
preserve prior pending work, unused logo, remote Neon env and running3071.

Simple root-only write set: Pages admin/home-contextual.ts, README, this report and
visual handoff. Reuse selectAsGroup for About's complete Hero, story, figures,
audiences, values, organisation, certifications, community, contact and merged FAQ.
SEO stays on toolbar; hidden legacy fields/identities stay hidden. No schema,
public renderer, translation, transport, persistence or Settings/Forms change.

Acceptance:10Element options without duplicate children; whole-section inspector
includes nested lists/contact labels/form copy. Actual editor/action/AboutPage
renders unsaved EN/ES/PT/FR values, figures and nested cards, Refresh and locale
reopening; canvas child selection opens whole section. Bounded functional browser
fixture with synthetic auth/Settings/FAQ/form/media, no DB or backend mutations.
No aesthetic QA/full product suites, staff login/save/publish/upload, commit/push/
deploy or original-server restart. Record actual fixture checks and limits below.

## Verification and limits

Only the About selectAsGroup opt-in changed product code. No renderer/transport
fix was needed. Existing FAQ merge supplies its title and group together; all
nested list/media controls remain reachable in their parent inspector.

Built Next16.2.9 webpack fixture3187 runs actual PageContextualEditor/shell/bridges,
renderPageLivePreview/About adapter and full AboutPage with project components/CSS.
Auth, Settings, FAQ data, media resolution and embedded ContactForm are synthetic;
Save/Publish/upload actions throw. Fixture content uses normalized defaultAbout
and an isolated FAQ key. Initial fixture build exposed a harness-only client import
of the server adapter; moving default-content imports to schema/normalizer fixed
it. Final fixture build/TypeScript/static generation exit0.

Chromium passes40section/locale cases: all10sections in EN/ES/PT/FR. Hero mission,
story/community paragraphs, figure value/label, audience/value/department/cert
rows, contact card action/localized destination, office title/email label and
form headline/intro update without Save. Four Refresh checks retain iframe URL;
reopening all4locale tabs preserves their Hero/contact values. FR mobile390px
editing passes. Clicking actual hero.headline from story selects the whole Hero,
including mission. Exactly10Element options, no optgroups/duplicate children,
merged FAQ group binding and separate SEO verified. Zero browser errors; all POSTs
go only to synthetic preview. The counter check selects its visible span because
the component intentionally also supplies an accessible sr-only value.

Artifacts `/private/tmp/central-hill-about-groups-fixture/`: source/config,
`check.mjs`, `browser-result.json`, `browser.log`, `build-fixture.log`.
`git diff --check`:0. No automatic aesthetic QA/full product suite, real DB
persistence/save/reload/upload, real form submit or independent QA claim. Only
owned temporary3187fixture stopped;3071PID7039 and all prior work/logo preserved.
