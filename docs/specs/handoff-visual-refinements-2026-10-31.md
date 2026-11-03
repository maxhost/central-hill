# Local visual refinements — resume after context clear

## Brevo release authorized —2026-11-03

User now requests commit/push/deploy of the footer+Blog Brevo integration to
maxhost/central-hill, using their token for this operation without changing
saved55mais credentials. Base/fresh origin main1701436. Source newsletter
exports and prior test source included, no tests/check suites/automatic browser
QA or actual subscribers sent per user's explicit instruction. Vercel's build
and GitHub deployment status confirm publication; no migration/Neon write or
new environment variable. See footer-newsletter-brevo.md. Two unused original
logo files stay untracked; commit is resolved with git log -1.

## Newsletter Brevo integration —2026-11-03, after1701436

User authorizes connecting the footer modal and then the Blog newsletter band
to the supplied docs/newsletter/HTML.txt form. Footer keeps inline email →
prefilled editable modal; Blog keeps the same dark form-card UI. Shared Settings
helper posts EMAIL/OPT_IN=1/locale/honeypot as FormData to the fixed HTML action
with isAjax=1, requiring explicit provider success. No API key/global vendor
script, local Leads record, Resend or Neon write. Blog listing and articles share
the new form through the Settings contract. Private preview stays disabled.

IMPORTANT: user explicitly stopped tests/QA; they inspect localhost without
clicking Subscribe. Do not resume automatic tests/checks/browser QA or submit
subscriptions without a new request. No real subscriber created by the agent.
Previous unit-test attempt failed on tsx sandbox socket; escalated retry was
interrupted, no pass claimed. See footer-newsletter-brevo.md for exact state.
No commit/push/deploy requested for this integration; previous logo release
1701436 was already pushed and Vercel-successful. Preserve untracked newsletter
exports, the new helper/form/test/spec and the two unused original logos.

## Logo commit/push authorized —2026-11-03

User explicitly requests pushing these logo changes to maxhost/central-hill
using the supplied token only for this operation. Do not alter saved55mais
credentials. Main and fresh origin/main both fca0414 before this release.
Node22 `pnpm build` passes (exit0,210 static pages), and diff-check passes.
No tests/automatic visual QA under the L0 agreement, no DB writes/migrations.

Commit scope: site-header.tsx, site-footer.tsx, Settings README, this handoff,
logos/Logo Barra Topo bg.png and logos/Logo footer.png. The two other unused
user-supplied logo files remain untracked and untouched. Header includes the
three successive10% enlargements; footer uses200px natural-width rendering.
Final commit is resolved through git log -1; GitHub/Vercel status confirms
publication after push. This authorization supersedes the local-only boundary
in the historical implementation entries below.

## Footer image logo —2026-11-03

User requests replacing Footer's text Central Hill with logos/Logo footer.png.
Root owns site-footer.tsx, Settings README and this handoff. Preserve the
preceding uncommitted header-logo changes and all user-supplied logos/ files.
Static Next Image import of the original transparent3508×2481 white PNG,
200px width/max-width100%, natural proportions, alt Central Hill, default lazy
loading. Shared Footer kernel/contacts/navigation unchanged. Include this PNG
and the referenced top-bar PNG in a later commit; no commit/deploy requested
here. Aesthetic L0; user reviews3071, no automatic tests/QA or DB/storage writes.

## Top-bar image logo —2026-11-03

Third follow-up: another10%, now47.916px mobile/53.24px from768px, retaining
natural proportions; sizes hint170/189px. Same L0 scope, user reviews localhost.

Second follow-up: another10% over the current size, now43.56px mobile/48.4px
from768px (21% above the original36/40), with sizes hint155/172px. Same L0 scope.

Follow-up: user requests10% larger. Height is now39.6px mobile/44px from768px
(previously36/40), natural aspect ratio retained; image sizes hint141/156px.
Aesthetic L0, user reviews3071; no tests/automatic QA or deployment.

User requests replacing the text Central Hill in the top navigation with the
provided logos/Logo Barra Topo bg.png. Base main/fca0414 (already deployed to
GitHub/Vercel in the preceding conversation;24 Neon migrations were current).
Pre-existing untracked logos/ directory contains four user-supplied originals;
preserve all. Root owns site-header.tsx, Settings README and this handoff.

