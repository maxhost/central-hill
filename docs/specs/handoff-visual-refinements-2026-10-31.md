# Local visual refinements — resume after context clear

## Working state and authorization

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
