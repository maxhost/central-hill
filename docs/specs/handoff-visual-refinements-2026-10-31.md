# Local visual refinements — resume after context clear

## Current checkpoint before clear —2026-11-06

Read [Services form/languages handoff](handoff-service-locale-forms-2026-11-06.md)
first, then AGENTS.md and current git status/log. User's NEXT requested work is
individual Service forms with EN/ES/PT/FR inheritance/custom ownership and shared
images/category/icons, plus4language Service category names like Amenities.
No implementation before this clear; executable spec/plan still to prepare after
resume. Preserve Services form/conditional modules, no live-editor conversion.

Current actual-main3071 PID84793/parent84787/session56260 stays alive. It now uses
synthetic propertylocalesqa DB5658/proxy4558/storage9077. Historical remote-env and
PID/no-pending-work statements below are superseded by this new handoff. Never
print/copy credentials. New checkpoint documentation only; resolve hash git log -1.
No new code/tests/DB writes/migration/push/deploy. Preserve logo/publicmedia symlink,
all worktrees/fixtures/envs; contact DB update still deferred. Amenities/Building/
Apartment language-form corrections are delivered on main as recorded in AGENTS.

## Checkpoint before user-requested clear —2026-11-05

User asks to clear and start other work. Capture all this conversation's Pages/
preview/localized button/Guest contact/Blog contextual-editor changes plus docs
in one local checkpoint on main, base509d785. Resolve final checkpoint hash with
`git log -1`; no push/deploy. Prior section-specific reports retain exact checks,
initial failures/corrections and limits; no new QA/check suite for this checkpoint.
Final implementation13focused tests/typecheck/lint/compile and DB-free browser
checks passed as recorded below. No real DB save/publish/upload or migration.

All9Pages now group their editable sections. Latest Blog listing exposes Hero/
Journal/Newsletter + SEO; `/admin/pages/blog/article-sidebar` is a separate staff
editor with4CTA fields beside a localized sample article. Both views retain the
same whole Blog locale draft/revision/publication unit, explained in the UI.
Actual public post renderer and post-specific button precedence preserved.

Preserve unused untracked base-logo PNG, ignored.env.local (remote Neon, NOT an
isolated DB), all temporary fixture artifacts/worktrees and existing localhost3071
PID7039/session12390. Owned verification fixtures3185–319x are stopped; no need
to restart3071. Runtime log may contain encoded action payloads: do not dump it.
Contact DB update remains deferred. No outstanding authorized work after the
checkpoint; do not resume historical tasks or production/DB work after clear.

## Separate contextual Blog article sidebar editor —2026-11-05

User replaces isolated Post aside editing with a separate contextual editor.
`/admin/pages/blog` now has3sections + SEO; new staff route
`/admin/pages/blog/article-sidebar` exposes only4shared CTA fields. Blog tabs use
existing unsaved guard across views/started locales and explain both share the
complete existing per-locale draft/publication unit. No persistence/schema change.
BlogPostRenderer extracted from real public article composition; private
BlogArticlePreview injects localized illustrative content and current locale
snapshot, reusing actual article/index/sticky aside. No public sample/DB post;
newsletter preview disabled, no sample JSON-LD; public own-post CTA behavior kept.
Focused workspace supports new nested route.13tests/typecheck/lint/compile pass;
built DB-free actual-component/browser checks cover4locales/Refresh/reopen,
desktop380px aside/mobile stacking, navigation Cancel/Escape/Continue + other
locale guard, public JSON-LD/private annotation absence/post-specific override.
See [scope/evidence](blog-article-sidebar-editor.md). Only3185fixture stopped;
3071PID7039 and pending work/logo preserved. No real DB/save/publish/upload/send,
commit/push/deploy/restart or independent QA claim.

## Blog selector consolidation and preview —2026-11-05

Blog joins selectAsGroup:4Element entries for complete Hero/search, Journal,
Newsletter and shared article CTA. SEO separate; retired Featured/eyebrows hidden;
shared_aside surface preserved. Only grouping changed, no renderer/schema/locale/
transport/persistence fix needed. Actual-editor/action/Blog renderers synthetic
fixture passes16section/locale cases,8Refresh checks across both surfaces, locale
reopening, search placeholder/accessible label, aside button href, mobile and
whole-Hero canvas selection. See [scope/evidence](blog-section-selection.md).
No aesthetic/full product QA, DB/save/publish/upload/form send/commit/push/deploy/
restart. Temporary3186stopped;3071PID7039 and all pending work/logo preserved.

## About selector consolidation and preview —2026-11-05

About joins selectAsGroup:10whole-section Element entries for Hero/story/figures/
audiences/values/organisation/certifications/community/contact/mergedFAQ. Nested
fields/cards/lists and office/form copy open together; SEO stays separate. Only
group policy changed, no renderer/schema/locale/transport/persistence change.
Built actual-editor/action/AboutPage synthetic fixture passes40section/locale
cases,4Refresh/reopen checks, numeric counter updates, nested/contact/form text,
localized card href/mobile/whole-Hero canvas selection. See
[scope/evidence](about-section-selection.md). No aesthetic/full product QA, staff/
DB/save/publish/upload/form submit/commit/push/deploy/restart. Temporary3187stopped;
existing3071PID7039 and all previous pending work/logo preserved.

## Services Hero localized booking button —2026-11-05

Optional hero.cta_label/cta_url are editable per EN/ES/PT/FR and consumed by the
same Services Hero in preview/public. Blank/absent keeps existing Settings label
and booking URL; untouched targets do not inherit new EN overrides. URL HTTP(S)
validation, private actual-anchor selection and consolidated Hero retained.
18focused tests/typecheck/lint/compile and built DB-free actual editor/renderer
browser checks pass: four locales, Refresh/reopen/mobile/public/legacy fallback.
See [scope/evidence](services-hero-localized-button.md). No DB/save/publish/upload,
commit/push/deploy/restart; temporary3188stopped,3071PID7039 preserved.

## Services selector consolidation and preview —2026-11-05

Services joins selectAsGroup: one Element option for each Hero/intro/closing CTA
with all fields, plus informational external catalogue. SEO separate, retired
how_it_works hidden. No schema/content/locale/public/transport change. User-requested
built actual-editor/action/full-renderer synthetic fixture passes12section cases
in four locales, Refresh/reopen, closing button/contact note/locale href, catalogue
info, mobile and whole-section canvas selection. Sparse `{}` fixture exercises
first optional-block edits; fixture build/typecheck/static generation pass. See
[scope/evidence](services-section-selection.md). No full aesthetic/product check
suites, staff/DB/save/publish/upload/commit/push/deploy/restart. Preserve all prior
work/logo and3071; stop only temporary3189fixture.

## Latest localhost relaunch —2026-11-05

User requested relaunch again; no listener remained on3071. Node22/pnpm dev now
runs Next16.2.9/Turbopack on3071, listenerPID7039/session12390. Login GET200.
Same checkout/env, no content/DB writes. Runtime log remains
`/private/tmp/central-hill-3071-relaunch-20261105.log`; avoid dumping action payloads.

## Guides selector consolidation and preview —2026-11-05

Guides now uses selectAsGroup: six whole-section Element entries for Hero, city
filter, catalogue, recommendations, closing CTA and shared guide aside; SEO
separate. No schema/content/public/locale/transport change. Existing disabled-filter
collapse and shared_aside surface retained. User-requested built synthetic actual
editor/action/full-renderer fixture passes24section cases across four locales,
8Refresh checks over both surfaces, aside reopening/locale href, city interpolation,
buttons/type label, filter off/on, mobile and whole-section canvas selection.
See [scope/evidence](guides-section-selection.md). No full aesthetic QA/check suite,
staff/DB/save/publish/upload/commit/push/deploy/restart. Preserve all pending work,
unused logo and3071; stop only temporary3190fixture.

## Localhost restart requested —2026-11-05

User explicitly requested relaunch3071. Old Next dev processes74401/74407 closed;
Node22 `pnpm dev --port 3071` is now running,
Next16.2.9/Turbopack, listenerPID99981/session58232. Login GET returns200.
Log `/private/tmp/central-hill-3071-relaunch-20261105.log`; avoid dumping action
payload logs. Existing env/data/pending changes preserved; no save/publish/DB write.

## Guest closing contact lines + focus synchronization —2026-11-05

Added localized optional dual_cta.guest.contact_line and owner.contact_line, named
by panel and placed outside the separate dialog-copy group. Preview/public use
each locale's override; blank/absent retain Settings defaults. Old target absence
stays absent instead of adopting EN override. No migration/DB/Settings write.
Browser diagnostic also confirmed auto preview selection stole inspector focus
on ready/locale switch: optional select.focus boolean now distinguishes automatic
scroll/highlight (false) from explicit selection focus. Guards preserved; no
public behavior change. See [report](guest-closing-contact-lines.md).
16focused tests, typecheck/lint/compile pass. Built actual-component/CSS synthetic
fixture passes both lines in four locales/Refresh/reopen/clear/mobile/public
fallbacks and focus replay; dialog group and live title retained. Independent
source review has no blockers; no real staff/DB/save/publish/send/upload claim.
All pending work/logo and3071 preserved; only3191fixture stopped. No commit/push/
deploy/original-server restart.

