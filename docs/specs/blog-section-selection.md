# Blog: one Element entry per section — 2026-11-05

User requests Blog consolidation and live-preview verification as on the other
Pages. Base509d785/main/current checkout; preserve all previous pending work,
unused logo, remote Neon env and running3071. Simple root-only change.

Write set: Pages admin/home-contextual.ts, README, this report and visual handoff.
Reuse selectAsGroup: Hero/search, Journal, Newsletter and shared article CTA each
open all their fields. SEO stays in toolbar; retired Featured/eyebrows stay hidden.
post_aside keeps its dedicated shared_aside preview. Posts/categories stay in
Blog CMS; shared Home band stays in Home. No schema/public/transport/persistence
or Settings/Form changes.

Acceptance:4Element options without child duplicates; unsaved EN/ES/PT/FR Hero
title/intro/search accessibility label/placeholder, Journal title, Newsletter
title/description and shared CTA copy render on the correct preview surface.
Refresh and locale reopening preserve values; canvas child selects whole Hero;
mobile edit works. Bounded actual-editor/action/full-Blog-renderer browser fixture
with DB-free auth/catalogue/Settings/media/Home band/form stubs. No aesthetic/full
product QA suite, real login/save/publish/upload/DB/form send, commit/push/deploy or
original localhost restart. Record results/limits below.

## Verification and limits

Product change is only Blog's selectAsGroup opt-in. No renderer, preview transport,
schema or persistence correction was needed. Existing shared_aside routing remains.

Built Next16.2.9 webpack fixture3186 uses actual PageContextualEditor/shell/bridges,
renderPageLivePreview/Blog adapter, BlogListingRenderer, NewsletterSignup and
BlogSharedAside with project components/styles. Auth/catalogue/Settings/media are
DB-free stubs; the shared Home band and embedded Brevo form are stubbed. One
synthetic Journal post ensures the conditional listing has content. Initial
defaultBlog keeps Hero/Journal/Newsletter absent to exercise first optional edits.
Fixture full build/TypeScript/static generation exit0.

Chromium passes16section/locale cases across EN/ES/PT/FR: Hero headline/intro,
search placeholder and accessible input name, Journal title, Newsletter title/
description and all4shared CTA fields. CTA keeps exact localized /owners href.
Eight Refresh checks cover both page and shared_aside surfaces with stable iframe
URLs; reopening all4locale tabs retains Hero/aside edits. FR390px mobile edit and
clicking actual hero.headline from Newsletter select the complete Hero inspector,
including intro/search. Exactly4Element options with no child duplicates/optgroups;
hidden Featured absent. Zero browser errors;61POSTs only to synthetic preview.

Evidence `/private/tmp/central-hill-blog-groups-fixture/`: fixture source/config,
`check.mjs`, `browser-result.json`, `browser.log`, `build-fixture.log`.
`git diff --check`:0. No automatic aesthetic/full product QA, real DB persistence/
save/reload/upload, newsletter submit or independent QA claim. Only owned3186
fixture stopped; existing3071PID7039 and all prior pending work/logo preserved.
