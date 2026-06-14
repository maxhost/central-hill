# Slice `backoffice` (S12)

The auth-gated **admin app shell** + the **plug-in framework** that every other
slice's `admin/` composes against (ADR 0009 auth, ADR 0017 routing). It is a
*skeleton*, not CRUD for an entity: it owns the login, the gated chrome
(sidebar + topbar), the dashboard, the screen **registry**, and the shared admin
**primitives**. Feature slices (leads inbox, page-content editor, translation
review, …) plug their own screens in — those land as separate slice work.

## Owns

**No DB tables, no migration.** Authentication tables (`user/session/account/
verification/staff_role`) belong to `core/auth` (migration `0000`); each feature
slice reads its own data in its `admin/`.

**Routes (app shell — brand-new `(admin)` route group):**

```
src/app/(admin)/
  layout.tsx                  # 2nd root layout: <html lang="en"> + intl provider
  admin/login/page.tsx        # ungated sign-in
  admin/forbidden/page.tsx    # ungated "wrong role" screen
  admin/(panel)/layout.tsx    # GATE (requireStaff) + AdminShell chrome
  admin/(panel)/page.tsx      # /admin → Dashboard
src/app/api/auth/[...all]/route.ts   # Better Auth HTTP handler
```

`/admin` is **not** locale-prefixed (ADR 0017): the public site keeps its own
root layout (`[locale]/layout.tsx`) untouched, and the two roots coexist via the
route group. No middleware is introduced — public ISR is unaffected. The eventual
`backoffice.*` host split (ADR 0004) rewrites onto these same paths.

## Auth (kernel — `core/auth`, ADR 0009)

This slice wires the auth the ADR mandates:
- `core/auth/auth.ts` — Better Auth instance gains `secret`/`baseURL` from env.
- `core/auth/session.ts` — `getSession()`, `getStaff()`, `requireStaff(roles?)`
  RBAC helpers (server-only). `requireStaff` redirects to `/admin/login` (no
  session / not staff) or `/admin/forbidden` (role not permitted).
- `core/auth/client.ts` — browser `authClient` for the login form + sign-out.
- `core/auth/index.ts` — server barrel (`auth`, helpers, `StaffRole`/`StaffContext`).

**Authorization is default-deny:** an authenticated user with no `staff_role`
row is treated as not-staff.

## Contract (`contract.ts`)

- **Plug-in framework** — `AdminScreen`, `AdminNavGroup`, `AdminNavGroupId`,
  `composeAdminNav(extra, role)`, `CORE_ADMIN_SCREENS`. A slice declares an
  `AdminScreen[]` in its own `contract.ts`; the panel layout spreads them into
  `composeAdminNav`. Composition is explicit (no module-level mutation) so the
  sidebar is deterministic under RSC. Nav labels are i18n **keys** resolved
  against the `backoffice` namespace.
- **Shell** — `AdminShell`, `Dashboard`, `LoginForm`.
- **Primitives** — `AdminPageHeader`, `AdminCard`, `EmptyState`, `StateBadge`,
  `DataTable` (+ `Column`), `TranslationFieldRow` (translation-review scaffold).
  Pure/presentational so slice **server** components compose them directly.

Backoffice routes are **dynamic** (auth) — no ISR, no cache tags.

## How a slice plugs in (future work)

1. Add `admin/` screens + an `adminScreens: AdminScreen[]` export to the slice
   `contract.ts`.
2. Add the route(s) under `src/app/(admin)/admin/(panel)/…`.
3. Spread the slice's screens into `composeAdminNav([...])` in the panel layout.
4. Add the nav-label key under the `backoffice` i18n namespace.

## i18n

Chrome strings live in the root `messages/<locale>.json` under the `backoffice`
namespace (en/pt/es/fr authored): login, nav + group headings, shell, dashboard,
forbidden. The admin UI renders in English for now (pinned via `setRequestLocale`)
but the keys exist in all four locales.

## Bootstrap the first admin

```
npx tsx scripts/create-admin.ts <email> <password> [name] [role]
```

Needs `DATABASE_URL` (and `BETTER_AUTH_SECRET` in production) in env. Creates the
user via Better Auth and grants a `staff_role` (default `admin`).

## Tests

`tests/backoffice.test.ts` — `composeAdminNav` grouping / ordering / role
filtering / empty-group drop. Run:
`npx tsx --test src/slices/backoffice/tests/backoffice.test.ts`.
