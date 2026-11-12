# Owners preview without a saved snapshot

2026-11-11. User reports authenticated `/admin/pages/owners` iframe404 plus nested
html/body hydration errors. Root-owned bounded correction; no delegation required.
Base63252e8, main. Original untracked logo and public/propertylocalesqa preserved.

## Cause and change

Read-only guarded SQL confirmed propertylocalesqa has no Owners page_content or
page_locale_content rows. The editor already creates its default working envelope
in memory, but the initial preview injected null into OwnersPage, which calls
notFound before the live bridge can mount. This prevented any local edit from
reaching the preview. No missing provider or failed session query was involved.

When no saved preview exists, the private route now resolves the same canonical
working envelope from getPageEditorialModel. Existing saved draft/published output
still wins. This fallback is private and read-only: no bootstrap, Save, Publish,
upload, public fallback change or revalidation. Request/locale/surface/instance
guards and staff authorization remain intact.

The root not-found owns html/body for routes without a document layout. Its reuse
inside AdminRootLayout created a second document. A local `(admin)/not-found.tsx`
now renders content only, under the existing admin document. Public/root error
rendering is untouched. React DevTools/HMR messages are normal development notices.

Write set: Pages admin/editorial-preview-route.tsx, app/(admin)/not-found.tsx,
Pages tests/preview-initial-state.test.tsx and this report. No kernel/schema/migration.

## Verification

Node22: seven actual-module/SSR regression tests pass: unsaved working fallback
in EN/ES/PT/FR, saved content priority, rejected requests still authenticated and
admin404 with one html/body. Typecheck0. Scoped/full lint and separate build are
recorded below when finished. One test variable was renamed to satisfy Next ESLint.

Real Chromium check on localhost3071 with normal existing local Admin login:
Owners editor/iframe200; a private unsaved Hero Title change appears in the iframe;
an invalid preview locale404 renders Page not found with one html/body. Zero
pageerrors/hydration console errors. SQL snapshots before/after are identical:
Owners legacy rows0 and locale rows0. No content was saved/published. The first
harness used Headline instead of the actual Title label and stopped before editing;
only that selector was corrected. No product correction or saved data was involved.

Artifacts: /private/tmp/central-hill-owners-preview-qa/browser.mjs,
browser-report.json,owners-desktop.png,typecheck.log,lint.log; focal test output
/private/tmp/central-hill-owners-preview-tests.log. Existing guarded main runtime
Node22/localhost3071PID87925/session28410 is retained; env/preload/media/caches are
preserved. No push/deploy or actual email. Tests are root-owned; no independent
QA approval is claimed for this small correction.
