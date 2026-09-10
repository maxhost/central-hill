# Spec — Wire the Guests page (`/[locale]/guests`) to the backoffice

> **Slice:** `pages` (S9) · **Page key:** `guest` · **Route:** `src/app/[locale]/guests/page.tsx`
> **Status:** ✅ IMPLEMENTED (2026-09-10) · **Migration:** `0012` (applied)
> All nine sections are DB-driven; `typecheck`, `lint`, the 13 slice tests and a full
> production build are green, and `/[locale]/guests` prerenders in all four locales.
> **Pattern reference:** `src/slices/pages/ui/real-estate-page.tsx` (most recent DB-wired page)

---

## 1. Goal & scope

Make every piece of content on the public Guests page editable from `/admin/pages/guest`,
plus pull the two collection-backed sections (featured properties, guest reviews) from their
owning slices — without changing the approved visual baseline (`mock/guest.html`) beyond the
two deviations listed in §11.

**In scope:** the `guest` page schema, a data migration, the renderer, three small prop
additions to shared S9 components, the route's metadata, and the demo seed.

**Out of scope** (do not do it in this task): the lead-capture forms, the About page, the
blog/services/guides listings, a `guides` admin, and per-page SEO overrides. See §13.

---

## 2. Current state (verified)

- `src/slices/pages/schemas/guest.ts` **already defines** a full `guestSchema`
  (hero, welcome, why, services_teaser, activities_teaser, faq_group_key).
- `src/slices/pages/ui/guest-page.tsx` calls `getGuestPage(locale)` but reads **only**
  `page?.content.faq_group_key`. Everything else is a static HTML template string.
  Every other field the admin can edit today is dead data.
- The page renders a **fake** featured property card that links to `/{locale}/buildings/sample`,
  three hardcoded testimonials, and a dual-CTA band with the phone number and email written
  by hand.
- `revalidatePage("guest")` already maps to `/{locale}/guests` in
  `src/slices/pages/server/publish.ts`. **No revalidation work is needed.**
- The Iconoir icon font is loaded globally by `src/app/mock.css`, so `icon_key` values can be
  rendered directly as `iconoir-<key>` on this page.
- `scripts/seed-demo.ts` seeds a `guest` row whose copy is generic placeholder text and whose
  `icon_key`s are `"spark"` / `"bell"` (not real Iconoir names).

---

## 3. Section → data source map (target state)

| # | Section | Source after this task |
|---|---|---|
| 1 | Hero | `guest.hero` + `media[hero.video_media_id]`, fallback video/poster in code |
| 2 | Welcome | `guest.welcome` + `media[welcome.image_media_id]`, fallback photo in code |
| 3 | Why book directly | `guest.why` (4 icon cards) |
| 4 | Portfolio | **buildings slice** via `FeaturedPortfolio`; headings/CTA from `guest.portfolio` |
| 5 | Services teaser | `guest.services_teaser` (6 icon cards) |
| 6 | What to do teaser | `guest.activities_teaser` (6 icon cards) |
| 7 | Testimonials | ✅ **DONE** — **testimonials slice** via `TestimonialsRow` with `audience="guest"`; heading from `pages.reviews.titleGuests` |
| 8 | FAQ (optional) | **faq slice** via `guest.faq_group_key` — already wired, leave as is |
| 9 | Dual CTA | copy from `guest.dual_cta`; phone / email / WhatsApp from **settings** `getGlobals(locale)` |

---

## 4. Schema changes — `src/slices/pages/schemas/guest.ts`

### 4.1 Move `optionalImage` into `_shared.ts`

`optionalImage` currently lives unexported in `schemas/home.ts`. Move it verbatim to
`schemas/_shared.ts`, export it, and import it in `home.ts`. **The resulting shape of
`homeSchema` must not change** — this is a pure relocation so `translatablePathsByPage.home`
stays byte-identical.

```ts
// _shared.ts
/** An image reference that may be left unset ("" = no asset yet → renderer falls back). */
export const optionalImage = (hint: string) =>
  z.union([z.literal(""), mediaId]).describe(hint);
```

