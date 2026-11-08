# Slice `backoffice` (S12)

## Focused page editor workspace

The dedicated `/admin/pages/blog/article-sidebar` editor uses the same focused
workspace as `/admin/pages/[key]`, including its hidden navigation default.

`EditorSection.selectAsGroup` optionally presents one Element option for an entire
section while keeping all bindings available to the inspector and private preview.
Pages enables it for every Home and Owners section, editing each block's fields together.
Other Pages retain their existing element selection. SEO keeps its dedicated toolbar.
See `docs/specs/home-figures-group-selection.md` for L0 review scope.
Owners rollout: `docs/specs/owners-section-selection.md`.

`AdminShell` keeps authentication-derived identity and nav composition on the server,
passing rendered slots to the private `AdminWorkspace` client layout. At `/admin/pages/[key]`,
the desktop sidebar starts hidden; its topbar icon button opens/closes it without remounting
the current editor. A route change resets the layout default. Other BO routes start with
the sidebar visible. The toggle has localized labels, focus styling and expanded/control
attributes; below `md` the existing hidden-sidebar layout is retained.

Page-editor routes use the available main width instead of `max-w-6xl`. The shared
`PageEditorShell` inspector is 500px on the left at `xl` (latest user revision); the canvas occupies
the remaining width on the right and its existing ResizeObserver adjusts fit. Smaller screens keep their
stacked layout. No editor, draft, preview or persistence contracts change.
See `docs/specs/backoffice-editor-workspace.md` for delivery/review scope.

`PageEditorAdapter.pageNavigation` is an optional rendered slot above the preview/inspector
grid and device controls. Pages supplies its route navigator and unsaved-change dialog;
Backoffice does not import page keys or own their draft/locale state. The inspector stays
500px on the left and the existing preview/device controls remain available.
The editor title/language/state/Save draft/Publish header sticks to the viewport top
while scrolling, with an opaque bg-token surface above preview controls.

## Sidebar organization

The main catalogue block is headed **Website**: Pages, Buildings (Amenities, then
Cities as children), Guest Services, Guest Guides, Blog Posts. Service categories
remain under Guest Services; blog categories/authors remain under Blog Posts.
The separate **Content** heading follows Website and always shows FAQ, Testimonials,
Forms, in that order. It is a group heading, not a dropdown. Overview, CRM,
Translations and System retain their order and existing permissions.

`AdminNavGroupId` includes `website` before `content`; contributions declare their
group/order/parent through the existing AdminScreen contract. Group headings and
guest catalogue labels resolve in EN/PT/ES/FR. See
`docs/specs/backoffice-sidebar-organization.md` for scope and review limits.

## Local live preview

The optional PageEditorAdapter.previewPayload enables an ephemeral same-origin live preview.
PageEditorLivePreview accepts the owning slice's staff-gated render action, keeps only one
request and the newest queued snapshot, and ignores obsolete results. The shell debounces
payloads and refreshes without reloading the iframe; existing saved-only adapters are unchanged.
The bridge validates origin/source/instance/revision/JSON bounds, rebinds selection after RSC
updates without focus changes and preserves private preview scroll. No persistence belongs here.


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
  Screens may set `parentId` to a top-level screen in the same group. Its children
  appear beneath it while the parent or a child route is active; the parent link
  still opens its normal list. Role filtering runs before nesting, and a visible
  child whose parent is unavailable stays accessible at the top level.
- **Shell** — `AdminShell`, `Dashboard`, `LoginForm`.
- **Primitives** — `AdminPageHeader`, `AdminCard`, `EmptyState`, `StateBadge`,
  `DataTable` (+ `Column`), `TranslationFieldRow` (translation-review scaffold).
  Pure/presentational so slice **server** components compose them directly.
- **Form primitives** (`ui/form.tsx`) — `Field`, `TextInput`, `TextArea`,
  `Select`, `Checkbox`, `AdminButton`, `FieldGrid`, `FormActions`, `controlClass`.
  Presentational controls slice **client** form islands compose (the island owns
  state + the server-action submit). The leads inbox predates these; the CRUD
  screens (pages/buildings/apartments) build on them so inputs stay consistent.
