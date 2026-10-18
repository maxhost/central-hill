# Buildings sidebar submenu

2026-10-18. Small refinement owned and implemented by the main agent.
Base: 38426f716fd3a584ba4b5c185f8bed1addbb5055; main, initially clean.

Buildings continues to open /admin/buildings. Amenities appears as an indented
nested link while a Buildings or Amenities route (including new/edit) is active.
Only the matching link receives aria-current. Existing labels in all four locales
and all destinations remain intact. Role filtering precedes nesting; an orphan
permitted child remains accessible. No DB, public rendering, SEO or ISR changes.

Write set: backoffice/types.ts, registry.ts, ui/admin-nav.tsx,
tests/backoffice.test.ts, README.md; buildings/admin/screens.ts, README.md;
this spec. No kernel changes. Simple task, no parallel writers.

Follow-up requested and implemented: Services opens its existing list, with
Service categories nested underneath on service/category list and editor routes,
using the same parentId contract. Additional write set: services/admin/screens.ts
and services/README.md. Existing Buildings changes preserved. The Services screen
registration is also copied into the isolated preview worktree. User reviews
locally; no additional automated checks requested or run.

Blog follow-up: renamed the existing nav.posts label to Blog Posts (and authored
equivalents in ES/PT/FR). Blog categories and Authors now declare parentId
blog.posts, sharing the existing active-branch submenu behavior. Additional write
set: blog/admin/screens.ts, blog/README.md, messages/{en,es,pt,fr}.json. Screen
registration and four message files copied into isolated preview. No tests run,
per user's ongoing manual review preference; no new routes or data mutations.

Chevron follow-up: parent links with children display the existing client-safe
UiIcon nav-arrow-right when closed and nav-arrow-down when their branch is open.
No new toggle interaction; labels still navigate to their listings. Write set:
backoffice/ui/admin-nav.tsx and this spec; preview copy updated. Manual user review.

Ordering follow-up: Content menu is Pages (0), Buildings (10), Services (20),
Blog Posts (30), FAQ (40), Testimonials (50), Cities (60). Existing nested links
and other navigation groups preserved. Additional write set: testimonials and
geography admin/screens.ts; service/blog screen registrations and README order
references updated. Four screen files copied into isolated preview. No tests run,
per user preference; ready for manual localhost review.

Verification: Node22, pnpm typecheck, pnpm lint, pnpm exec tsx --test
src/slices/backoffice/tests/backoffice.test.ts, pnpm build using only the dedicated
servicedetailqa local environment. Browser: real form login, Buildings link,
nested Amenities and new/edit routes, another module, keyboard focus, desktop
and mobile. No database/content writes needed except creating the login session.

Status: ready for user review at http://127.0.0.1:3059/admin/buildings.
The user explicitly requested no automated tests and will review in localhost.
Lint completed exit0 (five existing warnings). Initial typecheck caught tuple/
optional-index issues in added tests; fixed, no rerun after the user's instruction.
Tests and build not completed; no QA approval claimed. Local source changes remain
uncommitted. The same five source/test files are copied into the isolated integration
worktree to serve the preview. Root and integration changes must be preserved.
Owned production-preview session20972 stopped; dev session57050 now serves3059
with fake local DB/proxy/media and auth URL127.0.0.1:3059. No push or deployment.
