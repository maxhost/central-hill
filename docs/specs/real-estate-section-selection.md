# Real Estate: one Element entry per section — 2026-11-05

User requests the same consolidation as Home/Owners/Buildings and explicitly
requests functional live-preview verification. Base509d785/main, current checkout;
preserve all prior pending work, logo and running3071. Root-only write set:
Pages `admin/home-contextual.ts`, Pages README, this report and visual handoff.

Reuse selectAsGroup for real_estate. Each section opens all its fields: Hero,
partners, capabilities, asset management, deal structures, market, track record,
process, deal enquiry and FAQ (existing FAQ copy/group merge retained). Nested
benefits/cards/market subgroups/list points and button labels remain in their
section; existing hidden destinations/media stay hidden. SEO remains on its
separate toolbar. No schema/content/locale/URL/persistence/public/transport change.

Acceptance: one Element option per section, child canvas selections open the
complete block; unsaved changes render EN/ES/PT/FR and Refresh resends state.
Narrow source review and explicitly requested functional browser verification
with actual editor/action/RealEstatePage and synthetic dependencies. No full
aesthetic QA/check suites, authenticated3071 session, DB writes, save/publish,
upload, commit/push/deploy or restart.

## Verification and limits

Scoped Next16.2.9 webpack fixture on3195 uses actual PageContextualEditor,
shell/bridges/live wrapper, renderPageLivePreview, adapter and complete
RealEstatePage. Authentication, media resolution, FAQ/settings queries and
persistence are synthetic/disabled; no DB or actual staff session involved.
Initial content uses pure adapter-equivalent defaults, a valid unresolved Hero
UUID to exercise the fallback, a populated synthetic FAQ group and absent optional
FAQ/deal-enquiry copy to exercise first edits.

Final Playwright sequence passes44cases: ten block headings per EN/ES/PT/FR and
Refresh per locale. Nine blocks additionally edit a nested/card/button/value
field, including the actual animated Track Record number987%, market stat,
benefits, model/step titles and enquiry submit text. Exactly ten Element options,
no optgroup/child options; mobile FR Hero and child button canvas selection open
the complete Hero inspector.81render action POSTs plus8Next dev stack-frame
diagnostic POSTs; zero uncaught browser errors, stable iframe on Refresh.

Initial browser run stopped at Track Record because the text selector matched
both CountUp's screen-reader copy and visible aria-hidden copy (both correctly
contained987%, state idle). Scoped selector correction targets the visible copy;
the full confirmation passes. Fixture blank market-stat labels trigger existing
duplicate-key console warnings in StatBento (keys use label); diagnostic requests
are retained separately from product actions. No product rendering/transport
change or suppression was introduced for that synthetic-default warning.

Artifacts retained in `/private/tmp/central-hill-real-estate-groups-fixture/`:
fixture source/config, `browser-result.json`/`browser.log` (initial partial),
`browser-final-result.json`/`browser-final.log` (passing confirmation),
`check-initial.mjs`, `check.mjs`. `git diff --check` passes. No full check suite,
automatic aesthetic QA, save/reload/publication/upload/DB write or independent QA
claim. Stop only owned3195fixture; existing3071 remains active with user state intact.