### 4.2 New and widened fields

```ts
const HERO_VIDEO_HINT =
  "Hero background video (MP4, H.264). Landscape 16:9 — 1920×1080, under 8 MB. Leave blank to use the approved stock clip.";
const WELCOME_IMG_HINT =
  "Welcome section photo. Portrait-ish 4:5 or 1:1 — recommended 1200×1200px, JPG or WebP, under 500 KB.";

/** One side of the closing two-column CTA band (the mock's `.dual`). No image. */
const dualPanel = z.object({
  eyebrow: tStrOpt({ max: 60 }),
  title: tStr({ max: 160 }),
  body: tStr({ max: 400 }),
  cta: cta,
});

export const guestSchema = z.object({
  hero: z.object({
    video_media_id: optionalImage(HERO_VIDEO_HINT),   // WIDENED: was `mediaId` (required uuid)
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    cta: cta,
  }),
  welcome: z.object({
    headline: tStr({ max: 160 }),
    lede: tStr({ max: 400 }),
    copy: tStr({ max: 1200 }),
    guarantee_label: tStrOpt({ max: 120 }),
    image_media_id: optionalImage(WELCOME_IMG_HINT),  // WIDENED: was `mediaId`
  }),
  why: z.object({
    eyebrow: tStrOpt({ max: 80 }),                    // NEW
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    benefits: fixed(iconCard, 4),
    cta: ctaWithNote,
  }),
  portfolio: z.object({                               // NEW SECTION (headings only)
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    cta: ctaWithNote,
  }),
  services_teaser: z.object({
    eyebrow: tStrOpt({ max: 80 }),                    // NEW
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    items: fixed(iconCard, 6),
    cta: ctaWithNote,
  }),
  activities_teaser: z.object({
    eyebrow: tStrOpt({ max: 80 }),                    // NEW
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    items: fixed(iconCard, 6),
    cta: ctaWithNote,
  }),
  // NOTE: no `testimonials` block. Client direction (2026-09-10): the reviews section is
  // managed entirely from /admin/testimonials, and its heading is i18n chrome
  // (`pages.reviews.titleGuests`), so nothing about it belongs in the page schema.
  dual_cta: z.object({                                // NEW — guest panel first, matching the mock
    guest: dualPanel,
    owner: dualPanel,
  }),
  faq_group_key: faqGroupKey,
});
```

### 4.3 Consequences to handle

1. **`translatablePathsByPage.guest` grows.** The translation pipeline picks the new leaves up
   automatically. Existing `pt/es/fr` rows stay valid; new paths render the source `en` value
   until translated. No migration needed for `translation`.
2. **`cta.url` is `z.url()` — an empty string fails validation.** New required CTA blocks must
   be backfilled with real absolute URLs by migration `0012`, otherwise the first save from
   `/admin/pages/guest` rejects with a field error. This is existing platform behaviour, not a
   regression; do not relax the primitive (that is a kernel change and needs an ADR).
3. **`scripts/seed-demo.ts` calls `guestSchema.parse(guestData())`.** `guestData()` must gain
   `portfolio`, `dual_cta` and the new eyebrows, or the seed throws on a fresh DB. Use the same
   copy as the migration.

---

## 5. Migration `drizzle/0012_guest_page_db_wiring.sql`

Additive and idempotent. Guarded on the presence of the new `portfolio` key, so it applies
exactly once and is a no-op on re-run (same technique as `0009`).

