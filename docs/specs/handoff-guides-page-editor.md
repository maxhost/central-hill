# Guides page editor — local handoff

2026-10-18. State: implementation and independent QA approved; local delivery complete.

Stable baseline: `00c836a`, annotated local tag
`savepoint/pre-guides-page-editor-2026-10-18`. Candidate `fc1daac` on
`guides-page/integration`; executable source must be retested if changed.

`/admin/pages/guides` now edits SEO/OG, hero photo/video, city-filter enabled/copy,
catalogue title template/card labels/icons, recommendation heading/type labels,
closing CTA and the preserved shared guide-detail CTA. A single positive checkbox
controls the city filter. Enabled filters guide/recommendation panels by city;
disabled shows all groups with global automatic recommendations. No individual
city hiding, no publication changes and no individual-guide CMS in this delivery.
No migrations or new dependencies. Existing guide_aside translations preserved.

Root typecheck/lint/228 affected tests/build exit0 on fc1daac. Lint has five
pre-existing warnings. Build generated82pages with isolated QAfixtures. Evidence:
/private/tmp/central-hill-guides-qa/root-{typecheck,lint,tests,build}.log.
Independent QA approved fc1daac:23distinct finalcases PASS, no unresolved product
findings. Report: [Guides QA](guides-page-editor-qa.md). Early harness failures
(disabled-button automation, Next route-announcer selector and asynchronous route
assertion) are retained transparently and affected cases passed after harness fixes.
No application code changed during QA. Final documentation commit is identified by
local main HEAD; executable delta versus fc1daac is verified empty before delivery.

Preview uses ONLY synthetic local data: http://127.0.0.1:3060/admin/pages/guides,
PostgreSQL guidespageqa5558/proxy4458, dedicated bucketguidespageqa/S3rver9060.
The existing user preview3059/servicedetailqa remains intact. Login uses a synthetic QA account, recorded in the QA report. No push, deploy or remote DB/
media mutations. Environment uses explicit fake env.sh; root.env.local was not copied.

Worktrees preserved: /private/tmp/central-hill-guides-integration (root),
/private/tmp/central-hill-guides-editor (A), /private/tmp/central-hill-guides-public
(B). A commitfddd2d6 integrated3baca4a; B1433fc1 integratedfc1daac; contracts3a5ccd9.
B's untracked node_modules symlink is a local dependency artifact, not a source file.
Root owns server3060 session53787; QA owns S3rver9060 session31430.

Canonical QA source restored through savePage after testing: original guide_aside,
city_filter.enabled=true, no editorial/SEO/media overrides and OGnull; temporary
page translations removed. Source cities/guide publication restored. Screenshots,
raw results, scripts and uploaded assets preserved under the dedicated QA directory.
Root and QA inspected desktop/mobile captures. Source corruption blocks destructive
saves, invalid target fields fall back individually, and media guards run before writes.

Known intentional limits: no draft preview (Save publishes), no editable internal
CTA destinations, no Lottie hero, cards/places remain Guides data, city publication
remains Geography. Legacy Porto/Cascais placeholders are presentation only and
become real city chips when their source slug matches a published Geography UUID.

## Changed files against stable baseline

- `AGENTS.md`
- `docs/data-model.md`
- `docs/specs/guides-page-editor-qa.md`
- `docs/specs/guides-page-editor.md`
- `docs/specs/handoff-guides-page-editor.md`
- `messages/en.json`
- `messages/es.json`
- `messages/fr.json`
- `messages/pt.json`
- `src/app/(admin)/admin/(panel)/pages/[key]/page.tsx`
- `src/app/[locale]/guides/page.tsx`
- `src/slices/guides/README.md`
- `src/slices/guides/contract.ts`
- `src/slices/guides/server/queries.ts`
- `src/slices/guides/server/recommendation-scope.ts`
- `src/slices/guides/tests/listing-presentation.test.ts`
- `src/slices/guides/tests/recommendation-scope.test.ts`
- `src/slices/guides/ui/components/guides-city-filter.tsx`
- `src/slices/guides/ui/guides-listing.tsx`
- `src/slices/guides/ui/listing-presentation.ts`
- `src/slices/pages/README.md`
- `src/slices/pages/admin/actions.ts`
- `src/slices/pages/admin/guides-defaults.ts`
- `src/slices/pages/admin/guides-media-validation.ts`
- `src/slices/pages/admin/layout.ts`
- `src/slices/pages/admin/queries.ts`
- `src/slices/pages/admin/ui/page-editor.tsx`
- `src/slices/pages/admin/ui/schema-fields.tsx`
- `src/slices/pages/contract.ts`
- `src/slices/pages/schemas/guides.ts`
- `src/slices/pages/server/guides-content.ts`
- `src/slices/pages/server/metadata.ts`
- `src/slices/pages/server/queries.ts`
- `src/slices/pages/tests/guides-content.test.ts`
- `src/slices/pages/tests/guides-defaults.test.ts`
- `src/slices/pages/tests/guides-editor.test.ts`
- `src/slices/pages/tests/guides-media-validation.test.ts`
- `src/slices/pages/ui/components/guides-media.tsx`
- `src/slices/pages/ui/components/guides-sections.tsx`


Follow-up posterior al cierre: Show city filter ahora colapsa sus campos al
estar desactivado, conservando valores. Usuario validó el comportamiento;
typecheck/lint/build0, sin nueva QA independiente. Server3060 sesión74270.
Ver HEAD para commit que captura ese ajuste y brief del siguiente trabajo.