## Guest contact form preview + bordered inspector group —2026-11-05

User requested Show/Hide form in Guest Closing dual CTA, then placement immediately
above Owner contact dialog title and a border around button/title/intro matching
Owners Why Benefits. Real ContactDialog/ContactForm opens privately and follows
unsaved locale copy; controlled bridge marker survives RSC/Refresh/locale changes.
Close/backdrop/Escape (also inspector) work, submissions stay blocked; public
behavior unchanged. No kernel/DB/schema/persistence change. See
[report](guest-contact-dialog-preview.md). Functional candidate:13tests,
typecheck/lint/compile pass, built synthetic actual-component/CSS fixture passes
four locales/focus/Refresh/close/mobile/submit-block/public controls. Initial dev
fixture reload and bootstrap limits recorded. Later L0 grouping is source-only,
no automatic checks/QA/browser after that refinement; user reviews3071. No real
staff/DB/save/publish/send/upload/commit/push/deploy/restart; preserve all prior
work/logo and3071. Stop only temporary3192fixture.

## Guest closing CTA: identify dialog Title/Intro —2026-11-05

User's nonvisible Title/Intro fields are dual_cta.owner.contact.title/intro,
forwarded correctly to the owner button's ContactDialog. Copy appears only when
that public modal opens; the private bridge blocks form interactions. Clarified
both exact-path labels and added Guest closing-section explanatory note in four
UI languages. No preview/dialog/persistence behavior change. See
[scope](guest-closing-contact-field-labels.md). L0/source only, user review3071;
no automatic QA/tests/suites/DB/save/publish/upload/commit/push/deploy/restart.
All earlier pending work and logo preserved.

## Guest Hero Book Now: per-language label/link —2026-11-05

New optional localized hero.cta_label/cta_url overrides appear together inside
Guest Hero; actual preview/public anchor consumes selected-locale values. HTTP(S)
or blank (fallback), target URL input, real-anchor selection using existing seam.
Keep ignored legacy hero.cta hidden/unused: seed stored Browse Our Apartments →
Buildings, so exposing it would silently change untouched public booking CTA.
Target legacy absent overrides remain absent instead of adopting EN new values.
See [report](guest-hero-localized-button.md).13focused +2affected tests pass,
typecheck/lint/compile pass; real editor/action/GuestPage synthetic browser verifies
four independent locale states/Refresh/mobile/anchor selection and public hrefs/
fallback. Independent source reviewer confirmed compatibility correction; no real
persistence/DB action. Preserve3071/all pending work/logo; stop only3193fixture.
No save/publish/upload/commit/push/deploy/restart.

## Guest selector consolidation and preview —2026-11-05

Guest now uses selectAsGroup: nine whole-section Element options, both closing
panels/buttons together, FAQ title/group merged and SEO separate. Hidden catalogue
items/booking copy/URLs stay hidden. No schema/content/locale/public/transport
change. User-requested functional fixture uses actual editor/action/full GuestPage:
EN grouped pass plus ES/PT/FR continuation verify40heading/Refresh cases, nested
copy/buttons, mobile and child canvas selection. Initial ES iframe timing failure
and confirmation limits recorded in [report](guest-section-selection.md). No full
aesthetic QA/check suites, staff/DB/save/publish/upload/commit/push/deploy/restart.
Preserve3071/all prior work/logo; stop only owned3194fixture.

## Real Estate selector consolidation and preview —2026-11-05

Real Estate joins Home/Owners/Buildings selectAsGroup: ten whole-section Element
options, nested cards/market/process/buttons together, FAQ title/group merged and
SEO separate. No schema/content/locale/URL/public/transport change. User explicitly
requested functional preview checks: actual editor/action/full RealEstatePage
synthetic fixture passes44cases (ten headings plus Refresh per four locales),
nested fields/animated number/mobile/child selection. Initial CountUp selector
ambiguity fixed only in test; synthetic blank market-label key warnings/limits
recorded in [report](real-estate-section-selection.md). No full aesthetic QA/check
suites, real staff session, DB/save/publish/upload/commit/push/deploy/restart.
Preserve3071/all prior work/logo; only temporary3195fixture stopped.

## Buildings selector consolidation and preview —2026-11-05

Buildings now reuses Home/Owners selectAsGroup: one Element option per complete
block (Hero, owner panel, Figures, calculator), external catalogue unchanged and
SEO on its toolbar. No schema/content/locale/transport/public change. User explicitly
requested scoped functional preview verification: real editor/action/full Buildings
renderer fixture passes unsaved edits/buttons/figures/Refresh across four locales,
mobile and child selection. Initial partial pass and targeted continuation/limits
recorded in [report](buildings-section-selection.md). No full automatic aesthetic
QA/check suites, DB/save/publish/upload/commit/push/deploy/restart. Preserve3071,
all prior pending work and unused logo; only temporary3196fixture stopped.

## Owners live preview blocked by unresolved Hero media —2026-11-05

Read-only diagnosis of legacy EN finds valid local payload but unresolved Hero
asset; whole-page resolved-media validation rejected Hero and Figures updates.
Private live preview now uses renderer fallbacks for missing valid UUID assets,
matching saved preview; available MIME/ID/blob guards and Save/Publish stay strict.
See [report](owners-live-preview-media.md).6/6focused tests, typecheck/lint/compile
pass; isolated real Owners editor/action/full renderer browser verifies four
locales +Refresh, EN count and FR mobile without saving. Independent source review
finds no blocker; authenticated3071 persistence was not exercised. No DB repair,
save/publish/upload/commit/push/deploy; existing runtime/work/logo preserved.

## Owners selector consolidation —2026-11-05

User requests Owners follow Home: one Element entry per section, all fields edited
together. Owners now uses existing selectAsGroup metadata; merged Figures title/
list, FAQ, nested lists/buttons and old child selections resolve to whole blocks.
SEO retains dedicated toolbar. See [scope](owners-section-selection.md).
L0/manual review3071; no automatic tests/QA/DB writes/save/publish/restart/commit/
push/deploy. All prior pending work, runtime and unused base-logo PNG preserved.

## Home Element: one entry per block —2026-11-05

User extends Figures consolidation to Hero, Guests pitch and all Home blocks.
Every Home section now uses existing selectAsGroup: one option opens all fields,
including when clicking a child annotation. SEO remains on its separate toolbar;
Avantio remains excluded. No other Page selection changes. See
[scope](home-figures-group-selection.md). L0/user review3071, no automatic tests/
QA/DB writes/save/publish/restart/commit/push/deploy. All prior work/logo preserved.

## Home selector excludes Avantio —2026-11-05

User removes the noneditable script-driven booking engine from Element. Home
outline/descriptor/private allowlist no longer expose Avantio. Preview keeps its
integration notice without selection binding; public engine unchanged. Stale
removed selections resolve to a valid section without clearing content. See
[scope](home-editor-editable-elements.md). L0/user review3071; no automatic tests/
QA, DB writes, save/publish, commit/push/deploy/restart. Preserve prior work/logo.

## Home Figures selector consolidation —2026-11-05

User wants one Home Figures entry because it already edits title and counter list.
Optional shared section metadata selectAsGroup hides redundant child options and
the duplicate group caption only for Home stats. Inspector/preview bindings stay
intact; previous title/list selections resolve to the complete block. See
[scope](home-figures-group-selection.md). L0/user review on running3071; no
tests/automatic QA/DB writes/save/publish/commit/push/deploy/restart.

## All-Pages preview follow-up audit —2026-11-05

User requests same/similar preview defects fixed across all nine Pages editors.
See [audit, changes and evidence](pages-live-preview-audit-2026-11-05.md).
Fallback media/empty figures in Buildings and Owners closing media now allow
omission; optional helper label no longer requires an unused hidden URL. No
shared-guard weakening or DB migration. Root localized stats title and target
optional-group copy survive preparation from EN; fresh Home defaults use valid
icons. CountUp value changes reset its local animation (ADR0056); Home/Guest video
elements key on resolved URL to actually change playback source. All prior work,
unused untracked logo and running3071 preserved; no commit/push/deploy/DB write.

## Buildings live preview: first Hero edit —2026-11-05

User reproduces EN Hero Title “Mi titulo” failing to update even with Refresh.
Legacy Buildings Hero can be absent; the old setter created only headline,
omitting required blank image_media_id and triggering whole-preview validation.
New Pages field setter supplies missing required media slots along the edited
path, recovers already sparse local blocks and preserves optional media/flags/
lists/other sections. FieldNode now retains optional media metadata. Source
review caught and confirmed a Home target optional-poster guard regression fix.
14+1focused cases, typecheck/lint and compile-mode build pass; isolated real
editor/validator/BuildingsHero Next browser sequence passes title/Refresh/typing/
mobile without saving. Full limits and inherited broad-test failures in
[report](live-preview-debug-2026-11-05.md). No DB writes/publish/upload/auth changes,
no commit/push/deploy. All prior pending work and3071 preserved.