```sql
-- Guests page becomes fully DB-driven (slice `pages`, key 'guest').
-- Rewrites `page_content.data` for the guest row with the copy of the approved
-- `mock/guest.html` baseline, adds the new `portfolio` / `dual_cta` blocks and the
-- per-section eyebrows, and replaces the demo seed's placeholder `icon_key`s
-- ("spark"/"bell") with real Iconoir names.
--
-- Guard: `NOT (data ? 'portfolio')` — the key does not exist in any row today, so this
-- fires exactly once and is a no-op afterwards. Safe because the Guests page ignored the
-- DB entirely until this change, so nothing authored through the admin was ever live.
-- The INSERT guarantees a row exists, otherwise the wired renderer would 404 (see §6).

INSERT INTO "page_content" ("key", "data")
VALUES ('guest', '{}'::jsonb)
ON CONFLICT ("key") DO NOTHING;

UPDATE "page_content"
SET "data" = $guest$
{
  "hero": {
    "video_media_id": "",
    "eyebrow": "For Guests · Portugal",
    "headline": "Where Every Stay Becomes a Story",
    "subheadline": "Handpicked, professionally managed apartments in the heart of Portugal's most captivating destinations.",
    "cta": { "label": "Browse Our Apartments", "url": "https://www.centralhill.pt/en/buildings" }
  },
  "welcome": {
    "headline": "Welcome to Central Hill",
    "lede": "Every city has a soul — and we'll help you find it.",
    "copy": "At Central Hill, we handpick properties in the heart of Portugal's most captivating destinations, so you wake up where the culture, the food, and the people are. Our team is with you from the first message to the last goodbye.",
    "guarantee_label": "Book directly with us for the best price, guaranteed",
    "image_media_id": ""
  },
  "why": {
    "eyebrow": "Best Price, Guaranteed",
    "headline": "Why Book Directly With Us?",
    "intro": "Book direct and unlock perks you won't get on the big platforms — better prices, more flexibility, and personal care.",
    "benefits": [
      { "icon_key": "percentage-circle", "title": "Get the Best Prices", "description": "You won't find our apartments cheaper anywhere else — enjoy an average saving of €213 per reservation versus Airbnb, Booking and other platforms." },
      { "icon_key": "key", "title": "Early Check-In", "description": "Enter the apartment sooner than everyone else and start your trip the moment you arrive. (Pending availability.)" },
      { "icon_key": "suitcase", "title": "Early Luggage Drop", "description": "Arriving before check-in time? We can let you drop your luggage at the apartment early, hands-free." },
      { "icon_key": "gift", "title": "Special Discounts", "description": "Enjoy exclusive discounts on services and activities booked with us during your stay." }
    ],
    "cta": { "label": "Browse Our Apartments", "url": "https://www.centralhill.pt/en/buildings", "note": "View the full portfolio of available apartments across Portugal." }
  },
  "portfolio": {
    "eyebrow": "The Portfolio",
    "headline": "Explore Our Portfolio",
    "intro": "Carefully selected properties across Portugal's most iconic locations — each chosen for its character and exceptional guest experience.",
    "cta": { "label": "View All Properties", "url": "https://www.centralhill.pt/en/buildings", "note": "Browse our full portfolio across Portugal." }
  },
  "services_teaser": {
    "eyebrow": "Services",
    "headline": "Make the Most of Your Stay",
    "intro": "We go beyond accommodation. From the moment you land to every adventure in between, our team is here to make your Portugal experience unforgettable.",
    "items": [
      { "icon_key": "car", "title": "Private Transfers", "description": "Seamless airport and city transfers, ready the moment you land." },
      { "icon_key": "binocular", "title": "Day Tours", "description": "Guided escapes to Portugal's most iconic sights and hidden corners." },
      { "icon_key": "sea-waves", "title": "Boat Trips", "description": "See the coastline and the Tagus from the water on a private cruise." },
      { "icon_key": "swimming", "title": "Surf Experience", "description": "Catch your first wave with expert local instructors on Atlantic beaches." },
      { "icon_key": "pizza-slice", "title": "Chef at Home", "description": "A private chef cooks Portuguese flavours right in your apartment." },
      { "icon_key": "suitcase", "title": "Luggage Storage", "description": "Drop your bags and explore freely before check-in or after checkout." }
    ],
    "cta": { "label": "Explore All Services", "url": "https://www.centralhill.pt/en/services", "note": "See details, pricing, and availability." }
  },
  "activities_teaser": {
    "eyebrow": "What to Do",
    "headline": "The Best of Portugal",
    "intro": "Whether you're exploring a vibrant city, a medieval village, or a stunning coastline — Portugal never runs out of extraordinary things to discover.",
    "items": [
      { "icon_key": "bank", "title": "Explore Historic Districts", "description": "Wander cobblestone streets and timeless neighbourhoods full of character." },
      { "icon_key": "medal", "title": "Visit UNESCO World Heritage Sites", "description": "From Sintra's palaces to centuries-old monuments and town centres." },
      { "icon_key": "pizza-slice", "title": "Taste Portuguese Food & Wine", "description": "Pastéis de nata, fresh seafood, and world-class wine regions await." },
      { "icon_key": "sea-waves", "title": "Relax on Stunning Beaches", "description": "Golden sands and dramatic Atlantic coastline, never far away." },
      { "icon_key": "music-double-note", "title": "Experience Music & Festivals", "description": "Fado nights, summer festivals, and a year-round cultural calendar." },
      { "icon_key": "map", "title": "Day Trips & Hidden Gems", "description": "Medieval villages and lesser-known spots just beyond the city." }
    ],
    "cta": { "label": "Discover More", "url": "https://www.centralhill.pt/en/guides", "note": "" }
  },
  "dual_cta": {
    "guest": {
      "eyebrow": "Guests",
      "title": "Planning a Stay? Find your perfect apartment.",
      "body": "Browse our full portfolio of professionally managed apartments across Portugal's most sought-after locations — studios to 8-bedrooms, for every type of stay.",
      "cta": { "label": "Browse Our Apartments", "url": "https://www.centralhill.pt/en/buildings" }
    },
    "owner": {
      "eyebrow": "Owners",
      "title": "Own a Property? Start earning more.",
      "body": "Find out what your property could earn with a free, no-obligation profitability analysis. Our team will assess your property and come back within 48 hours.",
      "cta": { "label": "Get Your Free Earnings Estimate", "url": "https://www.centralhill.pt/en/owners" }
    }
  },
  "faq_group_key": ""
}
$guest$::jsonb,
"updated_at" = now()
WHERE "key" = 'guest' AND NOT ("data" ? 'portfolio');
```