Header now statically imports the requested transparent3397×958 PNG using Next
Image, priority-loaded, at36px high mobile/40px from768px, with its natural
aspect ratio. Existing localized Home link/aria label preserved; image alt is
Central Hill. No logo recreation, image editing, footer or other asset changes.
The referenced PNG must be included in any later commit; the other supplied
logos remain unmodified/untracked. Aesthetic L0: user validates localhost,
no automatic tests/QA, DB/storage writes, commit, push or deployment requested.

## Commit and production release authorized —2026-11-01

User now explicitly requests committing and deploying to maxhost/central-hill,
and checking whether Neon needs migrations. This supersedes the prior local-only
delivery boundary for these accumulated changes. Preserve the deferred contact
data update; no content/media DB writes are requested here.

Fresh origin/main is0d44203; local main contains five unpublished commits through
f371a9a, plus the19 pending Blog source/test/doc files. User is informed the
release includes those five previous commits and the new Blog commit. No remote
divergence (0behind/5ahead before committing). GitHub's existing commit status
identifies Vercel as the connected deployment provider.

Read-only Neon MCP audit: project central-hill/weathered-cake-89640915, primary
branch main/br-little-heart-aihh9v63, database neondb. All24 migration ledger
hashes and timestamps match local drizzle files/journal,0000..0023 inclusive.
No migration files differ from origin/main. No migration is needed or applied;
new media fields are optional leaves in existing JSON content.

Final Node22 `pnpm build` on the complete working tree passes (exit0,210 static
pages). Earlier focused tests/typecheck/lint retain their recorded candidate
limits; no new aesthetic tests/automatic visual QA performed. `git diff --check`
passes. Deployment health and final commit must be confirmed after Git push;
use git log -1 and GitHub/Vercel status for the resulting checkpoint.

## Blog Journal bottom spacing —2026-11-01

User requests From the Journal bottom padding70px. Applied directly to the
Journal section at all viewports, preserving its existing responsive top
padding. Aesthetic L0; user reviews3071, no tests/automatic QA or DB writes.

## Blog Owners/Guests panels —2026-11-01

User requests the Home two-column Owners/Guests band on the Blog. Placement
explicitly confirmed: immediately after From the Journal, before Newsletter.
Reuse the existing DualCta composer with published Home content/media for the
current locale; editing remains Pages→Home, contacts Settings. Home drafts and
Blog-local preview never alter the shared published content. Existing localized
fallbacks, Owners route and Avantio booking target remain. No independent Blog
copy/schema or persistence changes. New wrapper uses70px top/bottom spacing.

Bounded root-owned aesthetic L0 follow-up, base f371a9a plus all preceding
uncommitted Blog changes, preserved. Writable: Pages dual-cta component and
contract, Blog listing, existing Blog presentation dependency stub, both slice
READMEs and this handoff. User reviews3071; no automatic tests/QA, database or
storage writes, migration, commit, push or deployment.

## Blog featured image link —2026-11-01

User requests clicking the featured post image opens its article. FeaturedPost's
image cell now uses Next Link to the same localized post route as Read Article,
with the post title as accessible name and an inset keyboard focus outline.
Both uploaded image and placeholder are linked; layout is unchanged. Updated
Blog README and JournalCard comment. Bounded low-impact link change; no new
tests/automatic QA, DB writes, commit, push or deployment. User reviews3071.

## Blog hero centering follow-up —2026-11-01

User reports different lateral padding/alignment, then clarifies Blog copy and
search should remain centered as before the photo. Blog uses40px horizontal
padding like other heroes,60px top/40px bottom; full-width max1600px wrapper,
centered headline/intro and search row. See blog-hero-background.md. Aesthetic
L0; no new tests/automatic QA or DB writes. User validates3071. Previous
functional checks precede this class-only adjustment.

## Blog hero photo —2026-11-01, after f371a9a

User requested a BO-editable background image like the other heroes, retaining
headline, intro and search strings by locale. Blog now uses the shared compact
Hero and standard image picker; photo/OG validation, private local preview and
descriptor capacity2 are wired. Old snapshots fall back to the existing Lisbon
stock photo used by Guides. Preceding uncommitted Blog label removal preserved.
See blog-hero-background.md for exact files, coverage and commands. Node22
typecheck/lint/build and19 focused Blog cases pass; seven old lint warnings.
No visual QA, actual BO save/upload, DB/storage write, migration, commit, push
or deployment. User reviews3071; no new required implementation work remains.

## Blog label removal —2026-11-01, after f371a9a