## Button element labels across all Pages —2026-11-05

User asks all nine editors distinguish buttons from Text in Element. Root source
review covers nine schemas and owning composers. Owners/Buildings hero contact
label now reads Contact button; Guest closing CTAs retain owner/guest context.
Action labels consistently name Button/Card/Choose/Submit/Back/Open guide button,
including Guides' field-label override, in EN/PT/ES/FR. Ordinary text/badge/figure/
filter labels unchanged. See [scope](page-editor-button-labels.md).
L0/user review on running3071; no tests/automatic QA/check suites/DB writes.
Earlier Home per-locale URL code and all pending artifacts preserved; this
follow-up adds no URL, schema or publication behavior. No commit/push/deploy.

## Home buttons: localized labels and links —2026-11-05

User requests grouped label+URL editing per EN/PT/ES/FR for hero primary,
guests_pitch.cta and closing guest panel “Planning a stay…”. See
[active scope/results](home-button-localized-links.md), ADR0055. URLs now belong
to each locale snapshot. New optional guest-panel URL falls back to localized
Avantio; old target absence is preserved without false unsaved state. All three
actual button anchors are selectable privately; public callers omit annotations.
Existing fixed Owners/navbar links remain. Functional checks used synthetic
DB-free fixtures; no actual saves/publications/DB writes, no push/deploy/commit.
Local3071 remains available for the user's review. Preserve untracked base-logo.

## Visual editor button labels —2026-11-05

Follow-up from checkpoint509d785: Book Now in Home's hero selects
`hero.cta_primary.label`; its generic Link (URL) is `hero.cta_primary.url`,
independent of navbar booking. Path-aware labels now preserve button/primary/
secondary identity in selector and controls, with EN/PT/ES/FR URL labels.
Read [scope](page-editor-button-labels.md). User requested3071 relaunch for
manual review; no listener present initially. No tests/automatic QA, DB writes,
commit/push/deploy. Preserve the unrelated base-logo PNG.

## Backoffice checkpoint before clear —2026-11-05

User requests one local commit, then clear to work on something else. Base/main
c9484b6 (last published Avantio correction); this checkpoint is local only, no push
or deployment. Resolve the final hash with git log -1. No required task remains
after recording the checkpoint; wait for the user's next objective.

Final BO changes: ordered Pages list; Website group with Buildings→Amenities/Cities,
Guest Services→Guest Guides→Blog Posts; separate Content heading with FAQ,
Testimonials, Forms always visible. Page editors default to hidden sidebar with
topbar toggle, full main width,500px left inspector, right preview, sticky header
with languages/status/Save draft/Publish. Horizontal page navigator uses the same
order as Pages; native English Cancel/Continue modal guards unsaved changes in
started locales/queued images. Saved drafts need not be published to navigate.
Guard covers the page strip only (not browser Back, sidebar or external links).
User iterated visually on localhost; no automatic test/typecheck/lint/build/browser
QA or actual save/publish/upload/form submissions run. No new independent QA claim.

Owned paths: Pages admin order/query/screens/editor/navigator + README; Backoffice
types/registry/editor types/AdminShell/new AdminWorkspace/PageEditorShell + README;
Blog/Buildings/FAQ/Geography/Guides/Services/Testimonials screen contributions;
Forms contract contribution; Geography README; four message files; AGENTS.md and
the sidebar/workspace/page-navigation specs plus this handoff. No core/kernel,
database/schema/migration or public site code changes.

Ignored.env.local authentication URL now http://localhost:3071 (previous3000);
no credentials committed. This environment uses remote Neon: do not assume local
QA isolation. Account lookup was read-only; no password/account/DB writes.
Local dev3071 remains running (latest session28126, Node22); preserve it unless
user asks to stop. Untracked unused Central Hill base-logo PNG remains outside
the commit. Earlier notes below retain historical delivery boundaries.

## Visual editor sticky language/action header —2026-11-05

User requests screenshot header remain visible while scrolling. PageEditorShell
header now sticky top0/z20 with opaque bg token; title, languages, editorial state,
Save draft and Publish stay together. Layout/actions and page navigation unchanged.
Local L0/user review on3071; no tests/automatic QA, DB changes, commit/push/deploy.

## Visual editor page navigator and unsaved modal —2026-11-05

User requests direct page switching above device preview controls, with English
unsaved-change confirmation. Pages supplies a Page strip and native Cancel/Continue
dialog via a new optional Backoffice adapter view slot. Aggregate dirty flag covers
started languages and local queued images; saved drafts can be left unpublished.
Confirmed navigation drops only this page's local blob queue; no auto save/publish.
Shared page-order constant also feeds the Pages list. Left500px inspector retained.
Read [scope](page-editor-page-navigation.md). Local/user review on3071, no automatic
tests/QA, persistence/media actions, commit/push/deploy. Preserve all earlier pending
BO work, ignored auth URL correction and unused logo.

## Visual editor inspector on the left —2026-11-05

User moves the500px inspector to the left, canvas to the right at xl. Explicit
grid columns/positions and separator switch sides; existing stacked layout below
xl retained. Update workspace spec/Backoffice README. Local L0/user review on3071;
no automatic tests/QA, DB changes, commit, push or deployment.

## Visual editor inspector500px —2026-11-05

User revises right inspector450→500px at xl. Update shared PageEditorShell grid,
Backoffice README and workspace spec. Local L0, user reviews on running3071;
no tests/automatic QA, DB changes, commit, push or deployment.

## Visual editor inspector450px —2026-11-05

User revises right inspector400→450px at xl. Update shared PageEditorShell grid,
Backoffice README and workspace spec. Local L0, user reviews on running3071;
no tests/automatic QA, DB changes, commit, push or deployment.

## Visual editor inspector400px —2026-11-05

User revises right inspector384→400px at xl. Update shared PageEditorShell grid,
Backoffice README and workspace spec. Local L0, user reviews on running3071;
no tests/automatic QA, DB changes, commit, push or deployment.

## Localhost login origin fix —2026-11-05

After reopening3071 for user review, login POSTs failed403 with Better Auth
`Invalid origin: http://localhost:3071`. Ignored `.env.local` still set
BETTER_AUTH_URL to localhost3000. Change only that local URL to localhost3071
and restart this checkout's dev server. No account/password/DB changes,
credential dumps, automated login submissions or production changes. User
retries their login; this fixes the origin rejection, not a password reset.

## Focused visual page editor workspace —2026-11-05

User requests hiding sidebar on page-editor entry, reopening with an icon and +20%
inspector width. Add private AdminWorkspace client layout with desktop topbar toggle;
AdminShell retains server identity/nav slots. Page routes use full available width,
sidebar initially hidden, inspector320→384px at xl. Other BO routes default visible;
mobile remains stacked with sidebar hidden. Toggling does not remount the editor.
Read [scope](backoffice-editor-workspace.md). Local L0/user review; no automatic
QA/tests, DB changes, commit/push/deploy or localhost restart. Preserve preceding
Pages/sidebar organization changes and unused untracked logo.

## Backoffice sidebar organization —2026-11-05

User requests Buildings→Amenities/Cities; Guest Services, Guest Guides, Blog Posts;
then Content→FAQ, Testimonials, Forms. Explicit answer selects a Content heading
with always-visible options. Add website group before content, adjust screen
contributions/order and four-locale labels. Existing nested service/blog menus and
permissions retained; no nav renderer changes. Read
[scope](backoffice-sidebar-organization.md). Root-only local L0 change, no automatic
QA/tests, DB writes, commit, push, deployment or localhost restart. Prior pending
Pages list-order edits and unrelated untracked logo preserved.

## Backoffice Pages list order —2026-11-05, afterc9484b6

User requests `/admin/pages` order: Home, Owners, Buildings, Real Estate,
Guest Landing Page, Guest Guides, Guest Services, About Us, Blog. Root changes
only the display array in Pages `admin/queries.ts`, plus Pages README/this handoff.
Schema registry order, content and database are unchanged. Aesthetic L0: no tests
or automatic QA; user reviews. Local source change only, no commit/push/deploy
requested for this follow-up. Local3071 remains stopped per the user's last request.
Unrelated untracked Central Hill base-logo PNG preserved.

## Avantio children-ages publication authorized —2026-11-04

After local delivery the user replies "Listo" and requests push to GitHub with the
supplied token. Commit/push the scoped Settings correction and its docs to
maxhost/central-hill main from0547d67. Keep credentials transient and preserve the
unused untracked logo. No automatic checks, searches/reservations or DB changes.
Resolve final commit with git log -1; report actual GitHub/Vercel status after push.

