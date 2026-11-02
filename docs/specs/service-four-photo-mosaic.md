# Service detail four-photo mosaic — 2026-11-01

User requests the supplied four-photo layout for every service detail, including
BO image selection. Confirmed: services with fewer photos show their available
photos until staff complete the four, without stock replacements or duplicates.

Base81200da, clean workspace/main at task start. Bounded root-owned follow-up
using MosaicGallery's existing adaptive four-photo layout. Writable: Services
detail renderer/ServicePhotos documentation, new pure ui/service-gallery.ts + focused tests, service form
media labels/guidance, EN/PT/ES/FR messages, Services README, visual handoff and
this spec. No shared kernel/schema/persistence changes, migrations, DB/storage
writes, automatic visual QA, commit, push or deployment. No delegation needed
for this existing-component adaptation and editor guidance change.

Contract: cover is image1/large left. The first three ordered gallery images
are image2/wide top right, image3/bottom-left of right half and image4/bottom-right.
Public mosaic shows at most4, and more photos remain available through the
existing Show all photos dialog. BO explicitly labels the cover and gallery
roles, with four-position guidance, retaining its image upload/removal/reorder
controls. No new required photos on old services or saves. Existing image MIME
and existence validation, deferred upload queue, locale/SEO/ISR contracts remain.
Mobile four-photo layout keeps lead and second photo full-width, then two below.

Acceptance:1–4 photos use available-only adaptive layouts;5+ show four plus
Show all photos. All service routes/locales share this renderer. Editor selects
one cover plus ordered gallery photos and preserves extras. Verify pure gallery
selection and existing Services editor/media/save tests, Node22 typecheck/lint/
build and read-only public browser behavior. No actual BO save/upload or content
changes without separate database authorization; record that persistence limit.

## Delivery and functional checks

Implemented from81200da; user subsequently authorized a localhost restart and
local commit of this follow-up. Uses the existing
adaptive mosaic for1–4 photos, a service-owned four-photo selection helper and
an extra-photo dialog threshold of5. The four-photo mobile variant puts the
second photo across both columns and chooses a matching responsive image size.
Shared MosaicGallery and every other consuming page retain their defaults.

BO media fields explicitly name the cover as image1 and ordered gallery photos
as images2–4, with localized guidance for all four positions. The existing
gallery picker selects/uploads images and its arrows control their order; extra
photos are retained. Existing form serialization, MIME/existence guards, deferred
upload queue and server gallery persistence are unchanged. No new database fields,
required photos or forced content backfill.

Node22 integrated working-tree checks:

- `pnpm typecheck`: exit0.
- `pnpm lint`: exit0, seven existing unrelated warnings.
- `pnpm exec tsx --tsconfig src/slices/pages/tests/tsconfig.json --test
  src/slices/services/tests/service-gallery.test.ts
  src/slices/services/tests/services-editor-model.test.ts
  src/slices/services/tests/services-media-validation.test.ts
  src/slices/services/tests/services-admin.test.ts`: exit0,36 cases.
  Covers0–4 available-only photos, cover/gallery order, extra-photo retention,
  four-tile layout, all editor locales, form payload/reload models and existing
  MIME, UUID, save and validation behavior. tsx needed approved sandbox access
  for its local socket.
- `pnpm build`: exit0,210 static pages generated.
- `git diff --check`: exit0.

Read-only functional browser check on localhost3071: all10 published English
service detail routes render between1 and4 available photos. Grocery remains1;
Sintra and Fátima show4; Chef at Home shows2. Sintra retains4 at390px too. No
current service has more than4, so extra-photo retention/dialog activation is
covered by the focused selection/render test rather than a real catalogue edit.
Script:/private/tmp/central-hill-service-mosaic-functional.cjs. Initial browser
probe assumed a main tag; corrected to the app's div-based content wrapper before
the final passing check. Chromium required approved sandbox access.

No automatic visual QA, screenshots, actual BO save/reload/uploads, database/
storage writes, migration, push or deployment. Real persistence is unchanged and
covered at model/validation level; no claim of browser persistence QA. The user
reviews the design at localhost3071.

## Requested restart and commit

User requested restart before committing. Verified old3071 listener PID20601
belonged to this workspace, stopped only that server with approved sandbox
access, and preserved its development cache at
/private/tmp/central-hill-dev-cache-service-mosaic-BgjB6Ptr/dev. Restarted Node22
`pnpm dev --port 3071`, tool session52122, listener PID95629; Next reported ready.
No old task previews or other processes were modified. Local commit only, no
push or deployment; prior functional checks above retain their recorded scope.
