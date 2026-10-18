# Independent QA — Guides page editor

Archived report: evidence and script filenames below refer to
`/private/tmp/central-hill-guides-qa`, not this documentation directory.

Date: 2026-10-18. Candidate: `fc1daac45b77859aa5f778051fa86ceb7d586a57`.
Result: **APPROVED for local integration. No unresolved blocking product findings.**

Reviewer: independent QA agent `/root/guides_public_audit`; no application-source edits.
Integration worktree `/private/tmp/central-hill-guides-integration`, branch `guides-page/integration`.
Root owns production-mode Next server3060 and required code checks. Root reported typecheck, lint,228 actual tests and production build82pages exit0; corresponding root-*.log preserved here. Browser QA against this code used the isolated environment below.

## Isolation

Dedicated DB `guidespageqa`, role `guidespageqa`; PostgreSQL container central-hill-service-detail-db host5558, HTTP proxy4458 with explicit DB connection string. Verified current_database/current_user. Migrations0000..0020 applied and21 migration records. Fake env `env.sh`, no remote .env copied.

Dedicated S3rver9060, bucket `guidespageqa`, local objects directory; app origin127.0.0.1:3060. Shared DB container/proxy reused without mutating sibling servicedetailqa data or preview3059. Fake staff `guidespageqa@example.test`, password `test1234`, textual BetterAuth actor ID. Actual login form succeeded.

Synthetic data: Lisbon and Porto published with different EN/ES/PT/FR city and guide slugs; each has one published guide and one valid Restaurant/Viewpoint/Beach candidate. Cascais published without guides; Coimbra draft. Five actual synthetic JPEGs; actual MP4 upload fixture. Source+approved target guide/place/media translations. Initial Guides row contained only migration0016 legacy guide_aside.

## Verified behavior

23 distinct recorded checks ultimately passed (`qa-results.jsonl`); raw earlier harness failures remain visible for audit.

- Seven editor cards, existing sidebar grouping/navigation and responsive layout preserved.
- Real form login; existing source aside preserved on no-op save/reload; absent checkbox defaults enabled without filling editorial fields with English defaults.
- False checkbox persists on save/reload, hides city bar and renders both city groups plus global recommendation winners. Restoring true enables joint city filtering.
- Two cities switch both guides and three city-specific recommendations. Porto has valid alternatives even though Lisbon wins globally. Upcoming Cascais ignores synthetic click and keyboard Enter, remains unselected; published real cities do not duplicate legacy placeholders.
- Keyboard operation, labeled fields, no desktop1440px/mobile390px horizontal overflow; screenshots inspected. Maximum-length ordinary title200, note240 and CTA80 copy remains within390px.
- Full source copy/SEO save appears across four locales, including shared aside on guide detail. Invalid source templates reject before write. Invalid approved target template/oversized text fall back per field; draft hero target is ignored while approved target appears.
- Canonical/hreflang (five alternate links) correct per locale; localized detail URLs remain accessible. Source save immediately refreshes index and existing detail aside without server restart or manual cache clear.
- Real JPEG uploads for poster, OG and aside: save/reload, DB refs/MIME and local S3 object200 confirmed. Real MP4 upload: save/reload, MIME, object200 and public muted inline video source verified. Reduced motion attaches no video source and requests no MP4/WebM; still poster retained.
- Aborted S3 PUT reports error and preserves persisted source without success. Forged PDF/image/video references, missing UUID and malformed OG UUID are rejected with field errors and no source mutation.
- Corrupted stored source blocks editor Save and stale valid action payload; exact corrupt data retained until QA restores it. Missing row produces valid editable defaults. Anonymous action denied without writes.
- Actual Geography form save invalidates city-dependent Guides caches. Temporary Porto draft becomes one disabled upcoming placeholder, restores after publication; empty published-guide set shows configured empty message and no recommendations/active city. All temporary status mutations restored.
- Client CTA navigation and history return work with explicit asynchronous URL waiting.

## Commands and harness corrections

Node22.23.3, Playwright Chromium. Scripts:

1. `node qa-baseline.cjs`: initial exit1 solely because Playwright correctly refuses normal click on aria-disabled upcoming chip. Other baseline cases passed. Affected AC04 rerun with `QA_ONLY=AC04-filter-two-cities-scoped-recommendations` exit0 after synthetic DOM click + Enter guard check.
2. `node qa-actions.cjs`: initial exit1 due broad role=alert selector also matching Next route announcer. No product defect. Affected two cases rerun with `QA_ONLY=AC02-source-corruption-blocks-editor-and-action-preserves-aside,AC02-absent-row-admin-valid-default-save` exit0 after selecting application p[role=alert]. Other actions cases passed.
3. `node qa-media.cjs`: exit0, all four media cases passed.
4. `node qa-final.cjs`: initial exit1 on immediate p.url assertion before Next client navigation completed. Other cases passed. Affected `QA_ONLY=AC09-client-navigation-restores-filter-initial-state` rerun exit0 with waitForURL.
5. `node restore.cjs`: exit0; canonical restoration and public revalidation verified.

No application changes were made in response to those harness issues. Root checks were not rerun because executable code did not change during QA.

## Final restoration and residual fixtures

Canonical Guides source restored through actual savePage action:

- Legacy original guide_aside unchanged.
- city_filter.enabled=true.
- Editorial copy/media/SEO overrides absent; OG=null.
- Page-content QA translation overrides deleted before final save/revalidation.

Final DB/public assertions confirm Spanish original hero text, two city panels, original aside text on detail, Porto published and both guides published. `restored-page.json` records result. No temporary constraints/triggers created. Coimbra remains draft; Cascais remains published without guides. Uploaded media assets and isolated synthetic catalog remain intentionally for user preview/evidence. No production data or credentials used; no push, deployment or remote migration.

Evidence: `qa-results.jsonl`, `manifest.json`, `restored-page.json`, `baseline-1440-editor.png`, `baseline-390-editor.png`, `baseline-1440-public.png`, `baseline-390-public.png`, `long-copy-mobile.png`, `upload-failure.png`, scripts and root-*.log in this directory.

Scope limits: individual guide CMS and manual recommendation selection are not implemented by this task. QA used synthetic photos/video and local storage; external production infrastructure was not tested. No defect was found requiring application correction.