## Avantio children-ages correction —2026-11-04, after0547d67

User authorizes restoring missing ages after selecting Children. Root adds a scoped native
`abroPopupNinyosWebPlus` hook, registered by the client island, to show the age fields returned
by Avantio without its disabled framework/cookie bundle. Existing palette and vendor form
serialization/validation retained. Effect cleanup/restart supports Strict Mode. Read
[correction scope](avantio-children-ages-fix.md). Local3071 user review only: no automatic
tests/check suites/browser QA, searches/reservations, DB changes, commit, push or deploy.
Unused Central Hill base logo remains untouched. Source changes are in Settings only,
plus this handoff and the two Avantio specs; public contracts and locales unchanged.

## Opacity/floating-position release authorized —2026-11-04

User requests committing/pushing the final local adjustments to
maxhost/central-hill with the supplied token used only for this operation;
saved55mais credentials remain unchanged. Base/fresh origin maindf7f42f.
Final behavior: navbar/submenu85% opacity, floating stack bottom320px from640px
and20px below, inter-button gap30px. Both retain --fab-lift. Root commit scope:
globals.css, WhatsAppFab, Settings README, ADR0053 and this handoff. Unused
Central Hill base logo remains untracked and untouched. No tests/automatic QA,
subscription submits, DB writes/migrations or new environment variables.
Use git log -1 for the commit and GitHub/Vercel status after push for publication.

## Floating actions bottom offset —2026-11-04

Current gap: user reduces40→30px between the buttons at all viewports;
desktop/sm bottom320px and mobile20px retained.

Latest gap: user requests40px between Earn With Us and WhatsApp. Applied
gap-[40px] at all viewports; desktop/sm bottom320px and mobile20px retained.

Current user revision: desktop/sm offset320px; gap increases20% from12px to
14.4px at all viewports. Both circles move together; mobile bottom20px retained.

Latest user revision: desktop/sm offset is now220px (previously120px). Both
circles move together; same12px gap, mobile20px and --fab-lift. Same L0 scope.

User requests WhatsApp120px above the viewport bottom on desktop, and asks
whether Earn With Us also moves. Both share the fixed stack; confirmed they
move together with12px gap. Existing sm (≥640px) offset28→120px, mobile20px
unchanged; --fab-lift still adds service booking-bar clearance. Aesthetic L0,
user reviews3071; no tests/automatic QA, DB writes, commit, push or deploy.

## Navbar/submenu opacity85% —2026-11-04, afterdf7f42f

User requests revising both backgrounds70→85%. Updated the shared scoped
background-color in globals.css plus Settings README/ADR0053 note. Initial
hero remains transparent. User also asks the current WhatsApp bottom offset:
1.25rem (20px) below640px,1.75rem (28px) from640px, plus --fab-lift when service
mobile booking chrome is visible. No offset change requested. Aesthetic L0,
user reviews3071; no tests/automatic QA, DB writes, commit, push or deploy.

## Opacity/logo release authorized —2026-11-04

User requests commit/push of the70% navbar/submenu opacity and portable dark
logo import to maxhost/central-hill. Base/fresh origin maincf21750. Include the
new identical ASCII-named PNG copy, header import, globals.css and accompanying
README/ADR0053/handoff. Preserve the unused Central Hill base logo untracked.
Use the supplied token only for this push without modifying saved credentials.
No tests/automatic QA, subscription sends or DB writes. Vercel deployment status
confirms publication; no new environment variable or migration needed.
Final commit is resolved with git log -1.

## Dark logo portable import fix —2026-11-04

User reports local Turbopack cannot resolve the NFC logo import introduced for
Vercel. Normalizing only the import fixed that deployment but not local module
resolution. Copy the original supplied dark PNG unchanged to
logos/logo-barra-topo-base.png and use that ASCII path in SiteHeader. Preserve
the original PNG and all pending70% opacity work. The new runtime copy must be
included in a later commit. Root owns the PNG copy, header import, Settings
README, ADR0053 note and this handoff. No tests/check suites/automatic QA,
DB writes, commit, push or deployment requested; user reloads3071.

## Navbar/submenu opacity —2026-11-04, aftercf21750

User requests matching both surfaces at70% (previously navbar85%/submenu95%).
Scoped globals.css rule sets background-color using the bg token at70% on
data-site-header and data-subnav-panel. Initial hero transparency, blur, text,
logos and submenu hover behavior preserved. Updated ADR0053/Settings README.
Previous navigation release cf21750 is GitHub-synced and Vercel-successful.
This follow-up is local aesthetic L0: user reviews3071; no tests/automatic QA,
DB writes, commit, push or deployment requested.

## Navigation/spacing release authorized —2026-11-04

First push35fc36c reached GitHub but Vercel deployment failed. Source inspection
identified the dark logo import using decomposed a+U0303 while Git stores
precomposed U00E3 in versão. They resolve alike on macOS but differ on Linux.
Follow-up normalizes the import to the exact Git path before republishing;
no tests/check suites or subscription sends. Final deploy status must be read
against the follow-up commit rather than claiming35fc36c deployed successfully.

User explicitly requests committing and publishing accumulated local adjustments
to maxhost/central-hill, with their token used only for the push and no changes
to saved55mais credentials. Base/fresh origin maina312986. Scope: transparent
hero/frosted-scroll navbar with light/dark logos; hover submenu close behavior;
owner floating CTA above WhatsApp (12px gap,73.92/84.48px circle); Home closing
panels70px bottom; shared Footer35px top; building detail Book Now60px right/
5px top margins. Include the now-referenced dark top-bar PNG and ADR0053/0054.
The unused Central Hill base logo stays untracked and untouched.

User-owned localhost visual review; no automatic tests/check suites/browser QA
or subscription submits run. No migrations/DB writes or new environment variables.
Commit is resolved with git log -1; publication is confirmed by GitHub/Vercel
deployment status after push. Earlier local-only notes below are historical.

## Submenu hover lifetime —2026-11-04

User requests submenus expand on hover and hide after leaving menu/submenu.
Remove Owners' scroll-pinned OWNERS_NAV_CSS from SiteHeader. Scoped globals.css
override hides panels immediately when neither hovered nor keyboard-focused
(:focus-visible), so mouse-click focus-within cannot leave them stuck open.
Header/logo hero rules now use the same keyboard-visible focus condition.
Desktop nav/group fill the64px row to remove the gap before top-full submenus.
Keyboard navigation and mobile accordions preserved. Updated HeaderScroll
comment/Settings README. Aesthetic L0; user reviews3071, no tests/automatic QA,
DB writes, commit, push or deployment.

## Building detail Book Now margins —2026-11-04

User requests60px right margin and5px top margin only on the Book Now button
with shrink-0 in every building detail design (example big-chiado-terrace).
Applied mr-[60px] mt-[5px] directly to that ButtonLink in building-detail.tsx;
shared button primitive and other CTAs unchanged. Aesthetic L0; user reviews
localhost3071, no tests/automatic QA, DB writes, commit, push or deployment.

## Footer audience row top spacing —2026-11-04

Follow-up: user requests35px for this exact footer Container. Updated70→35px
site-wide; bottom padding remains pb-9. Same aesthetic L0 scope.

User requests70px top padding above Are you a guest or an owner? Owner · Guest.
The row is in the shared Footer; its Container top padding changes74→70px
site-wide. Root-owned kernel adjustment recorded in ADR0054. Aesthetic L0,
user reviews3071; no tests/automatic QA, DB writes, commit, push or deployment.

## Home Owners/Guests bottom spacing —2026-11-04

User requests70px bottom padding for Home's two-column Owners/Guests section
before the footer newsletter. Home-only wrapper now applies70px top/bottom
(bottom previously0), leaving the shared panels and Blog spacing unchanged.
Aesthetic L0; user reviews3071, no tests/automatic QA, DB writes, commit or deploy.

## Floating Earn With Us size —2026-11-04

Second follow-up: another10% over current size, now73.92px mobile/84.48px
desktop; label13.2/14.52px, proportional horizontal padding. Same L0 scope.

User requests20% larger owner circle only. Diameter56→67.2px mobile and
64→76.8px desktop; label10→12px and11→13.2px, proportional horizontal padding.
WhatsApp unchanged; shared stack keeps12px gap and --fab-lift. Aesthetic L0,
user reviews3071; no tests/automatic QA, DB writes, commit, push or deployment.

## Transparent navbar / floating owner CTA —2026-11-04

User requests restoring transparent-at-top / warm-paper-scroll navigation,
removing Earn With Us from navbar and placing it as a circle above WhatsApp.
Bounded root-owned aesthetic L0 change on main, basea312986. Source state was
clean except two unused original logos. No agents, tests/check suites/automatic
visual QA, database/storage writes, commit, push or deploy requested.

