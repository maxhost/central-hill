# Local visual refinements — resume after context clear

## Working state and authorization

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