User requested removing Newsletter, Latest Articles, Featured and The Central
Hill Journal from the Blog listing and its BO page editor. Removed all four
eyebrow renders; the shared article newsletter also omits its eyebrow. Schema
uses adminHidden for hero/journal/newsletter eyebrow fields and the whole
featured copy group, preserving existing stored values without exposing controls
in contextual or legacy BO. Main titles, articles and subscription form remain.

Root owns changes in blog/ui/blog-listing.tsx, blog/ui/blog-post.tsx,
blog/ui/components/newsletter-signup.tsx, pages/schemas/blog.ts (under src/slices),
both slice READMEs and this handoff. Simple aesthetic L0 change in the main
workspace, clean base f371a9a. User validates localhost3071; no tests/automatic
QA, DB writes, migrations, push or deployment. Existing3071 listenerPID95629
belongs to this workspace. No commit requested in this follow-up.

## Latest checkpoint before clear —2026-11-01

User requested committing About changes before clearing context. Previous local
checkpoint:a4633ed; the new HEAD commit contains this checkpoint (read git log -1).
Workspace/main remains the delivery location. Latest change: About contact cards
now use audience-style PhotoFeatureGrid backgrounds/overlay, with optional
per-card image selectors in BO, preserved same-tab links/action labels and41
maximum media references. Seven About section eyebrows are hidden/preserved in
BO and removed publicly. Story uses50px top/70px bottom; the other six requested
sections use70px top/bottom. See about-contact-photo-cards.md and ADR0052.

Final Node22 typecheck/lint/build and14 focused About tests pass; lint has seven
existing unrelated warnings. No automatic visual QA or real BO image save/upload
against the remote DB. No DB/storage writes, migrations, push or deployment.
Pre-existing historical task environments/worktrees/cache backups are preserved.
No pending implementation work; next turn follows the next user request. The
deferred contact DB task remains deferred. Localhost3071 was last restarted as
Node22 pnpm dev, session52122/PID95629; verify current listener before acting.

## Working state and authorization

- Latest local commit request2026-11-01: user authorized committing the15-file
  aesthetic follow-up afterf70e75f: temporary service mosaic photos, hidden
  service/Guides labels and BO controls, service WhatsApp-button removal and
  section spacing. `git diff --check` passes; no new automatic tests/QA under
  the L0 agreement. Local delivery only, no push/deployment or database writes.

- Service mosaic follow-up after81200da: user requested restarting3071 and then
  committing this change locally. Restarted Node22 pnpm dev (session52122,
  listener PID95629) after stopping only this workspace's prior3071 process.
  Preserved old cache:/private/tmp/central-hill-dev-cache-service-mosaic-BgjB6Ptr/dev.
  No push/deployment. Details/checks:service-four-photo-mosaic.md.

-2026-11-01: user explicitly requested a local commit of all accumulated session
  work, including the preceding uncommitted Owners/Buildings/Real Estate changes
  and the Guests/Services follow-ups documented below. No push or deployment.
  Final aesthetic follow-ups have user-owned localhost review, with no new
  automatic tests/QA. Earlier functional checks apply only to their recorded
  candidates; no full final-tree QA approval is claimed. `git diff --check` passes.

- Workspace: `/Users/maxi/Documents/claude-workspace/central-hill`.
- Branch: `main`; session base `0d44203609ad250da945f960462d7bc55e13e779`.
- User explicitly requested a local commit of the session before `/clear`.
  No push, deployment, main merge or production release requested.
- Aesthetic work is L0: do not run automated tests or QA. User reviews localhost.
  Code changes and appropriate QA for other work are preauthorized; database
  changes and production actions require explicit user authorization. Sandbox
  restrictions still apply independently.
- Existing historical task worktrees/previews and their artifacts are preserved.

## Final implemented behavior

- About contact photo cards aftera4633ed: Let's Start a Conversation reuses
  PhotoFeatureGrid and the audience section's photo/overlay design, retaining
  per-card semantic links and action text. Each card has an optional BO image
  selector; media/preview validation includes its image, capacity41. Old content
  stays compatible; missing images use existing illustrative audience photos.
  No DB/storage writes or visual QA. See about-contact-photo-cards.md and ADR0052.

- About spacing aftera4633ed: Story keeps50px top and now70px bottom. Audiences,
  Values, Organisation, Certifications, Community and Contact each use70px top/
  bottom at all viewports, scoped to About. Aesthetic L0: user reviews3071;
  no tests/automatic QA, DB writes or commit.