Changed globals.css header rules only (feature gradients elsewhere preserved),
HeaderScroll (scroll toggle only), SiteHeader (light/dark supplied PNG switch,
remove owner tab and drawer prop), MobileDrawer (additive optional earn prop)
and WhatsAppFab (shared fixed stack, localized owner circle,12px gap). All four
locale labels/Owners navigation preserved. Stack keeps56/64px circle sizes,
existing viewport offsets and --fab-lift for the service mobile booking bar.
Dark base logo is now referenced and must be included in a later commit;
the other unused original logo stays untracked. Updated Settings README and
ADR0042 supersession note; root-owned ADR0053 documents the kernel seam change.
User validates localhost3071; no new QA or deployment claim.

## Brevo release authorized —2026-11-03

User now requests commit/push/deploy of the footer+Blog Brevo integration to
maxhost/central-hill, using their token for this operation without changing
saved55mais credentials. Base/fresh origin main1701436. Source newsletter
exports and prior test source included, no tests/check suites/automatic browser
QA or actual subscribers sent per user's explicit instruction. Vercel's build
and GitHub deployment status confirm publication; no migration/Neon write or
new environment variable. See footer-newsletter-brevo.md. Two unused original
logo files stay untracked; commit is resolved with git log -1.

## Newsletter Brevo integration —2026-11-03, after1701436

User authorizes connecting the footer modal and then the Blog newsletter band
to the supplied docs/newsletter/HTML.txt form. Footer keeps inline email →
prefilled editable modal; Blog keeps the same dark form-card UI. Shared Settings
helper posts EMAIL/OPT_IN=1/locale/honeypot as FormData to the fixed HTML action
with isAjax=1, requiring explicit provider success. No API key/global vendor
script, local Leads record, Resend or Neon write. Blog listing and articles share
the new form through the Settings contract. Private preview stays disabled.

IMPORTANT: user explicitly stopped tests/QA; they inspect localhost without
clicking Subscribe. Do not resume automatic tests/checks/browser QA or submit
subscriptions without a new request. No real subscriber created by the agent.
Previous unit-test attempt failed on tsx sandbox socket; escalated retry was
interrupted, no pass claimed. See footer-newsletter-brevo.md for exact state.
No commit/push/deploy requested for this integration; previous logo release
1701436 was already pushed and Vercel-successful. Preserve untracked newsletter
exports, the new helper/form/test/spec and the two unused original logos.

## Logo commit/push authorized —2026-11-03

User explicitly requests pushing these logo changes to maxhost/central-hill
using the supplied token only for this operation. Do not alter saved55mais
credentials. Main and fresh origin/main both fca0414 before this release.
Node22 `pnpm build` passes (exit0,210 static pages), and diff-check passes.
No tests/automatic visual QA under the L0 agreement, no DB writes/migrations.

Commit scope: site-header.tsx, site-footer.tsx, Settings README, this handoff,
logos/Logo Barra Topo bg.png and logos/Logo footer.png. The two other unused
user-supplied logo files remain untracked and untouched. Header includes the
three successive10% enlargements; footer uses200px natural-width rendering.
Final commit is resolved through git log -1; GitHub/Vercel status confirms
publication after push. This authorization supersedes the local-only boundary
in the historical implementation entries below.

## Footer image logo —2026-11-03

User requests replacing Footer's text Central Hill with logos/Logo footer.png.
Root owns site-footer.tsx, Settings README and this handoff. Preserve the
preceding uncommitted header-logo changes and all user-supplied logos/ files.
Static Next Image import of the original transparent3508×2481 white PNG,
200px width/max-width100%, natural proportions, alt Central Hill, default lazy
loading. Shared Footer kernel/contacts/navigation unchanged. Include this PNG
and the referenced top-bar PNG in a later commit; no commit/deploy requested
here. Aesthetic L0; user reviews3071, no automatic tests/QA or DB/storage writes.

## Top-bar image logo —2026-11-03

Third follow-up: another10%, now47.916px mobile/53.24px from768px, retaining
natural proportions; sizes hint170/189px. Same L0 scope, user reviews localhost.

Second follow-up: another10% over the current size, now43.56px mobile/48.4px
from768px (21% above the original36/40), with sizes hint155/172px. Same L0 scope.

Follow-up: user requests10% larger. Height is now39.6px mobile/44px from768px
(previously36/40), natural aspect ratio retained; image sizes hint141/156px.
Aesthetic L0, user reviews3071; no tests/automatic QA or deployment.

User requests replacing the text Central Hill in the top navigation with the
provided logos/Logo Barra Topo bg.png. Base main/fca0414 (already deployed to
GitHub/Vercel in the preceding conversation;24 Neon migrations were current).
Pre-existing untracked logos/ directory contains four user-supplied originals;
preserve all. Root owns site-header.tsx, Settings README and this handoff.

Header now statically imports the requested transparent3397×958 PNG using Next
Image, priority-loaded, at36px high mobile/40px from768px, with its natural
aspect ratio. Existing localized Home link/aria label preserved; image alt is
Central Hill. No logo recreation, image editing, footer or other asset changes.
The referenced PNG must be included in any later commit; the other supplied
logos remain unmodified/untracked. Aesthetic L0: user validates localhost,
no automatic tests/QA, DB/storage writes, commit, push or deployment requested.

## Commit and production release authorized —2026-11-01

User now explicitly requests committing and deploying to maxhost/central-hill,
and checking whether Neon needs migrations. This supersedes the prior local-only
delivery boundary for these accumulated changes. Preserve the deferred contact
data update; no content/media DB writes are requested here.

Fresh origin/main is0d44203; local main contains five unpublished commits through
f371a9a, plus the19 pending Blog source/test/doc files. User is informed the
release includes those five previous commits and the new Blog commit. No remote
divergence (0behind/5ahead before committing). GitHub's existing commit status
identifies Vercel as the connected deployment provider.

Read-only Neon MCP audit: project central-hill/weathered-cake-89640915, primary
branch main/br-little-heart-aihh9v63, database neondb. All24 migration ledger
hashes and timestamps match local drizzle files/journal,0000..0023 inclusive.
No migration files differ from origin/main. No migration is needed or applied;
new media fields are optional leaves in existing JSON content.

Final Node22 `pnpm build` on the complete working tree passes (exit0,210 static
pages). Earlier focused tests/typecheck/lint retain their recorded candidate
limits; no new aesthetic tests/automatic visual QA performed. `git diff --check`
passes. Deployment health and final commit must be confirmed after Git push;
use git log -1 and GitHub/Vercel status for the resulting checkpoint.

## Blog Journal bottom spacing —2026-11-01

User requests From the Journal bottom padding70px. Applied directly to the
Journal section at all viewports, preserving its existing responsive top
padding. Aesthetic L0; user reviews3071, no tests/automatic QA or DB writes.

## Blog Owners/Guests panels —2026-11-01

User requests the Home two-column Owners/Guests band on the Blog. Placement
explicitly confirmed: immediately after From the Journal, before Newsletter.
Reuse the existing DualCta composer with published Home content/media for the
current locale; editing remains Pages→Home, contacts Settings. Home drafts and
Blog-local preview never alter the shared published content. Existing localized
fallbacks, Owners route and Avantio booking target remain. No independent Blog
copy/schema or persistence changes. New wrapper uses70px top/bottom spacing.

Bounded root-owned aesthetic L0 follow-up, base f371a9a plus all preceding
uncommitted Blog changes, preserved. Writable: Pages dual-cta component and
contract, Blog listing, existing Blog presentation dependency stub, both slice
READMEs and this handoff. User reviews3071; no automatic tests/QA, database or
storage writes, migration, commit, push or deployment.

## Blog featured image link —2026-11-01

User requests clicking the featured post image opens its article. FeaturedPost's
image cell now uses Next Link to the same localized post route as Read Article,
with the post title as accessible name and an inset keyboard focus outline.
Both uploaded image and placeholder are linked; layout is unchanged. Updated
Blog README and JournalCard comment. Bounded low-impact link change; no new
tests/automatic QA, DB writes, commit, push or deployment. User reviews3071.

## Blog hero centering follow-up —2026-11-01

User reports different lateral padding/alignment, then clarifies Blog copy and
search should remain centered as before the photo. Blog uses40px horizontal
padding like other heroes,60px top/40px bottom; full-width max1600px wrapper,
centered headline/intro and search row. See blog-hero-background.md. Aesthetic
L0; no new tests/automatic QA or DB writes. User validates3071. Previous
functional checks precede this class-only adjustment.

## Blog hero photo —2026-11-01, after f371a9a

User requested a BO-editable background image like the other heroes, retaining
headline, intro and search strings by locale. Blog now uses the shared compact
Hero and standard image picker; photo/OG validation, private local preview and
descriptor capacity2 are wired. Old snapshots fall back to the existing Lisbon
stock photo used by Guides. Preceding uncommitted Blog label removal preserved.
See blog-hero-background.md for exact files, coverage and commands. Node22
typecheck/lint/build and19 focused Blog cases pass; seven old lint warnings.
No visual QA, actual BO save/upload, DB/storage write, migration, commit, push
or deployment. User reviews3071; no new required implementation work remains.

