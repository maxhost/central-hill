# Blog page editor — independent functional QA

2026-10-18. Candidate `d7fc540e1bd002e7a62b46d1534e2df9342ed27a`,
branch `blog-page/integration`, checkout
`/private/tmp/central-hill-blog-page-integration`. Branch/HEAD and initially clean
tracked/untracked status verified before QA. Independent QA edits only this report
and its temporary scripts/artifacts; no implementation edits.

## Scope and environment

Normal functional verification requested by the user: edit/save/reload, public
output, one real image upload, representative translation and fallback, desktop
and mobile. No expanded adversarial, concurrency or failure matrix; article
editor, search activation and Leads submission remain outside this delivery.

Existing production-build server at `http://127.0.0.1:3063`; existing previews
3059–3062 were not used, restarted or changed. Dedicated synthetic environment:
Postgres5588/proxy4488, DB and role `blogpageqa`, S3rver9063/bucket `blogpageqa`,
Docker network `central-hill-blog-page-qa`. Browser script checked
`current_database()/current_user` as `blogpageqa/blogpageqa` before testing;
fixture manifest identifies the synthetic page, staff account and two published
posts (one featured, one grid). All mutations used the local admin interface.
No production credentials/data, main integration, push or deployment.

## Functional evidence

Browser automation: Node22.23.3 and Playwright Chromium, script
`/private/tmp/central-hill-blog-page-qa/qa-main.cjs` (executed as approved
`qa.cjs`, then preserved; supplemental reset uses the same approved entrypoint).
Evidence in that directory:
`qa-results.json`, `listing-desktop.png`, `listing-mobile.png`,
`article-desktop.png`, `article-mobile.png`, `es-draft.png`, `es-approved.png`,
`es-preserved.png`, `es-cleared.png`, `pt-fallback.png`, `fr-fallback.png`,
`editor-final.png`. Public/editor navigations assert HTTP200; the script records
HTTP errors and uncaught browser exceptions.

- Initial editor had six expected cards, 17 text fields, all13 new overrides
  blank with English inherited placeholders, and all four legacy article-aside
  values populated. Source-language/translation guidance and relevant links are
  visible. No duplicate OG card or listing hero-image field.
- Authored all13 new text overrides covering header/search, Featured, Journal,
  shared newsletter and listing SEO. Selected a real JPEG through the admin file
  input, then Save, reload, verified all values, and Save again successfully.
- Listing immediately displayed the authored copy and search placeholder/label.
  Uploaded image appeared in actual `og:image` metadata from the isolated bucket;
  OG is not displayed as a hero. Listing title/description reflected source SEO.
- Article newsletter immediately consumed the same three Page Blog fields.
  Existing article title/description/cover OG and legacy sidebar CTA remained
  visible. This checks shared output; it does not claim article-editor coverage.
- Translation review UI added ES headline, Featured label, SEO title and SEO
  description. A saved draft headline did not publish; public used EN source.
  Approving each target immediately updated `/es/blog` without a rebuild.
- Resetting the approved ES headline immediately restored EN source publicly;
  reapproving it immediately restored the Spanish target. Supplemental script
  exit0; `qa-reset-results.json` records this and an additional Save/reload that
  left the cleared Featured override empty (no inherited placeholder persisted).
- An unrelated English intro Save preserved the approved Spanish headline,
  Featured label and SEO output.
- Clearing the English Featured override restored localized `DESTACADO` in ES;
  direct read-only SQL confirmed both its source and target rows were gone.
  PT/FR smoke retained authored English source for untranslated fields and
  localized Featured defaults (`EM DESTAQUE` / `À LA UNE`), without overflow.
- Listing canonical used `https://centralhill.pt/{locale}/blog`; hreflang included
  EN/PT/ES/FR and x-default. Article metadata retained the pre-existing configured
  local origin in this synthetic runtime; individual article SEO was not changed.
- Desktop1440 and mobile390 listing/article screenshots inspected visually;
  no horizontal overflow, both synthetic post images loaded. Existing warm
  editorial structure preserved. Orange images are intentional synthetic JPEGs.

## Integrated checks supplied by orchestrator

QA inspected the actual logs in `/private/tmp/central-hill-blog-page-qa/`:
`typecheck.log`, `lint.log`, `tests.log`, `build.log`. Orchestrator reports exit0
for `pnpm typecheck`, `pnpm lint`, explicit affected Pages/Blog/Translation tests
(**194/194 pass**) and `pnpm build`. Build began at `cb1f068`; candidate `d7fc540`
changes only documentation, a schema comment and test expectation relative to
that executable candidate. No migration introduced; db:check not required.
Do not count placeholder `pnpm test` or `pnpm boundary:check` as verification.
Manual boundaries/locale review and UI detector `[]` supplied by orchestrator.

One initial harness assertion compared CSS-uppercase displayed eyebrow with
mixed-case source and stopped after successful save/upload/listing checks.
Assertion was corrected to case-insensitive text comparison and normal checks
continued. This was a test-harness issue, not an implementation finding.
The local server emits an existing dual-libvips Objective-C class warning;
image upload/display completed, with no corresponding browser failure.

## Result

**APPROVED** for candidate `d7fc540` within the requested normal functional
scope. Main and supplemental browser runs exit0; no blocking findings. Browser HTTP errors and uncaught
exceptions: `[]`. This approval covers the requested normal functional scope;
it does not claim the deferred article/search/Leads changes or a broad failure
matrix. Previews3059–3062 preserved.