- About section labels aftera4633ed: remove How We Started, Our Platform,
  What We Stand For (Values and Certifications), Our Structure, Our Responsibility
  and Get in Touch from section eyebrows. Hide/preserve the seven schema fields
  with adminHidden in contextual/legacy BO. Main section titles/content remain.
  Aesthetic L0: user reviews3071; no tests/automatic QA, DB writes or commit.

- Guides listing spacing afterf70e75f: city catalogue (e.g. Guides for Lisbon),
  Top Recommendations and closing Make It a Stay to Remember each use70px top/
  bottom at all viewports. Closing band overridden through a Guides-only wrapper.
  Aesthetic L0: user reviews3071; no tests/automatic QA, DB writes or commit.

- Guides additional labels afterf70e75f: remove “Local Favourites” from Top
  Recommendations and “Your Base in the City” from the closing CTA. Hide/preserve
  recommendations.eyebrow and final_cta.eyebrow in BO using adminHidden.
  Aesthetic L0: user reviews3071; no tests/automatic QA, DB writes or commit.

- Guides listing labels afterf70e75f: remove “More cities coming as Central
  Hill grows.” from the city filter and “Explore” from catalogue headings.
  Hide/preserve city_filter.note and catalogue.eyebrow via adminHidden in BO.
  Aesthetic L0: user reviews3071; no tests/automatic QA, DB writes or commit.

- Service enquiry button follow-up afterf70e75f: remove the Ask on WhatsApp
  booking-card action from every service detail. Hide/preserve its whatsappCta
  override in BO through SERVICE_HIDDEN_COPY_KEYS. Primary request actions
  remain. Aesthetic L0: user reviews3071; no tests/automatic QA or DB writes.

- Service detail spacing afterf70e75f: content/booking DetailLayout uses70px
  bottom padding, scoped important override of its shared responsive default.
  Enquiry (e.g. Request Babysitting) and Other Guest Services each use70px top/
  bottom at every viewport. Aesthetic L0: user reviews3071; no automatic tests/
  QA, database writes or commit.

- Service detail label removal afterf70e75f: hide About this service/experience,
  What's included, Options, Rates, Our Partners, Good to know, Add This to Your
  Stay and More Ways We Can Help. Remove their eyebrow props and BO copy fields
  (including section-specific controls), preserving stored overrides/schema
  compatibility and section titles/content. Itinerary labels remain available.
  Aesthetic L0: user reviews3071; no tests/automatic QA, DB writes or commit.

- Service detail category follow-up afterf70e75f: hide the category eyebrow
  above each service title, e.g. Arrival & Transfers. It is the same shared
  Services category used by the listing-card pill, chosen in the service BO
  category selector. Preserve category management and card labels. Aesthetic L0:
  user reviews3071; no tests/automatic QA, DB writes or commit.

- Service mosaic temporary photos follow-up afterf70e75f: user now requests
  Pexels images to complete missing positions, overriding available-only layout.
  Renderer fills up to4 with sample photos (same source assets as existing site
  placeholders); actual uploaded images take precedence. No DB/storage writes.
  BO guidance updated EN/PT/ES/FR. Aesthetic L0: no automatic tests/QA or commit.

- Service detail mosaic follow-up after81200da,2026-11-01: all service details
  now cap the header mosaic at4 photos (cover large left, first gallery photo
  wide top right, next two below). Extras remain in Show all photos. User chose
  available-only layouts until missing photos are uploaded, without repeating/
  stock photos. BO explicitly labels the four roles and existing gallery upload/
  reorder controls. Node22 typecheck/lint/build and36 focused tests pass; read-only
  browser check covers all10 published services and Sintra at390px. No schema/
  DB/storage changes or visual QA. See service-four-photo-mosaic.md.

- Services closing CTA follow-up2026-11-01: remove “Planning your stay?” from
  public output and hide/preserve final_cta.eyebrow in contextual/legacy BO.
  “Find your apartment, then we'll handle the rest” now has70px top/bottom
  padding at every viewport via its scoped wrapper. Aesthetic L0: user reviews
  localhost3071; no tests/automatic QA, database writes or commit.

- Services catalogue spacing follow-up2026-11-01: “Everything you need,
  beautifully arranged” section now uses70px top/bottom padding at every
  viewport. Scoped to the Services listing catalogue shell. Aesthetic L0:
  user reviews3071; no tests/automatic QA, database writes or commit.