**Note on `faq_group_key`:** the migration writes `""` (no FAQ), preserving today's behaviour.
If the guest row already had a group bound, this rewrite clears it — check the live row before
applying and adjust the literal if needed.

**Note on translations:** a full rewrite of `data` changes the source strings, so any existing
`pt/es/fr` translations for `page_content`/`guest` become stale. They are not deleted; the
translation pipeline flags them via `source_hash`. Expect a review pass in `/admin/translations`.

---

## 6. Renderer — `src/slices/pages/ui/guest-page.tsx`

### 6.1 Structure

Three `.mk` HTML chunks with React islands between them, exactly like `owners-page.tsx`:

```
<div className="mk" data-page="guests">   <style/>  bodyTop(content, media, locale)   // hero · welcome · why
<FeaturedPortfolio …/>                                                                // white band
<div className="mk" data-page="guests">   bodyMid(content, locale)                     // services (.alt) · what-to-do
<TestimonialsRow audience="guest" …/>                                                 // .alt band
<FaqSection …/>  (only when faq_group_key is set)
<div className="mk" data-page="guests">   dualCta(content, globals, locale)            // white band
```

This preserves the mock's alternating `.alt` rhythm. `FaqSection` renders on white, so the
FAQ and the dual-CTA sit on two adjacent white bands — acceptable, and only visible when a
FAQ group is bound (today: none).

### 6.2 Required behaviours

- **Copy the `esc` / `escAttr` helpers** from `real-estate-page.tsx` verbatim. Every
  admin-authored string interpolated into an HTML template string **must** go through them.
  Anything placed in an attribute uses `escAttr`.
- **`notFound()` when the page row is missing**, matching `owners-page.tsx` and
  `real-estate-page.tsx`. Migration `0012` guarantees the row exists.
