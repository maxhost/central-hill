# ADR0087 — Editable legal pages linked from Footer

Date:2026-11-21. Status:implemented; browser validation tracked in legal-pages-qa.md.

## Decision

Add three fixed Pages (privacy_policy,cookies_policy,complaints_book), with normal
EN/ES/PT/FR public routes, existing navbar/footer chrome, and links exclusively in
translated Footer Others. Reuse existing Pages authenticated contextual editor,
live preview, draft/publication and revision guards. Reuse Blog Rich portable JSON,
codec/editor/renderer through explicit client/pure/server contracts; text-only
capability removes media/article-specific blocks only for these documents.

A scoped localeIndependentContent descriptor policy makes each legal document an
atomic localized value. Different languages may use different paragraphs/lists/links
and SEO. EN edits never replace an authored target. Public reads select a complete
valid own-locale publication, otherwise complete published EN, never working drafts.
Routes without any available publication return404 and have no Footer link. Public
reads never initialize data. No legal prose is authored or published by implementation.

Reuse page_locale_content as-is (text page_key); extend typed keys and adapters without
SQL migration. Publish refreshes own locale+Footer; EN refreshes fallback locales too.
Sitemap/metadata enumerate available published routes. Existing marketing-page locale
policies and Blog full Rich features remain unchanged.

## Rationale

A dedicated CMS/table/editor would duplicate existing publication, auth and preview
behavior. Marketing pages' shared EN structural template would incorrectly couple
localized document paragraph/list counts, so legal documents need an explicit scoped
policy while retaining the existing editorial envelope and concurrency checks.

## Validation and recovery

See [plan](../specs/legal-pages-plan.md), [execution](../specs/legal-pages-execution.md)
and [independent QA](../specs/legal-pages-qa.md). Paired return point at29ef542 via
restore/legal-pages-2026-11-21; private dump verified in two isolated restorations.
Recovery must preserve later code/data and restore into a new checkout/database.