- Services section removal follow-up2026-11-01: remove catalogue intro eyebrow
  “Guest Services & Experiences” and the full “How It Works / Arranged for you,
  end to end” section. Hidden/preserved schema fields: intro.eyebrow and the
  complete how_it_works object. Remove its BO layout card and public renderer/
  contract export. Main intro title/catalogue remain. Aesthetic L0: no tests/
  automatic QA, database writes or commit; user reviews3071.

- Services hero booking follow-up2026-11-01: add the navbar's localized Book Now
  label with Guests' ButtonLink styling and action spacing. Opens the exact
  English Avantio rentals URL in a new tab. User corrected the initial Guides
  destination before any Guides edits; Guides is unchanged. Aesthetic L0: user
  reviews3071; no tests/automatic QA, database writes or commit.

- Guests closing panels follow-up2026-11-01: remove “Guests” and “Owners”
  eyebrows above “Planning a Stay?”/“Own a Property?”. The shared local dualPanel
  schema hides both legacy eyebrow fields via adminHidden, preserving values
  without BO controls. Titles/body/buttons remain. Aesthetic L0: user reviews3071;
  no tests/automatic QA, database writes or commit.

- Guests card overlay follow-up2026-11-01: use PhotoFeatureGrid's optional overlay
  override to lighten the warm-dark scrim from15%/55%/82% to8%/35%/65% at0%/60%/100% height. Applies to
  Services and Guides carousel photos, retaining stronger shade behind lower
  text. About retains the original shared default. ADR0051. Aesthetic L0:
  user reviews3071; no tests/automatic QA or commit.

- Guests Guides carousel follow-up2026-11-01: “The Best of Portugal” now uses
  published guides/cities and localized title/intro/hero/slug values, with Settings
  template icons. Shares Services' six-card-group carousel and same-tab detail
  links; Discover More opens the full Guides listing. Old manual cards hidden/
  preserved; Guests BO links to Guides and keeps section heading/intro/CTA fields.
  Node22 typecheck/lint/build and11 focused tests pass. Read-only functional
  browser checks at1440px/390px pass6/2 paging, both controls and same-tab detail
  navigation. No DB/storage writes or visual QA. See guests-guide-catalogue spec.

- Guests Services catalogue follow-up2026-11-01: “Make the Most of Your Stay”
  now consumes published Services through the public contract, with live names,
  excerpts, category icons, covers, localized slugs and order. Groups of up to6
  cards use the shared Portfolio Carousel controls; links open service details
  in the same tab. Explore All Services opens the full listing, with its note
  below. Hide/preserve old manual card inputs; BO links to Services for edits.
  Node22 typecheck/lint/build and7 focused tests pass. Read-only desktop browser
  check passes6/4 grouping, both controls, same-tab detail navigation and helper
  placement. No DB/storage writes or automatic visual QA. See guests-service-catalogue spec.

- Guests hero booking follow-up2026-11-01: replace “Browse Our Apartments →”
  with the navbar's localized Book Now label (no arrow) and the exact English
  Avantio rentals URL in a new tab through ButtonLink. Hide/preserve the obsolete
  hero.cta editor object; its stored label/URL no longer control this button.
  Other Guests CTAs retain their destinations. Aesthetic L0: no tests/automatic
  QA, database writes or commit.

- Hero alignment correction2026-11-01, superseding the w-full follow-up below:
  user screenshots showed that w-full pushed Real Estate/Guests to the viewport
  edge. Removed it from both, restoring Real Estate's original Buildings-style
  centered shrink-fit wrapper. Guests' h1 now reserves the same26ch title width
  (bounded by available width); its inner text span alone is limited to20ch with
  balanced wrapping. This preserves the common inset while keeping Guests' two
  lines. Buildings untouched. Aesthetic L0: user reviews3071; no automatic QA,
  tests, database writes or commit.

- Guests/Real Estate hero alignment follow-up2026-11-01: both hero wrappers now
  explicitly use w-full within their shared1600px maximum and40px horizontal
  padding. This prevents flex shrink-to-content from moving their left edges
  according to title length. Guests retains its20ch balanced title; Real Estate
  retains26ch. Aesthetic L0: user reviews3071; no tests/automatic QA or commit.

- Guests hero headline follow-up2026-11-01: narrow its title from26ch to20ch
  and balance wrapping so the shorter “Where Every Stay Becomes a Story” forms
  two lines on desktop, with natural responsive wrapping and editable copy.
  Existing font size and hero layout retained. Aesthetic L0: user reviews3071;
  no tests/automatic QA, database writes or commit.