## Blog label removal —2026-11-01, after f371a9a

User requested removing Newsletter, Latest Articles, Featured and The Central
Hill Journal from the Blog listing and its BO page editor. Removed all four
eyebrow renders; the shared article newsletter also omits its eyebrow. Schema
uses adminHidden for hero/journal/newsletter eyebrow fields and the whole
featured copy group, preserving existing stored values without exposing controls
in contextual or legacy BO. Main titles, articles and subscription form remain.

Root owns changes in blog/ui/blog-listing.tsx, blog/ui/blog-post.tsx,
blog/ui/components/newsletter-signup.tsx, pages/schemas/blog.ts (under src/slices),
both slice READMEs and this handoff. Simple aesthetic L0 change in the main
workspace, clean base f371a9a. User validates localhost3071; no tests/automatic
QA, DB writes, migrations, push or deployment. Existing3071 listenerPID95629
belongs to this workspace. No commit requested in this follow-up.

## Latest checkpoint before clear —2026-11-01

User requested committing About changes before clearing context. Previous local
checkpoint:a4633ed; the new HEAD commit contains this checkpoint (read git log -1).
Workspace/main remains the delivery location. Latest change: About contact cards
now use audience-style PhotoFeatureGrid backgrounds/overlay, with optional
per-card image selectors in BO, preserved same-tab links/action labels and41
maximum media references. Seven About section eyebrows are hidden/preserved in
BO and removed publicly. Story uses50px top/70px bottom; the other six requested
sections use70px top/bottom. See about-contact-photo-cards.md and ADR0052.

Final Node22 typecheck/lint/build and14 focused About tests pass; lint has seven
existing unrelated warnings. No automatic visual QA or real BO image save/upload
against the remote DB. No DB/storage writes, migrations, push or deployment.
Pre-existing historical task environments/worktrees/cache backups are preserved.
No pending implementation work; next turn follows the next user request. The
deferred contact DB task remains deferred. Localhost3071 was last restarted as
Node22 pnpm dev, session52122/PID95629; verify current listener before acting.

## Working state and authorization

- Latest local commit request2026-11-01: user authorized committing the15-file
  aesthetic follow-up afterf70e75f: temporary service mosaic photos, hidden
  service/Guides labels and BO controls, service WhatsApp-button removal and
  section spacing. `git diff --check` passes; no new automatic tests/QA under
  the L0 agreement. Local delivery only, no push/deployment or database writes.

- Service mosaic follow-up after81200da: user requested restarting3071 and then
  committing this change locally. Restarted Node22 pnpm dev (session52122,
  listener PID95629) after stopping only this workspace's prior3071 process.
  Preserved old cache:/private/tmp/central-hill-dev-cache-service-mosaic-BgjB6Ptr/dev.
  No push/deployment. Details/checks:service-four-photo-mosaic.md.

-2026-11-01: user explicitly requested a local commit of all accumulated session
  work, including the preceding uncommitted Owners/Buildings/Real Estate changes
  and the Guests/Services follow-ups documented below. No push or deployment.
  Final aesthetic follow-ups have user-owned localhost review, with no new
  automatic tests/QA. Earlier functional checks apply only to their recorded
  candidates; no full final-tree QA approval is claimed. `git diff --check` passes.

- Workspace: `/Users/maxi/Documents/claude-workspace/central-hill`.
- Branch: `main`; session base `0d44203609ad250da945f960462d7bc55e13e779`.
- User explicitly requested a local commit of the session before `/clear`.
  No push, deployment, main merge or production release requested.
- Aesthetic work is L0: do not run automated tests or QA. User reviews localhost.
  Code changes and appropriate QA for other work are preauthorized; database
  changes and production actions require explicit user authorization. Sandbox
  restrictions still apply independently.
- Existing historical task worktrees/previews and their artifacts are preserved.

## Final implemented behavior

- About contact photo cards aftera4633ed: Let's Start a Conversation reuses
  PhotoFeatureGrid and the audience section's photo/overlay design, retaining
  per-card semantic links and action text. Each card has an optional BO image
  selector; media/preview validation includes its image, capacity41. Old content
  stays compatible; missing images use existing illustrative audience photos.
  No DB/storage writes or visual QA. See about-contact-photo-cards.md and ADR0052.

- About spacing aftera4633ed: Story keeps50px top and now70px bottom. Audiences,
  Values, Organisation, Certifications, Community and Contact each use70px top/
  bottom at all viewports, scoped to About. Aesthetic L0: user reviews3071;
  no tests/automatic QA, DB writes or commit.

- About section labels aftera4633ed: remove How We Started, Our Platform,
  What We Stand For (Values and Certifications), Our Structure, Our Responsibility
  and Get in Touch from section eyebrows. Hide/preserve the seven schema fields
  with adminHidden in contextual/legacy BO. Main section titles/content remain.
  Aesthetic L0: user reviews3071; no tests/automatic QA, DB writes or commit.

- Guides listing spacing afterf70e75f: city catalogue (e.g. Guides for Lisbon),
  Top Recommendations and closing Make It a Stay to Remember each use70px top/
  bottom at all viewports. Closing band overridden through a Guides-only wrapper.
  Aesthetic L0: user reviews3071; no tests/automatic QA, DB writes or commit.

- Guides additional labels afterf70e75f: remove “Local Favourites” from Top
  Recommendations and “Your Base in the City” from the closing CTA. Hide/preserve
  recommendations.eyebrow and final_cta.eyebrow in BO using adminHidden.
  Aesthetic L0: user reviews3071; no tests/automatic QA, DB writes or commit.

- Guides listing labels afterf70e75f: remove “More cities coming as Central
  Hill grows.” from the city filter and “Explore” from catalogue headings.
  Hide/preserve city_filter.note and catalogue.eyebrow via adminHidden in BO.
  Aesthetic L0: user reviews3071; no tests/automatic QA, DB writes or commit.

- Service enquiry button follow-up afterf70e75f: remove the Ask on WhatsApp
  booking-card action from every service detail. Hide/preserve its whatsappCta
  override in BO through SERVICE_HIDDEN_COPY_KEYS. Primary request actions
  remain. Aesthetic L0: user reviews3071; no tests/automatic QA or DB writes.

- Service detail spacing afterf70e75f: content/booking DetailLayout uses70px
  bottom padding, scoped important override of its shared responsive default.
  Enquiry (e.g. Request Babysitting) and Other Guest Services each use70px top/
  bottom at every viewport. Aesthetic L0: user reviews3071; no automatic tests/
  QA, database writes or commit.

- Service detail label removal afterf70e75f: hide About this service/experience,
  What's included, Options, Rates, Our Partners, Good to know, Add This to Your
  Stay and More Ways We Can Help. Remove their eyebrow props and BO copy fields
  (including section-specific controls), preserving stored overrides/schema
  compatibility and section titles/content. Itinerary labels remain available.
  Aesthetic L0: user reviews3071; no tests/automatic QA, DB writes or commit.

- Service detail category follow-up afterf70e75f: hide the category eyebrow
  above each service title, e.g. Arrival & Transfers. It is the same shared
  Services category used by the listing-card pill, chosen in the service BO
  category selector. Preserve category management and card labels. Aesthetic L0:
  user reviews3071; no tests/automatic QA, DB writes or commit.

- Service mosaic temporary photos follow-up afterf70e75f: user now requests
  Pexels images to complete missing positions, overriding available-only layout.
  Renderer fills up to4 with sample photos (same source assets as existing site
  placeholders); actual uploaded images take precedence. No DB/storage writes.
  BO guidance updated EN/PT/ES/FR. Aesthetic L0: no automatic tests/QA or commit.

- Service detail mosaic follow-up after81200da,2026-11-01: all service details
  now cap the header mosaic at4 photos (cover large left, first gallery photo
  wide top right, next two below). Extras remain in Show all photos. User chose
  available-only layouts until missing photos are uploaded, without repeating/
  stock photos. BO explicitly labels the four roles and existing gallery upload/
  reorder controls. Node22 typecheck/lint/build and36 focused tests pass; read-only
  browser check covers all10 published services and Sintra at390px. No schema/
  DB/storage changes or visual QA. See service-four-photo-mosaic.md.

- Services closing CTA follow-up2026-11-01: remove “Planning your stay?” from
  public output and hide/preserve final_cta.eyebrow in contextual/legacy BO.
  “Find your apartment, then we'll handle the rest” now has70px top/bottom
  padding at every viewport via its scoped wrapper. Aesthetic L0: user reviews
  localhost3071; no tests/automatic QA, database writes or commit.

- Services catalogue spacing follow-up2026-11-01: “Everything you need,
  beautifully arranged” section now uses70px top/bottom padding at every
  viewport. Scoped to the Services listing catalogue shell. Aesthetic L0:
  user reviews3071; no tests/automatic QA, database writes or commit.