- **Icons.** Render `icon_key` as an Iconoir class:
  ```ts
  const iconClass = (k: string) =>
    /^[a-z0-9-]+$/.test(k) && k.length <= 64 ? `iconoir-${k}` : "iconoir-sparks";
  ```
  Emitted as `<i class="ico ${iconClass(c.icon_key)}" aria-hidden="true"></i>`.
- **`welcome.copy` is multi-paragraph.** Split on `/\n{2,}/`, emit one `<p>` per block, drop
  empty blocks.
- **Optional fields render nothing when blank.** `eyebrow`, `intro`, `subheadline`,
  `guarantee_label`, and CTA `note` are all optional — wrap each in a
  `${x ? \`…\` : ""}` guard, never emit an empty `<span>` or `<p>`.
- **Media fallbacks.** Keep the current mock URLs as `const` fallbacks and prefer the resolved
  asset:
  ```ts
  const heroVideo = media[content.hero.video_media_id ?? ""]?.url ?? HERO_FALLBACK_VIDEO;
  const welcomeImg = media[content.welcome.image_media_id ?? ""]?.url ?? WELCOME_FALLBACK_IMG;
  const welcomeAlt = media[content.welcome.image_media_id ?? ""]?.alt || WELCOME_FALLBACK_ALT;
  ```
- **CTA arrows** stay in the markup (`${esc(cta.label)} →`), as on the Owners page. Labels are
  stored without the arrow.
- **Locale-aware links.** Stored CTA URLs are absolute and `/en/`-prefixed (the schema requires
  `z.url()`, so relative paths cannot be stored). Add a small local helper so a Portuguese
  visitor is not sent to the English route:
  ```ts
  /** Rewrite an own-site `/en/…` link to the active locale. External links pass through. */
  function localizeUrl(raw: string, locale: Locale): string {
    try {
      const u = new URL(raw);
      if (!/(^|\.)centralhill\.pt$/.test(u.hostname)) return raw;
      u.pathname = u.pathname.replace(/^\/(en|pt|es|fr)(?=\/|$)/, `/${locale}`);
      return u.toString();
    } catch {
      return raw;
    }
  }
  ```
  Apply it to every CTA `url` on this page. Keep it local to `guest-page.tsx` for now; see §11.

### 6.3 Dual CTA contact lines

Read the settings singleton through the slice contract (allowed, cross-slice via `contract.ts`):

```ts
import { getGlobals } from "@slices/settings/contract";
```

Build the two lines exactly as `dual-cta.tsx` does, so the phone/email/WhatsApp become
editable in `/admin/settings`:

- guest panel: `` `${globals.phone} · ${globals.email}` ``
- owner panel: `[phone, email, whatsapp && \`WhatsApp ${whatsapp}\`].filter(Boolean).join(" · ")`

When `getGlobals` returns `null`, render no contact line. The mock's `Bookings` / `Call`
prefixes are dropped so no new i18n keys are needed for four locales.

---

## 7. Shared component changes (same slice, backwards compatible)

All three take **optional** props with the current i18n values as defaults, so Home and Owners
render byte-identically.

### `ui/components/featured-portfolio.tsx`
```ts
{ locale, showEyebrow = true, eyebrow, title, intro, ctaLabel, ctaNote, ctaHref }
```
- `eyebrow ?? (showEyebrow ? t("portfolio.eyebrow") : undefined)`
- `title ?? t("portfolio.title")`, `intro ?? t("portfolio.intro")`
- `ctaLabel ?? t("portfolio.viewAll")`, `ctaHref ?? \`/${locale}/buildings\``
- `ctaNote` is new; render it under the button only when present.
- **Unchanged:** returns `null` when there are no featured buildings. On the Guests page that
  means the whole portfolio section disappears if nothing is flagged `is_featured`. Accept it
  and note it in the slice README.

### `ui/components/testimonials-row.tsx` — ✅ DONE
```ts
{ locale, audience, showEyebrow = true, eyebrow, title }
```
Same precedence rule. The Guests page passes `audience="guest"` and
`title={t("reviews.titleGuests")}`. Home and Owners pass neither and render unchanged.