- Guests spacing follow-up2026-11-01: all eight content modules (Welcome, Why,
  Portfolio, Services, Activities, Reviews, FAQ and closing dual CTA) now use70px
  top/bottom section padding at every viewport. Shared sections are overridden
  through Guests-only wrappers. Hero/footer retain their existing spacing.
  Aesthetic L0: no tests/automatic QA, database writes or commit.

- Guests section eyebrows follow-up2026-11-01: remove “Best Price, Guaranteed”,
  “The Portfolio”, “Services”, “What to Do” and “Reviews” from public modules.
  Hide their five schema fields via adminHidden in contextual/legacy BO; preserve
  legacy values. Portfolio/testimonials pass showEyebrow=false without an explicit
  eyebrow to suppress shared fallbacks. Other pages and main titles unchanged.
  Aesthetic L0: no tests/automatic QA, database writes or commit.

- Guests submenu labels follow-up2026-11-01: header/drawer now show “Guest
  Services & Experiences” and “Top Things to Do & Recommendations” under Guests.
  Scoped child-label override covers default and DB-configured navigation using
  `settings.subnav.guests` EN/PT/ES/FR keys. Destinations remain/services and/guides.
  Aesthetic copy L0: no tests/automatic QA or DB writes. Commit left for later.

- Real Estate process gallery follow-up2026-11-01: reuses Owners' StepGallery
  with centered heading, numbered photo cards and original enquiry CTA below.
  Each step now has optional BO image/translated alt fields alongside editable
  title/description. Existing3–8 step identities and selected-locale workflows
  retained; local-media capacity21. Node22 typecheck/lint/build and7 focused
  adapter tests pass. No DB/storage writes or visual QA; user reviews3071.
  See `real-estate-process-gallery.md`.

- Real Estate Market Fundamentals follow-up2026-11-01: small two-image row above
  its heading, matching the full width of the three-stat strip. Both Pexels
  fallbacks can be replaced in BO, with independent alt text. Media capacity13;
  optional StatBento slot documented in ADR0049. Typecheck/lint/build and5 focused
  tests pass; no DB writes, real uploads/saves or aesthetic QA. See
  `real-estate-market-images.md`.

- Real Estate asset-type redesign2026-11-01: six image-backed cards with individual
  image/icon/title/description/alt editing in BO;3/2/1 responsive columns and70px
  vertical padding. New fields are optional, legacy side media hidden/preserved.
  See `real-estate-asset-cards.md` for code scope, checks and limits. Typecheck /
  lint / build and18 scoped tests pass; broader legacy assertions are documented.
  No database writes/uploads or automated aesthetic QA.

- Real Estate capabilities spacing follow-up2026-11-01: Institutional-Grade
  Management uses70px top/bottom padding through its scoped wrapper, preserving
  the single-column benefits. Aesthetic L0; no automatic tests/QA.

- Real Estate capabilities follow-up2026-11-01: Digital Excellence, Operational
  Mastery and Strategic Partnership now stack in a single column inside the text
  side of Institutional-Grade Management. The outer image/text layout remains
  two columns on desktop; override is scoped to #capabilities. Aesthetic L0;
  no automatic tests/QA.

- Real Estate spacing follow-up2026-11-01: Partners, Deal Structures, Portugal
  Market, Track Record, Process, FAQ and Partnership enquiry now use70px top/
  bottom padding at every viewport size, scoped to this page. Aesthetic L0;
  no automated tests/QA.

- Later building-detail apartments CTA follow-up: add the navbar's localized
  Book Now label to the right of the apartments heading (stacked on smaller
  screens), using its same English Avantio rentals destination and opening a
  new tab via ButtonLink. Aesthetic L0; no automatic tests/QA.

- Later building-detail apartments spacing follow-up: the apartments grid section
  now uses70px top/bottom padding on all building details and viewport sizes.
  Aesthetic L0; no automatic tests/QA.

- Later building-detail apartments follow-up: remove the fixed “Bookable Units”
  eyebrow above the apartments grid on all buildings/locales and its now-unused
  heading gap. This text never had an editable BO field; no admin control remains
  to hide. Aesthetic L0; no automatic tests/QA or database writes.

- Later building-detail follow-up: remove the complete “The Building” prose
  section (headline/intro/neighbourhood) from all detail pages and the BO card.
  Retain legacy values in editor state/payloads; allow hidden headline and intro
  to be empty so new-building creation has no invisible required fields.
  No database writes/migration. Aesthetic L0; no automatic tests/QA.