- Services section removal follow-up2026-11-01: remove catalogue intro eyebrow
  “Guest Services & Experiences” and the full “How It Works / Arranged for you,
  end to end” section. Hidden/preserved schema fields: intro.eyebrow and the
  complete how_it_works object. Remove its BO layout card and public renderer/
  contract export. Main intro title/catalogue remain. Aesthetic L0: no tests/
  automatic QA, database writes or commit; user reviews3071.

- Services hero booking follow-up2026-11-01: add the navbar's localized Book Now
  label with Guests' ButtonLink styling and action spacing. Opens the exact
  English Avantio rentals URL in a new tab. User corrected the initial Guides
  destination before any Guides edits; Guides is unchanged. Aesthetic L0: user
  reviews3071; no tests/automatic QA, database writes or commit.

- Guests closing panels follow-up2026-11-01: remove “Guests” and “Owners”
  eyebrows above “Planning a Stay?”/“Own a Property?”. The shared local dualPanel
  schema hides both legacy eyebrow fields via adminHidden, preserving values
  without BO controls. Titles/body/buttons remain. Aesthetic L0: user reviews3071;
  no tests/automatic QA, database writes or commit.

- Guests card overlay follow-up2026-11-01: use PhotoFeatureGrid's optional overlay
  override to lighten the warm-dark scrim from15%/55%/82% to8%/35%/65% at0%/60%/100% height. Applies to
  Services and Guides carousel photos, retaining stronger shade behind lower
  text. About retains the original shared default. ADR0051. Aesthetic L0:
  user reviews3071; no tests/automatic QA or commit.

- Guests Guides carousel follow-up2026-11-01: “The Best of Portugal” now uses
  published guides/cities and localized title/intro/hero/slug values, with Settings
  template icons. Shares Services' six-card-group carousel and same-tab detail
  links; Discover More opens the full Guides listing. Old manual cards hidden/
  preserved; Guests BO links to Guides and keeps section heading/intro/CTA fields.
  Node22 typecheck/lint/build and11 focused tests pass. Read-only functional
  browser checks at1440px/390px pass6/2 paging, both controls and same-tab detail
  navigation. No DB/storage writes or visual QA. See guests-guide-catalogue spec.

- Guests Services catalogue follow-up2026-11-01: “Make the Most of Your Stay”
  now consumes published Services through the public contract, with live names,
  excerpts, category icons, covers, localized slugs and order. Groups of up to6
  cards use the shared Portfolio Carousel controls; links open service details
  in the same tab. Explore All Services opens the full listing, with its note
  below. Hide/preserve old manual card inputs; BO links to Services for edits.
  Node22 typecheck/lint/build and7 focused tests pass. Read-only desktop browser
  check passes6/4 grouping, both controls, same-tab detail navigation and helper
  placement. No DB/storage writes or automatic visual QA. See guests-service-catalogue spec.

- Guests hero booking follow-up2026-11-01: replace “Browse Our Apartments →”
  with the navbar's localized Book Now label (no arrow) and the exact English
  Avantio rentals URL in a new tab through ButtonLink. Hide/preserve the obsolete
  hero.cta editor object; its stored label/URL no longer control this button.
  Other Guests CTAs retain their destinations. Aesthetic L0: no tests/automatic
  QA, database writes or commit.

- Hero alignment correction2026-11-01, superseding the w-full follow-up below:
  user screenshots showed that w-full pushed Real Estate/Guests to the viewport
  edge. Removed it from both, restoring Real Estate's original Buildings-style
  centered shrink-fit wrapper. Guests' h1 now reserves the same26ch title width
  (bounded by available width); its inner text span alone is limited to20ch with
  balanced wrapping. This preserves the common inset while keeping Guests' two
  lines. Buildings untouched. Aesthetic L0: user reviews3071; no automatic QA,
  tests, database writes or commit.

- Guests/Real Estate hero alignment follow-up2026-11-01: both hero wrappers now
  explicitly use w-full within their shared1600px maximum and40px horizontal
  padding. This prevents flex shrink-to-content from moving their left edges
  according to title length. Guests retains its20ch balanced title; Real Estate
  retains26ch. Aesthetic L0: user reviews3071; no tests/automatic QA or commit.

- Guests hero headline follow-up2026-11-01: narrow its title from26ch to20ch
  and balance wrapping so the shorter “Where Every Stay Becomes a Story” forms
  two lines on desktop, with natural responsive wrapping and editable copy.
  Existing font size and hero layout retained. Aesthetic L0: user reviews3071;
  no tests/automatic QA, database writes or commit.

- Guests spacing follow-up2026-11-01: all eight content modules (Welcome, Why,
  Portfolio, Services, Activities, Reviews, FAQ and closing dual CTA) now use70px
  top/bottom section padding at every viewport. Shared sections are overridden
  through Guests-only wrappers. Hero/footer retain their existing spacing.
  Aesthetic L0: no tests/automatic QA, database writes or commit.

- Guests section eyebrows follow-up2026-11-01: remove “Best Price, Guaranteed”,
  “The Portfolio”, “Services”, “What to Do” and “Reviews” from public modules.
  Hide their five schema fields via adminHidden in contextual/legacy BO; preserve
  legacy values. Portfolio/testimonials pass showEyebrow=false without an explicit
  eyebrow to suppress shared fallbacks. Other pages and main titles unchanged.
  Aesthetic L0: no tests/automatic QA, database writes or commit.

- Guests submenu labels follow-up2026-11-01: header/drawer now show “Guest
  Services & Experiences” and “Top Things to Do & Recommendations” under Guests.
  Scoped child-label override covers default and DB-configured navigation using
  `settings.subnav.guests` EN/PT/ES/FR keys. Destinations remain/services and/guides.
  Aesthetic copy L0: no tests/automatic QA or DB writes. Commit left for later.

- Real Estate process gallery follow-up2026-11-01: reuses Owners' StepGallery
  with centered heading, numbered photo cards and original enquiry CTA below.
  Each step now has optional BO image/translated alt fields alongside editable
  title/description. Existing3–8 step identities and selected-locale workflows
  retained; local-media capacity21. Node22 typecheck/lint/build and7 focused
  adapter tests pass. No DB/storage writes or visual QA; user reviews3071.
  See `real-estate-process-gallery.md`.

- Real Estate Market Fundamentals follow-up2026-11-01: small two-image row above
  its heading, matching the full width of the three-stat strip. Both Pexels
  fallbacks can be replaced in BO, with independent alt text. Media capacity13;
  optional StatBento slot documented in ADR0049. Typecheck/lint/build and5 focused
  tests pass; no DB writes, real uploads/saves or aesthetic QA. See
  `real-estate-market-images.md`.

- Real Estate asset-type redesign2026-11-01: six image-backed cards with individual
  image/icon/title/description/alt editing in BO;3/2/1 responsive columns and70px
  vertical padding. New fields are optional, legacy side media hidden/preserved.
  See `real-estate-asset-cards.md` for code scope, checks and limits. Typecheck /
  lint / build and18 scoped tests pass; broader legacy assertions are documented.
  No database writes/uploads or automated aesthetic QA.

- Real Estate capabilities spacing follow-up2026-11-01: Institutional-Grade
  Management uses70px top/bottom padding through its scoped wrapper, preserving
  the single-column benefits. Aesthetic L0; no automatic tests/QA.

- Real Estate capabilities follow-up2026-11-01: Digital Excellence, Operational
  Mastery and Strategic Partnership now stack in a single column inside the text
  side of Institutional-Grade Management. The outer image/text layout remains
  two columns on desktop; override is scoped to #capabilities. Aesthetic L0;
  no automatic tests/QA.

- Real Estate spacing follow-up2026-11-01: Partners, Deal Structures, Portugal
  Market, Track Record, Process, FAQ and Partnership enquiry now use70px top/
  bottom padding at every viewport size, scoped to this page. Aesthetic L0;
  no automated tests/QA.

- Later building-detail apartments CTA follow-up: add the navbar's localized
  Book Now label to the right of the apartments heading (stacked on smaller
  screens), using its same English Avantio rentals destination and opening a
  new tab via ButtonLink. Aesthetic L0; no automatic tests/QA.

- Later building-detail apartments spacing follow-up: the apartments grid section
  now uses70px top/bottom padding on all building details and viewport sizes.
  Aesthetic L0; no automatic tests/QA.

- Later building-detail apartments follow-up: remove the fixed “Bookable Units”
  eyebrow above the apartments grid on all buildings/locales and its now-unused
  heading gap. This text never had an editable BO field; no admin control remains
  to hide. Aesthetic L0; no automatic tests/QA or database writes.

- Later building-detail follow-up: remove the complete “The Building” prose
  section (headline/intro/neighbourhood) from all detail pages and the BO card.
  Retain legacy values in editor state/payloads; allow hidden headline and intro
  to be empty so new-building creation has no invisible required fields.
  No database writes/migration. Aesthetic L0; no automatic tests/QA.