### `ui/components/faq-section.tsx`
No change.

---

## 8. Route — `src/app/[locale]/guests/page.tsx`

- Replace the hardcoded English `title` / `description` in `generateMetadata` with the existing
  localized keys, which already exist in all four message files:
  `t("guests.metaTitle")` and `t("guests.metaDescription")` under the `pages` namespace.
  Copy the precedent in `src/app/[locale]/page.tsx:26`, which already does
  `const t = await getTranslations({ locale, namespace: "pages" })` inside `generateMetadata`.
- Update the stale comment `/** Static per locale. Content is the embedded mock (no DB). */`.
- Leave `revalidate = 3600` and `generateStaticParams` as they are.

Per-page SEO overrides stored in the DB (`seo{meta_title, meta_description}` + using
`PageResult.ogImage`) are **deliberately not part of this task** — no fixed page does that yet,
and introducing it here would set a cross-page precedent. See §13.

---

## 9. i18n

One key was added for the testimonials heading — `pages.reviews.titleGuests`, present in all
four message files (✅ done). No other message keys are required. Verify the four files still
parse and that `pages.guests.metaTitle` / `metaDescription` exist in `en`, `pt`, `es`, `fr`
(they do today).

All newly editable strings live in `page_content.data` (source `en`) and reach other locales
through the `translation` table, not through the message files.

---

## 10. ISR / revalidation

Nothing to build. `savePage("guest", …)` already calls `revalidatePage("guest")`, which busts
the `page:guest` tag and revalidates `/{locale}/guests` for all four locales. The two embedded
islands subscribe transitively to `building-list` and `testimonial-list`, so publishing a
building or a testimonial refreshes the Guests page automatically.

**Verify after implementing:** edit a field in `/admin/pages/guest`, save, and confirm the
public page reflects it without a redeploy.

---

## 11. Risks & decisions

| # | Item | Decision |
|---|---|---|
| 1 | Migration rewrites the whole `guest` row | Accepted. The page ignored the DB until now, so no live content is lost. Guarded so it runs once. **Check the live row's `faq_group_key` before applying.** |
| 2 | Portfolio becomes the Home carousel, not the mock's 3-card grid | **Deviation from `mock/guest.html`.** Chosen for real data plus consistency with Home, which the client already approved. Reversible: build `.pcard` markup from `getFeaturedBuildings` instead. |
| 3 | Testimonials become the shared marquee, not the mock's 3-card grid | **Deviation from `mock/guest.html`, confirmed by the client on 2026-09-10 and already implemented.** |
| 4 | Empty CTA `url` fails validation | By design. Migration backfills real URLs. Do not relax `cta.url` — that is a kernel change requiring an ADR. |
| 5 | `localizeUrl` is a page-local workaround | The real fix is allowing relative CTA paths in `core/validation/primitives`, which needs an ADR. Raise it separately; do not change the kernel here. |
| 6 | Existing `pt/es/fr` translations for `guest` go stale | Expected. Flagged by `source_hash`; resolve in `/admin/translations`. |
| 7 | No featured buildings ⇒ no portfolio section | Accepted and documented. Seeded data flags six buildings as featured. |

---

## 12. Files touched (ownership check — golden rule 1)

All inside the `pages` slice, plus the route shell, the migration, and the seed script.
**No file owned by another slice, and nothing in `src/core/`.**

```
src/slices/pages/schemas/guest.ts          (rewrite schema)
src/slices/pages/schemas/_shared.ts        (export optionalImage)
src/slices/pages/schemas/home.ts           (import optionalImage — shape unchanged)
src/slices/pages/ui/guest-page.tsx         (rewrite renderer)
src/slices/pages/ui/components/featured-portfolio.tsx   (optional props)
src/slices/pages/ui/components/testimonials-row.tsx     (optional props — ✅ done)
messages/{en,pt,es,fr}.json                (pages.reviews.titleGuests — ✅ done)
src/slices/pages/README.md                 (document the guest page's sources)
src/slices/pages/tests/pages.test.ts       (add guest coverage — see §14)
src/app/[locale]/guests/page.tsx           (localized metadata + comment)
drizzle/0012_guest_page_db_wiring.sql      (new, additive, guarded)
scripts/seed-demo.ts                       (guestData() gains the new blocks)
```