- Later submenu-clearance follow-up: Buildings listing, Real Estate, Guests,
  Services listing, Guides listing and About hero content wrappers now use60px
  top padding instead of40px (+20px). Horizontal/bottom remain40px. Scoped to
  those six renderers, with no shared Hero changes. Aesthetic L0; no automatic QA.

- Later Owners closing CTA follow-up: remove “Start Earning More Today” from
  public output and hide `final_cta.eyebrow` in contextual/legacy BO through
  existing adminHidden metadata. Legacy values remain preserved. Aesthetic L0;
  no automatic tests/QA or database writes.

- Later Buildings calculator media follow-up: in the desktop two-column layout,
  the form determines row height and the adjacent media fills that height, matching
  step1. Mobile stacked media keeps its4:5 frame. Aesthetic L0; no automatic QA.

- Later Buildings motion follow-up: remove only the catalogue's Reveal wrapper
  so building cards are visible from initial render. Other sections retain their
  existing entrance animations. Aesthetic L0; no automatic tests/QA.

- Later Buildings stats follow-up: “Numbers That Speak for Themselves” uses70px
  top/bottom padding through its reveal wrapper. Aesthetic L0; no automatic QA.

- Later Buildings owner-panel follow-up: replace its
  `pb-[clamp(64px,10vw,160px)]` with70px bottom padding. Aesthetic L0; no automatic QA.

- Later Buildings listing follow-up: the catalogue and earnings calculator,
  which inherited `py-[clamp(64px,10vw,160px)]`, now use60px top/bottom padding
  at every viewport. The override is local to these two sections. Aesthetic L0;
  no automatic tests/QA.

- Later Owners numbers follow-up: “Numbers That Speak for Themselves” now has
  70px top/bottom padding through its Owners wrapper. This supersedes the earlier
  note leaving that band's spacing unchanged. Aesthetic L0; no automatic QA.

- Later Home follow-up: “A Trusted and Leading Company” (stats band) uses70px
  bottom padding through its Home wrapper; top padding retains its existing
  value. No shared StatBand change. Aesthetic L0; no tests or automated QA.

- Later Owners spacing follow-up: Why, Everything handled, Plans, Growth path,
  Dashboard, Testimonials, FAQ and closing CTA each use70px top/bottom padding
  at every viewport size. Overrides are scoped to the eight Owners wrappers,
  following Home's existing descendant-section utility pattern. Shared component
  defaults, hero and numbers band are unchanged. Aesthetic L0; no automated QA.

- Later visual follow-up: shared TestimonialsMarquee quote text reduced10%,
  from1.25rem (20px) to1.125rem (18px), for every consuming page and locale.
  Quote content, stars and author text remain intact. Aesthetic L0; user reviews
  localhost, no automated tests or QA for this adjustment.

- Feature backgrounds use `linear-gradient(90deg, #4c3d32 0%, #926c52 100%)`
  through shared `bg-feature`. Solid fallback is `#4c3d32`.
- Navbar always uses that opaque gradient. Full-width submenus use it too, with
  white text and white hover/focus underlines. Light language popovers and the
  mobile drawer retain their own palettes.
- Booking opens `https://www.centralhill.pt/en/rentals/holidays-rentals-rentals-d0/`
  in a new tab on desktop and mobile.
- Desktop Earn With Us sits below the user/contact/language controls. Final base
  dimensions: **140 × 100px**, top padding **30px**, bottom radii **70px**.
  It links to Owners in the current locale. The tab and navbar share gradient
  width/coordinates, measured by HeaderScroll; earlier separate-color attempts
  are superseded.
- When a header submenu opens, the tab stretches by that submenu's measured
  height and gains the same additional top padding. Its top remains attached to
  the navbar. It retracts on close. This also covers Owners' pinned submenu.
  Reduced-motion preferences disable the transition.
- Home hero headline font size reduced 20%:
  `clamp(2.2rem,5.6vw,4.4rem)` instead of `clamp(2.75rem,7vw,5.5rem)`.
- Home spacing: guests showcase 70px top/bottom (important utility needed to
  override existing compact inline padding); portfolio 70px top; services
  carousel 70px top/bottom; closing dual CTA 70px top and **0px bottom**.
- Entire Home closing Owners/Guests grid, including photos, now sits in a
  centered 1240px shell with 28px side padding, matching Services. Earlier
  viewport-sized padding applied only to panel text was removed.