- Later submenu-clearance follow-up: Buildings listing, Real Estate, Guests,
  Services listing, Guides listing and About hero content wrappers now use60px
  top padding instead of40px (+20px). Horizontal/bottom remain40px. Scoped to
  those six renderers, with no shared Hero changes. Aesthetic L0; no automatic QA.

- Later Owners closing CTA follow-up: remove “Start Earning More Today” from
  public output and hide `final_cta.eyebrow` in contextual/legacy BO through
  existing adminHidden metadata. Legacy values remain preserved. Aesthetic L0;
  no automatic tests/QA or database writes.

- Later Buildings calculator media follow-up: in the desktop two-column layout,
  the form determines row height and the adjacent media fills that height, matching
  step1. Mobile stacked media keeps its4:5 frame. Aesthetic L0; no automatic QA.

- Later Buildings motion follow-up: remove only the catalogue's Reveal wrapper
  so building cards are visible from initial render. Other sections retain their
  existing entrance animations. Aesthetic L0; no automatic tests/QA.

- Later Buildings stats follow-up: “Numbers That Speak for Themselves” uses70px
  top/bottom padding through its reveal wrapper. Aesthetic L0; no automatic QA.

- Later Buildings owner-panel follow-up: replace its
  `pb-[clamp(64px,10vw,160px)]` with70px bottom padding. Aesthetic L0; no automatic QA.

- Later Buildings listing follow-up: the catalogue and earnings calculator,
  which inherited `py-[clamp(64px,10vw,160px)]`, now use60px top/bottom padding
  at every viewport. The override is local to these two sections. Aesthetic L0;
  no automatic tests/QA.

- Later Owners numbers follow-up: “Numbers That Speak for Themselves” now has
  70px top/bottom padding through its Owners wrapper. This supersedes the earlier
  note leaving that band's spacing unchanged. Aesthetic L0; no automatic QA.

- Later Home follow-up: “A Trusted and Leading Company” (stats band) uses70px
  bottom padding through its Home wrapper; top padding retains its existing
  value. No shared StatBand change. Aesthetic L0; no tests or automated QA.

- Later Owners spacing follow-up: Why, Everything handled, Plans, Growth path,
  Dashboard, Testimonials, FAQ and closing CTA each use70px top/bottom padding
  at every viewport size. Overrides are scoped to the eight Owners wrappers,
  following Home's existing descendant-section utility pattern. Shared component
  defaults, hero and numbers band are unchanged. Aesthetic L0; no automated QA.

- Later visual follow-up: shared TestimonialsMarquee quote text reduced10%,
  from1.25rem (20px) to1.125rem (18px), for every consuming page and locale.
  Quote content, stars and author text remain intact. Aesthetic L0; user reviews
  localhost, no automated tests or QA for this adjustment.

- Feature backgrounds use `linear-gradient(90deg, #4c3d32 0%, #926c52 100%)`
  through shared `bg-feature`. Solid fallback is `#4c3d32`.
- Navbar always uses that opaque gradient. Full-width submenus use it too, with
  white text and white hover/focus underlines. Light language popovers and the
  mobile drawer retain their own palettes.
- Booking opens `https://www.centralhill.pt/en/rentals/holidays-rentals-rentals-d0/`
  in a new tab on desktop and mobile.
- Desktop Earn With Us sits below the user/contact/language controls. Final base
  dimensions: **140 × 100px**, top padding **30px**, bottom radii **70px**.
  It links to Owners in the current locale. The tab and navbar share gradient
  width/coordinates, measured by HeaderScroll; earlier separate-color attempts
  are superseded.
- When a header submenu opens, the tab stretches by that submenu's measured
  height and gains the same additional top padding. Its top remains attached to
  the navbar. It retracts on close. This also covers Owners' pinned submenu.
  Reduced-motion preferences disable the transition.
- Home hero headline font size reduced 20%:
  `clamp(2.2rem,5.6vw,4.4rem)` instead of `clamp(2.75rem,7vw,5.5rem)`.
- Home spacing: guests showcase 70px top/bottom (important utility needed to
  override existing compact inline padding); portfolio 70px top; services
  carousel 70px top/bottom; closing dual CTA 70px top and **0px bottom**.
- Entire Home closing Owners/Guests grid, including photos, now sits in a
  centered 1240px shell with 28px side padding, matching Services. Earlier
  viewport-sized padding applied only to panel text was removed.
- The small “Partners & Services” eyebrow is removed from public output and BO.
  Its legacy JSON field remains hidden/preserved for compatibility. The main
  “Central Hill Partners and Services” heading stays editable and visible.
- Footer now shows office address, bookings phone, check-in phone and email with
  phone/mail icons and EN/PT/ES/FR labels, using existing Settings fields.
  `checkin_phone` already exists in schema/BO; blank hides the check-in row.
  The no-settings fallback address is Rua da Bempostinha 21A, 1150-065 Lisboa.
  Configured values always take precedence. Existing WhatsApp/social links remain.
- Owners `#numbers` now passes a title into the same StatBand used by Home.
  New optional translatable JSON field `stats_title` (max 160) is grouped with
  Numbers in both contextual and legacy BO layouts. Missing/blank defaults to
  localized “Numbers That Speak for Themselves”. No figures hides the title too.
  The field participates in existing per-locale draft/save/publish/translation
  machinery. No database schema migration is needed.

## Deferred database task — do not resume automatically

User asked to save image-supplied contact details through Neon MCP, then said
“dejemos eso para luego”. **No SQL or database writes occurred.** Values:

- Office: Rua da Bempostinha 21A, 1150-065 Lisboa.
- Bookings: +351 910 075 725.
- Check-in: +351 912 310 632.
- Email: info@centralhill.pt.

Neon MCP tools were not exposed when attempted. A temporary protocol helper at
`/private/tmp/central-hill-footer-mcp.py` returned HTTP 401 using local CLI auth.
Neon CLI session refresh/listing reached an organization-selection prompt; no
project/branch was selected or changed and no database query was run. The user
deferred the task. Re-discover current tools/auth only if the user resumes it.
Never print credentials. `.env.local` points to a remote Neon database, not an
isolated QA database; do not treat localhost as a safe synthetic DB.

## Preview and cache behavior

- Preview URL: `http://localhost:3071/en`; Owners `/en/owners`, BO `/admin`.
- Last read-only listener check before this commit: node PID **85909** on 3071.
  Process IDs/session handles may change; inspect before stopping anything.
- Uses Node 22 and `pnpm dev --port 3071` in this workspace.
- Next development cache repeatedly served earlier CSS despite source changes.
  Restarting alone sometimes retained it. On user-requested restarts, stop only
  this preview, move `.next/dev` to a unique `/private/tmp/central-hill-dev-cache-*`
  backup (preserve it), then restart. Previous backups are retained.
- Latest server start tool session was **4833**, but environment/session may
  have changed since. Do not assume it still identifies the current process.
- Last local restart preceded several later changes (services eyebrow, footer,
  Owners title and closing grid width). If the user sees stale output, a fresh
  cache/restart may be necessary. Do not claim latest changes were browser-tested.

## Verification and limits

- No tests or automatic QA were run after the user's L0 clarification.
- Before that clarification, on the early feature-gradient candidate only:
  typecheck and lint exited 0 (seven existing warnings), Next `compile` mode
  exited 0 (not a complete prerendered build), isolated CSS fixture checked
  gradient/hover at 1440px and 390px. Those checks do not cover the final commit.
- Later read-only debugging confirmed stale served CSS and that regenerating
  the development cache exposed new submenu rules. This is not a full browser
  or persistence QA claim. User reviewed visual changes incrementally.
- No migration, database write, push or deployment in this session.
- Console hydration warning for body attribute `cz-shortcut-listen="true"` was
  absent from source and attributed to browser-extension injection; no code was
  added to suppress it. Private-window/extensions-disabled check was suggested.

## Files and design decisions

Main code: `src/app/globals.css`; core `dual-cta-panels.tsx`, `footer.tsx`;
settings `defaults.ts`, `ui/site-header.tsx`, `ui/site-footer.tsx`,
`ui/components/header-scroll.tsx`; pages Home/Owners renderers, Home/Owners
schemas, services carousel, contextual grouping and legacy layout;
`messages/{en,es,pt,fr}.json`.

ADRs 0041–0044 record the feature gradient, navbar/tab, closing section width and
footer contact changes. Owners heading note:
`docs/specs/owners-numbers-heading.md`. AGENTS, data model, design system and
slice READMEs were updated. Temporary cache backups, screenshots and MCP helper
remain outside Git; `.env.local` and credentials are not included.

To resume: read this handoff and AGENTS, inspect `git status` and latest commit,
then follow the next user instruction. No outstanding mandatory implementation
work is being claimed; contact persistence remains explicitly deferred.
