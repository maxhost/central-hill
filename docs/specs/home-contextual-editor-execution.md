# Home contextual editor — execution

2026-10-18. Authorized implementation of the closed plan. Base c28615fd80e9d10fb941d9ac11bd5bbbf39d73ce;
initial checkout clean. Integration home-contextual/integration at
/private/tmp/central-hill-home-contextual-integration. Forms checkout/3064 and concept3070 preserved.
No main integration, push, deployment, GitHub or production access.

## Contracts and ownership

ADR0039 and backoffice/page-editor-types.ts define the shared interface before consumers.
Shell receives PageEditorAdapter with sections/bindings, selectedId/onSelect, locale/onLocaleChange,
previewUrl/previewVersion, dirty/busy, status, inspector and actions. Shell exports PageEditorShell;
bridge exports PageEditorPreviewBridge taking {instance:string, bindingIds:string[]}.
Preview bridge query parameter is instance; messages use channel central-hill-page-editor,
instance, ready/select and bindingId. Both sides check origin/source/instance and allowlisted IDs.
Preview annotations are data-editor-binding="<binding ID>". Selection IDs match dotted schema paths;
section IDs may be selected. Viewports1440/768/390 are document widths, visually scaled to fit.

A: home-contextual/shell, /private/tmp/central-hill-home-contextual-shell.
Exact write set: src/slices/backoffice/ui/page-editor-shell.tsx,
src/slices/backoffice/ui/page-editor-preview-bridge.tsx,
src/slices/backoffice/ui/page-editor-bridge.ts,
src/slices/backoffice/tests/page-editor-bridge.test.ts,
src/slices/backoffice/README.md. No other files. Root exports components from contract.

B: home-contextual/home, /private/tmp/central-hill-home-contextual-home.
Exact write set: src/slices/pages/home-content.ts, schemas/home.ts,
admin/home-save.ts, admin/home-media-validation.ts, admin/home-contextual.ts,
admin/home-actions.ts, admin/home-queries.ts, admin/ui/home-contextual-editor.tsx,
ui/home-page.tsx, server/home-translations.ts, tests/home-contextual.test.ts,
README.md (all prefixed src/slices/pages/ except schemas/admin/ui/server/tests shorthand).
B supplies full adapter, saved-content preview renderer annotations, source/target save/read,
revision protection, stable stats identities, validation, existing controls/media queue reuse.
B exports getHomeContextualModel() from admin/home-queries, HomeContextualEditor({model}),
HomePage({locale,preview?:boolean}); private Home preview bridge is root-owned route.
Root integrates admin/actions.ts, admin/queries.ts, server/queries.ts, form-model.ts if needed,
backoffice/contract.ts, Pages contract.ts, routes, four Pages message JSON files, ADR/spec/docs,
new isolated local QA environment. B may request scope expansion before editing other files.
No migrations expected; root owns any necessary schema registry/migration changes.

## Acceptance and checks

All current Home fields reachable including hidden/empty sections and SEO/OG. Same public renderer,
no section reorder. Saved-content preview left, inspector right, outline, selection/focus and real
viewport widths. Authenticated private/noindex preview; navigation/submits blocked, Avantio external.
EN source Save and publish; ES/PT/FR local drafts across tabs, review/approval/fallback/stale using
kernel pipeline, shared references/structure untouched. Atomic source sync, stale-write conflicts,
stable list IDs, preserve translations. Media queue flush before save; media existence/MIME validation.

Node22/pnpm typecheck; lint; explicit affected tsx --test files; build on isolated Home DB.
db:check if migrations occur. Manual boundary, four-locale/SEO/ISR review. Independent normal
scoped QA: text/media/button save/reload/public; one upload; stats list identity and ES
fallback/review/approval/stale; desktop/mobile batched pass and affected-fix confirmation only.
QA environment must use new synthetic DB/storage/user and distinct ports, recorded below.

## Progress

Contracts and ADR prepared; implementation not yet delegated. QA pending.