- **Toasts** (`ui/toast.tsx`) — an **agnostic** notification system: `ToastProvider`
  is mounted once in the `(admin)` root layout; any admin **client** component calls
  `useToast()` to fire any message with any variant — `toast.success(msg)`,
  `toast.error(msg, { description, duration })`, `toast.info`/`toast.warning`, plus
  `toast.show(msg, opts)` and `toast.dismiss(id)`. Not coupled to CRUD (any message),
  but the pages/buildings/apartments forms use it to report save/delete outcomes (it
  replaced the old inline `banner`). In-repo (no dependency — stack locked), auto-dismiss,
  dismissible, stacked bottom-right, `aria-live`. `useToast()` is safe outside a provider
  (returns a no-op API). Messages are passed in by the caller, so it carries no i18n of its
  own (callers use their own keys, e.g. `backoffice.actions.saved`/`deleted`/`*Error`).
- **Media picker** (`ui/media-field.tsx`, `server/media-actions.ts`, ADR 0018) —
  `MediaField` (single cover/og asset) + `MediaGalleryField` (ordered gallery),
  controlled islands that run the two-phase upload: `presignAdminUpload` →
  direct browser **PUT** to R2 → `finalizeAdminUpload`. `resolveMediaPreviews(ids)`
  resolves previews for already-persisted assets on edit screens; `AdminMediaPreview`
  is the render-ready view. **ADR 0018 places the media admin UI here**; consuming
  slices import the fields via this contract and never touch `core/media` ingest
  directly (those kernel functions are `server-only` + ungated by design).
  `accept` (`ui/media-accept.ts`, pure + tested; type `MediaFieldAccept` in the contract) picks
  what a field takes:
  - `"image"` (default) — JPEG/PNG/WebP/AVIF;
  - `"video"` — MP4/WebM (background loops, e.g. the Home hero);
  - `"media"` — image or video;
  - `"animated"` — image (incl. animated WebP), MP4/WebM **or Lottie** (`.json` / `.lottie`):
    the Home guests-pitch side media only (spec `home-admin-editor` S6);
  - `"document"` — PDF only (`.pdf`): the Real Estate capability statement (spec
    `real-estate-admin-editor` S4). No other accept takes a PDF.

  The lists reuse `core/media/mime.ts`, so they stay a subset of what ingest allows. `accept`
  sets the file dialog filter (`acceptAttribute`; Lottie fields also list `.lottie,.json`,
  since the OS knows no type for a dotLottie) **and** a client check on the picked file
  (`isAcceptedType`), refused with `backoffice.media.wrongType` ("That file type isn't allowed
  here."). Before the check, the file's type is **normalised** (`pickedFileType` →
  `canonicalMediaMime`): `.lottie` → `application/zip+dotlottie`, `.json` → `application/json`,
  whatever the browser reported (a `.lottie` usually reports none). Presign repeats the same
  normalisation server-side; `core/media` ingest stays the authority (it also validates a
  Lottie's structure on finalize).

  Tiles: a non-image preview shows a labelled tile, "Lottie" (`media.lottie`) or "Video"
  (`media.video`) (`previewLabelKey`); an empty video-only field reads "No video"
  (`media.emptyVideo`), every other empty field "No image" (`emptyStateKey`). A PDF shows a file
  glyph + "PDF" (`media.document`) and, under the field, its filename as a new-tab link
  (`previewFilename`: the picked file's `name` on a local preview, else the URL's last segment);
  an empty document field reads "No PDF" (`media.emptyDocument`).
- **Media queue busy signal** (`ui/media-queue.tsx`, `ui/media-busy.ts`, spec `home-admin-editor`
  S2). Picking a file first reserves the upload (a presign round-trip); until that settles, the
  form's value does not hold the new id, so an early Save would persist the form without it.
  `useMediaQueue().track(work)` counts each pick as one in-flight reservation (released when it
  resolves **or** throws — `trackReservation`) and `isPreparing` is true while the count is above
  zero; `MediaField`/`MediaGalleryField` wrap every pick in `track` until their `onChange` has
  run. **All 8 media forms gate Save on it** (button disabled + `onSubmit` returns early, with
  the shared `media.waitForMedia` hint "Wait until the media is ready."): the pages editor
  (`45c3b93`) and Settings, Buildings, Apartments, Blog post, Blog author, Services and Cities
  (`f9eb9d3`). A new media form must do the same.

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
filtering / empty-group drop. `tests/media-accept.test.ts` — what each `accept` kind takes and
refuses (incl. `.lottie` / `.json` normalisation, tiles); `tests/media-busy.test.ts` — the
reservation counter. Run:
`npx tsx --test src/slices/backoffice/tests/backoffice.test.ts`.

## Contextual page editor (ADR0039)

`PageEditorShell` is a reusable saved-content canvas and inspector. A
`PageEditorAdapter` supplies sections and binding IDs, locale/selection callbacks,
preview URL/version, pending state, actions and inspector. The shell owns no page
queries or persistence. The adapter increments `previewVersion` after a successful
save; pending edits remain explicitly separate from the saved preview. Desktop,
tablet and mobile use real iframe document widths1440/768/390 with fit scaling.
The outline and binding selector retain access to hidden/empty content sections.
An adapter may set seoSectionId: that section opens from SEO EN/ES/PT/FR beside viewport
controls and is excluded from Sections/Element. SEO mode keeps the right inspector and
returns to content selection through the canvas/outline.

Only authenticated private previews mount `PageEditorPreviewBridge({instance,
bindingIds})`. The route passes the `instance` query parameter and an allowlist of
section/binding IDs. The renderer annotates selectable elements with
`data-editor-binding="<id>"`; public rendering omits those attributes and the bridge.
Both directions validate same origin, exact parent/iframe window, instance and
allowlist through the pure `readPageEditorMessage` helper. `ready` is preview→shell;
`select` is bidirectional and never echoed. Parent selection scrolls/focuses and
highlights the preview element. Preview click/keyboard selection opens its inspector.
Navigation, submissions, dragging and embedded iframe interaction are blocked in
the preview; this is an editing surface, never a public form runtime. The route
owns authentication/noindex/no-cache, and page adapters own external integration
notices and translation/publishing semantics. Bridge behavior has explicit tests in
`tests/page-editor-bridge.test.ts`.

## Common Pages contextual editor

Pages supplies one descriptor-driven contextual editor for Home, Owners, Buildings listing,
Real Estate and Guest. The shared shell/bridge continues to own viewport, selection and
bounded ephemeral live messages; Pages owns each page/locale snapshot and explicit Save
draft / Publish actions. Stable list policies extend NodeField without changing legacy About
consumers. Staff preview routes alone mount live/selection bridges; public routes omit them.

An adapter may supply `previewDialog` (bindingId/open/onOpenChange) to expose a
read-only modal in its iframe. Same origin/source/instance/allowlist guards apply
to dialog messages. The private bridge stores its visibility marker and emits
`central-hill-preview-dialog`; opt-in dialog islands consume that marker across
live RSC replacements. Close/backdrop/Escape are allowed UI controls; form input,
navigation and submission remain blocked. Guest uses this for its owner contact
copy, with Escape also handled while focus is in the inspector. See
`docs/specs/guest-contact-dialog-preview.md`.

Selection messages accept an optional boolean `focus`. Automatic ready/locale
synchronization scrolls and highlights with `focus:false`, preserving typing in
the inspector; explicit selector actions retain focus behavior. Omitted flags
remain compatible with earlier senders. Source/origin/instance/binding guards
also apply to these messages.

### Localized ALT beside image pickers (ADR0076)

`MediaAltProvider` binds the current locale's controlled description map to nested
MediaField/MediaGalleryField image inputs. `editAlt={false}` retains existing inline
ALT controls; `mediaDisabled` locks only shared photo controls. Videos/documents/
Lottie never receive an image ALT input. `OwnerMediaAltFields` supplies four inputs
for non-tab forms; persistence and publication remain owned by the consumer.
