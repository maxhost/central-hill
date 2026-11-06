# Guest: one Element entry per section — 2026-11-05

User requests Guest match Home/Owners/Buildings/Real Estate consolidation and
explicitly asks to verify live preview. Base509d785/main, current checkout;
preserve prior tracked/untracked work, logo and running3071. Root-only write set:
Pages `admin/home-contextual.ts`, Pages README, this report and visual handoff.

Enable existing selectAsGroup for guest: Hero, welcome, Why, portfolio, services,
activities, dual CTA, testimonials and FAQ. Existing FAQ title/group merge and
SEO toolbar retained. Every editable child opens with its full section; both
closing panels and their buttons remain together. Hidden legacy/manual catalogue
items, hero booking CTA, retired eyebrows and fixed URLs stay hidden. No schema,
content, public renderer, locale, persistence or preview transport changes.

Acceptance: nine whole-section Element options; all existing editable fields
accessible within their block; unsaved EN/ES/PT/FR text updates and Refresh work.
Use the actual editor/action/full GuestPage renderer with isolated synthetic
shared catalogues/reviews/FAQ/settings/auth/media. No real staff session, DB
writes, save/publish/uploads, full aesthetic QA/check suites, commit/push/deploy
or restart.

## Verification and limits

Scoped Next16.2.9 webpack fixture on3194 uses actual PageContextualEditor,
shell/bridges/live wrapper, renderPageLivePreview, Guest adapter and complete
GuestPage. Shared catalogue/reviews/FAQ/settings/auth/media are synthetic;
ContactDialog renders a synthetic trigger only. Save/Publish/upload disabled.
One featured building, one review and a selected populated FAQ group exercise
their conditional headings; service/guide catalogues are empty, with their real
private-preview headings and CTA layouts retained. Existing empty-data/public
visibility rules stay unchanged. No real staff browser or DB access.

Forty passing cases across the grouped EN run and targeted ES/PT/FR continuation:
nine section headings and Refresh in each locale. Additional fields include
Hero subtitle, welcome lede, a Why benefit, portfolio/service/guide buttons,
both closing-panel buttons and owner title, and testimonials intro. Checks exactly
nine Element options with no optgroup/child duplicates; hidden URLs/manual items/
Hero booking CTA absent from bindings. Optional FAQ/testimonials copy starts
absent to exercise first edits; a valid missing Hero-video UUID exercises the
existing preview fallback. FR mobile Hero and canvas child selection pass; all
Hero text fields remain available when selected from the canvas. No uncaught
browser errors; Refresh retains iframe URL and current FAQ heading.

Initial run passes all EN blocks/Refresh, then times out waiting for the first ES
Hero heading (preview idle, no browser exception). A standalone ES diagnostic
confirms title input/payload/render. Targeted continuation explicitly awaits the
requested locale's iframe document before editing; ES/PT/FR all pass, including
61render POSTs only, mobile and child selection. No product renderer/transport
change needed; initial timing failure cause was not independently established.
Both records retained; do not claim a single uninterrupted four-locale QA pass.

Artifacts: `/private/tmp/central-hill-guest-groups-fixture/`, including fixture
source/config, `check-initial.mjs`, `browser-result.json`/`browser.log` (partial),
`debug-es.mjs`, `check.mjs`, `browser-targeted-result.json`/`browser-targeted.log`
(passing continuation). `git diff --check` passes. No full automatic check suite,
aesthetic QA, persistence/publication or independent QA claim. Stop only the owned
3194fixture; original3071 and user's state remain untouched.
