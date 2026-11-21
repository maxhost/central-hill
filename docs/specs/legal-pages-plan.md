# Footer legal pages — approved implementation plan

2026-11-21. User approved implementation with two implementers, independent QA,
root orchestration, paired restore point first, and one E2E video per page.

## Scope

Three fixed Pages: privacy_policy (/privacy-policy), cookies_policy
(/cookies-policy), complaints_book (/complaints-book). Public locale prefixes
EN/ES/PT/FR, existing navbar/footer layout, plain reading surface with title,
Rich body and SEO. Links ONLY in new translated Footer Others group, never navbar.
Others/Otros/Outros/Autres and localized page names. Preserve both existing footer
groups, logo/contact/newsletter/solid backgrounds; responsive fourth desktop column.

Reuse Pages authenticated preview, Save Draft/Publish, revisions/conflicts and locale
tabs. Reuse Blog Rich structured body/editor/renderer through explicit contracts;
text-only capability for these documents. Preserve Blog's full editor capabilities.

Each locale's Rich body and its structure are independent. EN mutation/publication
must preserve every ES document field, draft and revision. Public uses complete valid
published own-locale document or complete published EN fallback, never draft. Thus PT
without translation shows EN at the PT URL. No fabricated/published legal text. A missing
published source renders 404; footer only links to available published documents.

No expected SQL migration: page_locale_content.page_key is text. Extend typed
registries/adapters/schemas and initialize rows only through authenticated editorial
mutations; public GET must remain read-only. Publishing refreshes pages and footer
availability in all locales. Include metadata/alternates/sitemap coherently.

## Ownership

A: backend editorial types/schemas/registries/adapters/policies/readers/publication,
metadata/sitemap, focused domain checks. B: reusable Rich contracts/UI, contextual
editor/live preview, renderer/routes, BO page navigation, Footer/i18n. QA: independent
harness, isolated test admin/database, browser verification and videos. Root: checkpoint,
coordination, integration/review, runtime/build/checks, conservation and handoff.

## Restore point

Branch restore/legal-pages-2026-11-21 at29ef54278e176ed6d655def475901ce1e71527a9.
Private /private/tmp/central-hill-legal-pages/checkpoint holds source.tar,
repository.bundle (git bundle verify passed), local-state.tar (original env, logos,
both original media symlinks and their current target contents), database.dump and
schema/constraint/count/row-hash manifests.49tables/1524rows including auth+ledger.
Restores legalpagesrestore20261121 and legalpagesqa20261121 independently verified.
Only comparison normalization: pg_dump removes physical ordinal gaps from a previously
dropped page_content column; visible column order/types/defaults/nullability,
constraints/counts/all row hashes match. No data correction.

The preexisting media target directories currently contain no media files. This
checkpoint preserves their actual current state and does not claim the former183
assets are present. No unrelated media recovery belongs to this task.

## QA acceptance

One reproducible video per page (Privacy/Cookies/Complaints), showing:
1. Create Rich EN content through BO, preview live, Save Draft and Publish; navigate
   from public Footer and verify published EN content.
2. Create/publish ES translation and verify ES public page via Footer.
3. Modify EN including paragraph structure and Publish; ES stays exactly intact.
4. PT without published translation renders latest EN at PT URL, Footer stays localized.

Additional bounded checks: unpublished/draft visibility, safe Rich links/markup,
private preview authentication, no navbar links, FR fallback, target draft does not
replace public EN fallback, mobile footer layout, existing Blog Rich compatibility,
revision conflict protections. Baseline all unrelated QA business tables/old Pages
and migration ledger exact; own QA auth/fixtures declared. No fixtures on authored main,
remote DB/R2 writes, email setup, deployment or push.