`docs/data-model.md` → "Page content model → guest" must be updated to list the new blocks and
to record that portfolio/testimonials/dual-CTA contact are composed, not stored.

---

## 13. Explicitly out of scope

These are real gaps on this page but belong to separate tasks:

1. **Lead capture.** The Guests page has no form, so nothing to wire here. The inert forms on
   Owners, Real Estate, About and Blog are a separate task.
2. **Per-page SEO overrides** (`meta_title` / `meta_description` / OG image from the DB).
   Needs a decision applied to all five fixed pages at once.
3. **About page**, **blog / services / guides listings**, **guides admin**.
4. Relaxing `cta.url` to accept relative paths (ADR required).

---

## 13b. Implementation notes (things the spec did not anticipate)

Three snags surfaced while applying this; all are fixed, but they matter for the next page.

1. **`drizzle/meta/_journal.json` ordering — the actual root cause.** `drizzle-kit migrate` applies migrations whose
   journal `when` is greater than the newest already-applied one. `0011_mature_praxagora` has a
   `when` (1782233885128) **older** than `0010` (1783009807329), so anything after it is
   silently skipped — the first `pnpm db:migrate` reported success and changed nothing.
   `0012` was given `when` 1783010807329 so it sorts after `0010`. **Fixed properly since** —
   see `docs/specs/migration-journal-ordering-fix.md`: the journal is strictly increasing again,
   the ledger was backfilled for `0011`, and `pnpm db:check` guards against a repeat.
2. **`--> statement-breakpoint` was a red herring.** It was added to `0012` at the same time as
   the timestamp fix, so it looked like part of the cure. It was not: `0008` is a `DO` block plus
   three `UPDATE`s with no breakpoints, and all four statements demonstrably applied (the owners
   and real-estate rows carry their `faq_group_key`). `drizzle-kit migrate` connects over a
   websocket Pool, which accepts multi-statement query strings. The marker is still worth having
   because `drizzle-kit generate` always emits it and a driver change would silently drop every
   statement after the first — `pnpm db:check` now reports its absence as a warning, not an error.
   **The timestamp was the whole bug.**
3. **Deploy ordering.** Migration `0012` must run before this code ships, or prerendering
   `/[locale]/guests` throws on the missing `portfolio` / `dual_cta` blocks. A stale
   `.next/cache` from a pre-migration build reproduces the same failure locally — clear it.

---

## 14. Definition of Done

- [ ] `pnpm typecheck && pnpm lint` green.
- [ ] `pnpm test --filter pages` green, including new cases:
      `guestSchema.parse` accepts the migration's JSON verbatim;
      `translatablePaths(guestSchema)` includes `portfolio.headline`, `dual_cta.guest.title`
      and the new `*.eyebrow` leaves;
      it excludes `hero.video_media_id`, `welcome.image_media_id`, and `faq_group_key`.
- [ ] `git status` shows only the files listed in §12.
- [ ] Migration `0012` is new, additive, guarded, and re-runnable; no past migration edited.
- [ ] Every one of the nine sections renders from the DB or from the composed slice — no
      hardcoded marketing copy, phone number or email remains in `guest-page.tsx`.
      Grep must return nothing:
      `grep -nE "910 075 725|centralhill\.pt\"|buildings/sample" src/slices/pages/ui/guest-page.tsx`
- [ ] Every interpolated admin string passes through `esc` / `escAttr`.
- [ ] `/admin/pages/guest` renders all sections, saves without validation errors, and the
      public page updates after save (ISR check from §10).
- [ ] Visual diff against `mock/guest.html` shows only the two deviations in §11.
- [ ] `src/slices/pages/README.md` and `docs/data-model.md` updated.
- [ ] Adversarial review passed (boundaries + escaping + fallbacks).