- The small “Partners & Services” eyebrow is removed from public output and BO.
  Its legacy JSON field remains hidden/preserved for compatibility. The main
  “Central Hill Partners and Services” heading stays editable and visible.
- Footer now shows office address, bookings phone, check-in phone and email with
  phone/mail icons and EN/PT/ES/FR labels, using existing Settings fields.
  `checkin_phone` already exists in schema/BO; blank hides the check-in row.
  The no-settings fallback address is Rua da Bempostinha 21A, 1150-065 Lisboa.
  Configured values always take precedence. Existing WhatsApp/social links remain.
- Owners `#numbers` now passes a title into the same StatBand used by Home.
  New optional translatable JSON field `stats_title` (max 160) is grouped with
  Numbers in both contextual and legacy BO layouts. Missing/blank defaults to
  localized “Numbers That Speak for Themselves”. No figures hides the title too.
  The field participates in existing per-locale draft/save/publish/translation
  machinery. No database schema migration is needed.

## Deferred database task — do not resume automatically

User asked to save image-supplied contact details through Neon MCP, then said
“dejemos eso para luego”. **No SQL or database writes occurred.** Values:

- Office: Rua da Bempostinha 21A, 1150-065 Lisboa.
- Bookings: +351 910 075 725.
- Check-in: +351 912 310 632.
- Email: info@centralhill.pt.

Neon MCP tools were not exposed when attempted. A temporary protocol helper at
`/private/tmp/central-hill-footer-mcp.py` returned HTTP 401 using local CLI auth.
Neon CLI session refresh/listing reached an organization-selection prompt; no
project/branch was selected or changed and no database query was run. The user
deferred the task. Re-discover current tools/auth only if the user resumes it.
Never print credentials. `.env.local` points to a remote Neon database, not an
isolated QA database; do not treat localhost as a safe synthetic DB.

## Preview and cache behavior

- Preview URL: `http://localhost:3071/en`; Owners `/en/owners`, BO `/admin`.
- Last read-only listener check before this commit: node PID **85909** on 3071.
  Process IDs/session handles may change; inspect before stopping anything.
- Uses Node 22 and `pnpm dev --port 3071` in this workspace.
- Next development cache repeatedly served earlier CSS despite source changes.
  Restarting alone sometimes retained it. On user-requested restarts, stop only
  this preview, move `.next/dev` to a unique `/private/tmp/central-hill-dev-cache-*`
  backup (preserve it), then restart. Previous backups are retained.
- Latest server start tool session was **4833**, but environment/session may
  have changed since. Do not assume it still identifies the current process.
- Last local restart preceded several later changes (services eyebrow, footer,
  Owners title and closing grid width). If the user sees stale output, a fresh
  cache/restart may be necessary. Do not claim latest changes were browser-tested.

## Verification and limits

- No tests or automatic QA were run after the user's L0 clarification.
- Before that clarification, on the early feature-gradient candidate only:
  typecheck and lint exited 0 (seven existing warnings), Next `compile` mode
  exited 0 (not a complete prerendered build), isolated CSS fixture checked
  gradient/hover at 1440px and 390px. Those checks do not cover the final commit.
- Later read-only debugging confirmed stale served CSS and that regenerating
  the development cache exposed new submenu rules. This is not a full browser
  or persistence QA claim. User reviewed visual changes incrementally.
- No migration, database write, push or deployment in this session.
- Console hydration warning for body attribute `cz-shortcut-listen="true"` was
  absent from source and attributed to browser-extension injection; no code was
  added to suppress it. Private-window/extensions-disabled check was suggested.

## Files and design decisions

Main code: `src/app/globals.css`; core `dual-cta-panels.tsx`, `footer.tsx`;
settings `defaults.ts`, `ui/site-header.tsx`, `ui/site-footer.tsx`,
`ui/components/header-scroll.tsx`; pages Home/Owners renderers, Home/Owners
schemas, services carousel, contextual grouping and legacy layout;
`messages/{en,es,pt,fr}.json`.

ADRs 0041–0044 record the feature gradient, navbar/tab, closing section width and
footer contact changes. Owners heading note:
`docs/specs/owners-numbers-heading.md`. AGENTS, data model, design system and
slice READMEs were updated. Temporary cache backups, screenshots and MCP helper
remain outside Git; `.env.local` and credentials are not included.

To resume: read this handoff and AGENTS, inspect `git status` and latest commit,
then follow the next user instruction. No outstanding mandatory implementation
work is being claimed; contact persistence remains explicitly deferred.
