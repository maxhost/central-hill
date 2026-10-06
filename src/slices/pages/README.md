# Slice `pages` (S9)

The five **editable fixed marketing pages** — Home, Owners, Real Estate, About, and the
Guest landing — stored one row per `key` in `page_content`, each validated by a fixed
per-page Zod schema (ADR 0012 / `docs/data-model.md` → Page content model). This slice is
**pure composition**: it owns only its own page rows and resolves their [T] blocks + media,
then its UI embeds the dynamic/shared pieces through *other slices' contracts*. It holds **no
foreign tables**. See `docs/vertical-slices.md` → S9.

## Owns

**Table** (`schema.ts`, migrations `0000`, `0003`):
- `page_content` — `key (unique: home|owners|real_estate|about|guest), data jsonb
  (SOURCE-locale values, validated per `key`), og_image_media_id?`. Pages have **no
  draft/published state** (owner direction, `0003`): a row that exists is live.
  Target-locale [T] values live in the cross-cutting `translation` table with
  `entity_type='page_content'`, `field='block:<dot.path>'` (e.g. `block:owners.benefits.0.title`).

**Page schemas** (`schemas/`): one fixed Zod schema per page (`home`, `owners`, `real-estate`,
`about`, `guest`) composed from `_shared.ts` (`iconCard`, `assurance`, `step`, `titledItem`,
`faqGroupKey`, `serviceCategorySlug`, fixed/range array helpers). `schemas/index.ts` maps `key → schema` (`pageSchemas`) and derives
`translatablePathsByPage` (the [T] leaf paths the translation pipeline extracts). Repeating
groups are **fixed-count arrays** (e.g. exactly 6 benefits) — the admin form shows N slots.

## Contract (`contract.ts`)

Reads (all return `null` when the page row has not been authored):
- `getHomePage(locale)`, `getOwnersPage(locale)`, `getGuestPage(locale)`,
  `getRealEstatePage(locale)`, `getAboutPage(locale)`.

Each returns `PageResult<T> = { content, media, ogImage }`:
- `content` — the page's fixed schema with every [T] leaf resolved for the locale (approved
  target, else source `en`);
- `media` — `Record<mediaId, MediaImageData>` for every `*_media_id` referenced in `content`
  (hero videos read `.url`);
- `ogImage` — the optional social-card override.

Cache tag: `PAGE_TAGS.page(key)` = `page:<key>` (one singleton per page). Reads are
`unstable_cache`-wrapped. The **embedded** slice data (featured buildings, testimonials, faq,
settings) is fetched by the page-section components through those slices' own cached+tagged
queries, so a publish there busts the composed page automatically (Next associates a route's
full-route cache with every data-cache tag read during render) — this slice doesn't re-declare
those tags.

## UI

Page compositions (`ui/*-page.tsx`): `HomePage`, `OwnersPage`, `GuestPage`, `RealEstatePage`,
`AboutPage` — each fetches its `getXPage`, `notFound()`s when the row is missing, and lays the
page out from `content` + `media`. The shared page hero (full-bleed media band + editorial
headline) is `core/ui`'s `Hero` (ADR 0033 moved it there from this slice, `hero.tsx` → renamed
from `PageHero`) — both `HomePage` (video background) and `OwnersPage` (image background +
`aside` earnings-form card, `compact` headline) render it directly; and `OwnersPage`'s "why"
section is `core/ui`'s `EditorialSplit` (sticky headline + CTAs beside a hairline icon/title/
description list — new, built for this section; see its own docstring for why its entrance
animation is wired internally rather than at the call site, unlike every other animated piece
here). Neither is a `ui/components/` piece. Other shared pieces in `ui/components/`:
- presentational (`blocks.tsx`: `SectionHeading`, `FeatureGrid`, `Steps`, `CtaRow`, `Prose`,
  `Band`; `owner-estimate-form.tsx`: the Owners-hero earnings-estimate card, slotted into
  `Hero`'s `aside` — a self-contained client wizard on `core/ui`'s form-card primitives, still
  submitting nothing, see below). `OwnerEstimateForm` is exported via `contract.ts` so other
  slices can reuse the exact same wizard — Buildings' listing "earnings calculator" does,
  parameterizing only step 1's copy (steps 2/3 were already identical on both pages);
- data-composing (`stats-band.tsx` → settings, `testimonials-row.tsx` → testimonials,
  `featured-portfolio.tsx` → buildings, `services-carousel.tsx` → services, `faq-section.tsx`
  → faq, `lead-cta.tsx` → settings contact).

`services-carousel.tsx` (+ its `services-carousel-track.tsx` client island) is the Home
**services & partners** band (ADR 0032): the page's `services_carousel` block supplies the
heading and the three reassurance marks, while the cards are the published rows of slice
`services` (`listServices`, optionally narrowed by `service_category_slug`), ordered by their
admin `position` and capped at 12. It renders `null` when that block is absent (a `home` row
saved before the section existed) or when no published service matches.

`featured-portfolio.tsx` and `testimonials-row.tsx` take **optional** heading/CTA overrides
(`eyebrow`, `title`, `intro`, `ctaLabel`, `ctaNote`, `ctaHref`). **Home no longer renders either
of them** (ADR 0031); Owners passes none and keeps the shared `pages.portfolio.*` /
`pages.reviews.*` copy; the Guests page passes its
admin-authored `guest.portfolio` block and `pages.reviews.titleGuests`. Both render `null` when
the underlying slice has nothing published, so the section disappears rather than showing empty.

The **Owners** page (`owners-page.tsx`) is **DB-driven** (mock embedded 1:1, but every section now
reads its values from the owners `page_content` row). The **hero + earnings-form card are real
JSX**, not interpolated markup: `core/ui`'s `<Hero id="worth" compact aside={…}>` renders the
background image (`<MediaImage>`, falling back to the approved mock photo until an R2 asset is
set) + headline (`;`-joined phrases → one `<br/>`-separated line each, matching the locked
design's stacked title) + the `ContactDialog` CTA directly (no more DOM-portal — the earlier
`HeroContactCta` indirection is gone), with `owner-estimate-form.tsx`'s `OwnerEstimateForm`
slotted into `aside`. `Hero`'s `compact`/`aside`/`copyClassName`/`actionsClassName` grid
proportions, gap, and headline sizing were ported 1:1 from this page's own CSS (not
`mock/owners.html`'s, which is stale) — see `core/ui/hero.tsx`'s docstring for the exact
cascade/specificity reasoning. The 3-step wizard's step/count logic is React state inside
`OwnerEstimateForm` itself (see "Owners earnings wizard on form-card" below); the former
`est-form-wizard.tsx`/`est-form-stepper.tsx` DOM islands are gone. **Every section is now real JSX** (see the
`why`/`services`/`plans`/`journey`/`dashboard`/closing-CTA walkthrough below) — `ownersBodyTop`
and `ownersBodyBottom` are both gone, and with them the entire `.mk`/`OWNERS_STYLE`/`<ScrollReveal
page="owners">` scaffold (`dangerouslySetInnerHTML` no longer appears anywhere in this file).
Optional images (`services`/`dashboard`/`journey` steps/the closing CTA) fall back to the approved
mock/Pexels photo until an R2 asset is set. It no longer renders its own section bar: the header's "Owners" mega-menu (settings slice) doubles
as the section sub-nav — it opens on hover and the settings header pins it open once scrolled
past the top (`OWNERS_NAV_CSS`, scoped via `body:has([data-page="owners"])`); on mobile those
anchors live under "Owners" in the burger drawer.
Layout: hero +
earnings form, an animated "numbers" band — still this page's own `stats[×4]
{to,prefix?,suffix?,group,label}` (drizzle 0009), but now rendered as real JSX through the same
reusable, count-up band Home uses (`core/ui`'s presentational `StatBand` + `CountUp`, wrapped in
`<Reveal>`; `#numbers` anchor on its own wrapper div since it sits outside `.mk`) instead of the
raw-HTML grid + `owner-stats-counter.tsx`'s `[data-count]`-scanning counter. Home's own stats
band (`stats-band.tsx` → `StatsBand`) reads different, company-wide figures from
`company_settings` — the two happen to differ, so Owners deliberately keeps its own numbers,
just the shared widget. `owner-stats-counter.tsx` is otherwise unaffected and still shared with
**About**, which still uses the raw-markup `.mk` stats grid. Then the full marketing flow — `why`
("Why property owners trust us") is likewise now real JSX: `core/ui`'s new `EditorialSplit`
(sticky headline + CTAs beside a hairline `benefits[×6]` list — the layout ADR 0022 called
"Editorial Split" when Home briefly had its own version, since removed). It used to be
reproduced as scoped `.mk` CSS (same "`mock.css` styles bare elements, would leak into Tailwind"
reasoning `services`/`dashboard` below still have) because the page itself was a raw-markup
embed at the time; now that the hero/numbers band are real JSX too, there was no longer a
reason to keep `why` as a CSS-scoped duplicate, so it was ported into the reusable component
instead and wired in beside `#numbers`/`#testimonials`/`#faq`, outside `.mk`. Icons stay the old
positional mapping (`WHY_ICON_KEYS` in `owners-page.tsx`, resolved through the shared
`pages/ui/components/icon.tsx` registry) rather than each benefit's own `icon_key` — preserving
exactly what rendered before; wiring `icon_key` through is a separate, not-yet-requested change.
`services` and `dashboard` (#technology) are now real JSX too, both `core/ui`'s existing
`TwoColumnShowcase` (the same "Image Showcase" component Home's guests pitch uses — no new
component needed, confirming it was already built generically enough): `services` via
`imagePosition="right"` + `tone="alt"`, `dashboard` **mirrored** via `imagePosition="left"` (no
`tone`, matching the locked design — only `services` sits on the warm `altBg` band). Both pass
the new `badge` prop (their floating-badge text differs from the under-CTA caption, unlike
Home's guests pitch where one `cta.note` served both — see that component's docstring). Benefit
icons follow the same positional-mapping precedent as `why` (`SERVICES_ICON_KEYS`/
`DASHBOARD_ICON_KEYS`; eight new keys added to the `icon.tsx` registry: `camera`/`calendar`/
`wrench`/`trending-up`/`dollar-circle`/`calendar-lines`/`bar-chart`/`bell-alt` — the last kept
distinct from the existing `bell` rather than reused, to preserve dashboard's exact pre-existing
glyph). `OWNERS_STYLE`'s `.owner-showcase`/`.sh-*` CSS block is gone now that both sections (its
only users) are ported. `plans` ("A management plan built around your goals", up to 4 pricing
tiers — drizzle 0010 trimmed `plans.helpers` 2→1) is real JSX too: two new `core/ui` components,
`PricingCards` (the card grid: name/tag/popular ribbon/corner badge/feature list/CTA) and
`CalloutBand` ("Not sure which plan fits?" — a bare highlighted title+copy+CTA strip, no
`Section`/`Container` of its own, unlike every other new component so far — see its docstring).
`CalloutBand` slots into `PricingCards`' `footer` prop so it keeps the original's tight `mt-20`
coupling *inside* the same section, rather than becoming a second, separately-padded one — the
reason neither component's own docstring explains in isolation. Both "Choose `<tier>`" and the
helper band's CTA keep `href="#"`, matching the original markup exactly (the schema's
`planHelper.cta.url` field was never actually wired to the href there either). `journey` ("Your
growth path", exactly 5 steps) is real JSX too: a new `core/ui` component, `StepGallery` (centred
heading above a hairline-separated, `altBg`-toned grid of full-bleed photo cards — each with a
dark bottom scrim, a hover zoom, and an overlaid "01"-style index + title + description), ported
1:1 from the old `.steps`/`.step`/`.step-img`/`.step-scrim`/`.snum` CSS. The index is derived from
array position, not a schema field (same reasoning as `PricingCards`' "Most Popular" ribbon); the
step photos are still Pexels placeholders (`JOURNEY_FALLBACK_IMGS`, client direction — trying a
photo-background treatment, `#core/media` assets not uploaded yet), one per step, falling back
positionally like `services`/`dashboard`'s images. The closing CTA ("Start Earning More Today" /
"Ready to Make Your Property Work for You?", `#start`) is real JSX too: a new `core/ui` component,
`FeatureCtaBand` (a photo on one side, eyebrow/headline/body/CTA/contact-line on the other, on the
dark "feature" band — `bg-feature`/`text-on-feature*`, the same tokens `StatBand`/`DualCtaPanels`
use), ported 1:1 from the old `.cta-band`/`.cta-wrap` CSS. It isn't built on `TwoColumnShowcase`
(always light-themed; every text color would need a dark override for this, its only consumer) —
see its docstring. Still fully hardcoded, same as before this port: this section has no schema
field yet (a separate follow-up), so its image is always the Pexels fallback and every string is
a literal at the `owners-page.tsx` call site, not `content.*`.

Two sections are shared React islands: the `testimonials` infinite marquee (`<TestimonialsRow>`,
the same component as the home "Partners & Guests" carousel) and the `faq` accordion
(`<FaqSection>`). Both read the DB (testimonials + faq slices, ISR-cached). Per owner direction
the per-section **eyebrow** labels were dropped (titles stay), the hero badge moved into the form,
and `why`/`services`/`dashboard` were restyled; the editable marketing sections (now incl.
`services.image_media_id` + `dashboard.image_media_id`, plans capped at 4 tiers, and the new
`faq_group_key`) are mirrored in the owners schema and stored row, editor-ready (drizzle 0004→0008).

**FAQ is page-selectable (all five pages).** Every page schema carries an optional `faq_group_key`
(blank = no FAQ). The page editor renders it as a dropdown of the FAQ groups authored in `/admin/faq`
(via `faq.listFaqGroups`), and the page renders the chosen group through the shared `<FaqSection>`
(accordion + `FAQPage` JSON-LD). The Owners and Real-Estate pages, whose FAQs used to be hard-coded
markup, now read their group (`owners` / `real_estate`, seeded in drizzle 0008 from the former static
Q&A); Home/Guest/About start blank.

**About** (`about-page.tsx`) is still mostly the raw-markup `.mk` embed, but its `values`
("What Guides Us") section is real JSX now: `core/ui`'s new `NumberedFeatureGrid` (a hairline
grid of numbered index+title+body cards with hover lift), ported 1:1 from the old
`.val-grid`/`.val`/`.vnum` CSS (including the page-scoped `#values .val:hover` motion rules,
now the component's own Tailwind). The section's `sec-head` (eyebrow/title/lede) stays
untouched raw markup in its own small `.mk` wrapper; the `<section>` element and its
`.wrap`-equivalent container are real JSX too, reproducing the exact mock metrics
(`max-width:1240px;padding:0 28px`, `padding:clamp(72px,10vw,150px) 0`) rather than `core/ui`'s
generic `Section`/`Container` (different values — would have misaligned the grid against the
raw `sec-head` above it). Wrapped in `core/ui`'s `Reveal` so it still fades in on scroll like
its raw-markup neighbours (`ScrollReveal`/`.pre-reveal` can't reach outside `.mk`); the
original's per-card stagger isn't reproduced (`Reveal` animates its subtree as one unit). The
rest of the page (stats grid, `organised`, `certifications`, `community`, `contact`) is
unaffected — out of scope for this change.

**Real Estate** (`real-estate-page.tsx`) is still mostly the raw-markup `.mk` embed, but its
`market` ("Portugal: One of Europe's Strongest Hospitality Markets", `#market`) section is real
JSX now: `core/ui`'s new `StatBento` (an asymmetric 2-row bento — a tall feature cell with a
title, an embedded 3-up stat strip, and supporting paragraphs, spanning two rows beside a plain
text cell and a checkmark-bullet-list cell; all three share hover-lift + accent-sweep-line
chrome), ported 1:1 from the old `.market-bento`/`.mcell`/`.stat-row`/`.thesis` CSS. **Known
mock/live drift, resolved in favour of the live render:** `mock/real-estate.html` still shows
this slot as the older flat `.why-grid`/`.why-block` 4-up grid — the shipped code had already
replaced it with this bento (the old CSS even carried a `/* Replaces the former flat 2x2
why-grid */` comment), so the mock is the stale artifact, not the code; this extraction was
verified against the live `localhost:3025/en/real-estate` render, not the mock file. The
section's `sec-head` (title/lede) stays untouched raw markup in its own small
`.mk[data-page="real-estate"]` wrapper — kept `data-page`-scoped (unlike About's `#values`
extraction, which dropped it) so `ScrollReveal`'s `.mk[data-page="real-estate"] .pre-reveal`
query still reaches it and the original fade/slide-in on scroll is preserved exactly; the
`<section>`/`.wrap` shell is real JSX reproducing the exact mock metrics, same technique as
About's `#values`. Wrapped in `core/ui`'s `Reveal`; the original's per-cell stagger
(`.reveal-stagger`) isn't reproduced, same accepted trade-off as About's `NumberedFeatureGrid`
extraction. `bodyTop` is now split into `bodyTopA` (sections 1–5, ending after deal structures)
and `bodyTopB` (now section 8 only, process) around the new JSX in between — same
split-string pattern as About's `BODY_TOP_A`/`BODY_TOP_B`.

Its `track_record` ("Performance You Can Measure", `#track-record`, SECTION 7) section is real JSX
too: `core/ui`'s new `StatTiles` (hairline grid — `gap-px` over `bg-line`, `border-line` frame —
of light centred tiles: count-up serif accent figure, uppercase label, optional caption; 3 → 2 →
1 columns at the original's 980px/680px breakpoints), ported 1:1 from the old `.tiles`/`.tile`/
`.tval`/`.tlbl`/`.tcap` CSS (verified numerically against the live render at 1440/834/390 —
identical boxes, colours, type, and settled figures). Not `StatBand` (dark band, no cells/
captions), `SpecStrip` (flat ink strip, no animation) or `StatBento`'s embedded strip. The
section shell is JSX with the exact `.mk section`/`.wrap` metrics plus the `class="alt"` warm
band; the sec-head stays raw in its own `.mk[data-page="real-estate"]` wrapper (same as
`#market`) so `ScrollReveal` still fades it in; the tiles are wrapped in `Reveal`. The original's
`.reveal-stagger` was a no-op (the per-tile delays landed on tiles with no transition of their
own — the grid always faded as one unit), so a single `Reveal` reproduces it exactly. The count-up
moved from the `OwnerStatsCounter` `[data-count]` island + `countAttrs()` to `CountUp` (which got
an additive `durationMs` prop — `StatTiles` passes the island's 1600ms — plus an exact-final-text
snap and an `sr-only` accessible copy of the figure); `OwnerStatsCounter` is no longer mounted on
this page (nothing else here used `[data-count]`) but is still used by **About**. This page's
`<noscript>` rule now also un-hides `[data-reveal]`, so the `Reveal`-wrapped `#market` bento and
`#track-record` tiles stay visible with JS off (the bento was previously hidden in that case).
`mock/real-estate.html` still shows an eyebrow ("Proven Performance") above this section's title
that the live page (and the `track_record` schema) never had — left as-is. The rest of the page
(hero, partners, capabilities/manage showcases, deal structures, process, enquiry form) is
unaffected — out of scope for this change.

Its `deal_structures` ("Deal Structures Built Around Your Risk Profile", `#deal-structures`,
SECTION 5 — the partnership-model cards) section is real JSX too: `core/ui`'s new
`ChecklistCards` (3 → 1 columns at the original's 980px breakpoint, top-aligned, gap 26px;
bordered `bg-surface` cards with serif `<h3>` name, uppercase accent-deep tagline, hairline
checklist with a CSS-drawn accent check, hover lift; the `featured` card gets the accent border +
accent glow — kept on hover, as before — and a floating pill whose text is the DB
`feature_label`), ported 1:1 from the old `.models`/`.model`/`.feat-tag`/`.mtag` CSS (identical
to `mock/real-estate.html`'s; verified numerically against the live render at 1440/834/390 —
identical boxes, type, colours, hover `transform`/`box-shadow`, and `#market`'s position). Not
`PricingCards` (Owners' plans — 4 cols, different padding/gap, inverted name/tag hierarchy,
mandatory CTA, hardcoded "Most Popular"; left untouched). The section shell is JSX with the exact
`.mk section`/`.wrap` metrics plus the `class="alt"` warm band; the centred sec-head stays raw in
its own `.mk[data-page="real-estate"]` wrapper (same as `#market`/`#track-record`) so
`ScrollReveal` still fades it in; the cards are wrapped in `Reveal`; the optional disclaimer
`note` (never revealed in the original) is a plain JSX `<p>` outside `Reveal`. The original's
`.reveal-stagger` produced no visible entrance stagger (only the `.models` container
faded/slid; the per-card `transition-delay`s it set only ended up delaying cards 2–3's *hover*
lift by 70/140ms — an unintended side effect, not reproduced), so one `Reveal` is equivalent.
`bodyTopA` now ends after SECTION 4 (asset types); the old `.models`/`.model*` CSS (and its
`max-width:980px` rule) was removed from `PAGE_STYLE`. `mock/real-estate.html` still shows an
eyebrow ("Deal Structures") above this section's title that the live page (and the
`deal_structures` schema) never had — left as-is.

Its closing "Ready to Explore a Partnership?" section (`#deal-enquiry`, SECTION 10 — the former
raw `BODY_BOTTOM` string) is real JSX too: `DealEnquirySection`
(`ui/components/deal-enquiry-section.tsx`), composed from two new `core/ui` pieces —
`EnquirySplit` (section shell + `.85fr/1.15fr` grid → 1 column ≤980px; intro column = serif
`<h2>`, lede and a hairline-topped "contact directly" block of label/link lines; right column =
a form slot; `reveal` wraps each column in its own `Reveal`, reproducing the original's two
independent `reveal-io pre-reveal` hooks) and the `form-card.tsx` primitives (`FormCard`,
`FormGroup` with its "Required" pill tag, `FormField` with the `aria-hidden` `*` marker,
`FormRow` 2 → 1 columns ≤680px, `FormAccordion` `<details>` with the rotating `+`, `FormInput`/
`FormSelect`/`FormTextarea`, full-width `FormSubmit`, `FormNote`). Ported 1:1 from the old
`.enquiry`/`.contact-direct`/`.form-card`/`.fgroup*`/`.ffield`/`.ftwo`/`.facc*`/`.form-note` CSS
+ `mock.css`'s `.btn.btn-accent`/`h2`/`.lede`; verified numerically against the live render at
1440/834/390 (closed and open accordions, focus ring on input/select/textarea, button hover,
placeholder colour) — identical boxes, type, colours and pixels, and the FAQ/footer positions are
unchanged. `OwnerEstimateForm` was later moved onto these same primitives (see "Owners earnings
wizard on form-card" below); the leads slice's controlled `fields.tsx` (slice-internal,
`bg-surface` inputs, wired to `submitLead`) is not on them yet. The fields (ids/names/types/placeholders/`required`/options) live
in the slice; the components only style them. The old CSS (and its 980px `.enquiry` / 680px
`.ftwo` media-query entries) was removed from `PAGE_STYLE`.
**Still pending (unchanged by this UI-only extraction):** the copy is hardcoded English (not
i18n'd, not in `page_content` — `/pt` `/es` `/fr` show English), the form submits nothing
(`StaticFormCard`, a 1-line client wrapper, cancels the submit like the mock's
`onsubmit="return false"`; native `required` validation still runs) — wiring it to the leads
slice's deal-enquiry action is a separate task — and the LinkedIn link is still `href="#"`.
`mock/real-estate.html` differs from the live section (an eyebrow "Start a Conversation", three
always-open groups, no `required`/markers/accordions) — the live variant was kept.

Its hero (`#top`, SECTION 1) is real JSX too: `core/ui`'s `<Hero compact align="center">`
with **exactly** the Buildings-listing hero configuration (`buildings-listing.tsx`: 1600px/40px
wrap, `.5/.46/.88` scrim, 26ch h1, 60ch p, default eyebrow, `ButtonLink` primary/light CTAs),
rendered outside and before `.mk`. Cross-page consistency was chosen over 1:1 fidelity to this
page's own mock overrides, which differed by a hair (`.5/.4/.82` scrim, `#ecdcc2` 600/.18em
eyebrow, 1.08 h1 leading, 19px `#f1ece2` lede) and would have needed props-only workarounds.
Still DB-driven (`hero.subheadline` → eyebrow, `headline` → h1, `positioning` → p,
`cta_primary` → `#deal-enquiry`, `cta_secondary` → the capability-statement asset URL or
`#deal-enquiry` — an absolute asset URL now opens in a new tab, `ButtonLink`'s rule); the
background is `MediaImage` (or the fallback `<img>`), still the eager/`fetchpriority=high` LCP
element. The former `.mk[data-page="real-estate"] .hero` overrides and `escAttr` are removed.

Its `partners` ("Built for Institutional Partners", `#partners`, SECTION 2) section is real JSX
too: `core/ui`'s `EditorialSplit` with **exactly** Owners' `#why` configuration (wrapping
`<div id="partners" className="scroll-mt-[84px]">` — this page's anchor offset, not Owners' 130px, `headline`/`body`/`items`, primary CTA
label suffixed with `→` → `#deal-enquiry`, ghost secondary → `#deal-structures`, `note` from
`cta_primary.note`; icons as `<Icon className="mt-0.5 h-7 w-7 flex-none text-accent-deep">`),
rendered outside `.mk` between the Hero and the `.mk` wrapper (whose `<style>`/`<noscript>`/
`ScrollReveal` still precede the remaining raw sections). The entrance animation is
`EditorialSplit`'s own internal `Reveal`s (sticky-safe), so there is no call-site `Reveal`; the
rendered class tree is identical to Owners' `#why`. Still DB-driven exactly as before. The four
positional `PARTNER_ICONS` SVG strings moved verbatim into the slice `Icon` registry
(`landmark`/`trowel`/`buildings`/`send`) and are paired by index via `PARTNER_ICON_KEYS`.
Cross-page consistency was chosen over this page's own styling: `EditorialSplit`'s
`max-w-7xl`/`px-6 md:px-10` Container and section padding replace the 1240px/28px `.wrap`
(the column edge sits 8px left of the neighbouring raw sections at 1440), the benefit `<h3>`s
are sans (Inter) instead of `.mk`'s serif, the buttons are `ButtonLink` (46px tall, 6px radius)
instead of the mock's `.btn` (52px, 3px) (the `#partners` anchor keeps this page's 84px offset). `mock/real-estate.html` still shows this slot as an older 4-up partner-type grid — the
live Editorial Split was already the shipped design. The `.partner-pitch` CSS stays in
`PAGE_STYLE` because "How it works" (`#process`) still uses it; `benefitList`/`esc` stay for the
showcases and other raw sections. `bodyTopA` now starts at SECTION 3 (capabilities).

"Asset Types" (`#manage`, SECTION 4) is real JSX too: `core/ui`'s existing `TwoColumnShowcase`
with **exactly** Owners' `#services` configuration (26px `mt-0.5` accent-deep bullet icons, 4:5
`rounded-sm` image, `(max-width: 1024px) 100vw, 560px` sizes, `Reveal` at the call site, CTA
label + ` →`), rendered outside `.mk` right after `bodyTopA` (which now ends after
`#capabilities`). Same role and the old `.asset-showcase` CSS was byte-identical to Owners'
`.owner-showcase`, so no new component; consistency with Owners was chosen over 1:1 mock
fidelity (visible deltas: 36px/400 h2 instead of `clamp(28px,3.4vw,44px)`/500, 16px Inter
bullet titles instead of 17px Fraunces, `ButtonLink` 44px button, 1280px/40px container instead
of 1240px/28px, kernel `Section` rhythm, Tailwind `shadow-xl` badge hidden under 640px, 2-col
→ stacked at 1024px instead of 980px). Still DB-driven (`asset_management`); the CTA keeps the
hard-wired `#deal-enquiry` anchor, the badge is the CTA note. The `.asset-showcase` CSS stays in
`PAGE_STYLE` only for `#capabilities` until it is ported the same way.

The **Guests** page (`guest-page.tsx`) is **DB-driven** (mock embedded 1:1, drizzle 0012 +
`docs/specs/guest-page-db-wiring.md`): `bodyTop` / `bodyActivitiesTeaser` (the old `bodyBottom`
is gone — see the dual CTA below) interpolate the resolved `guest` row into the locked markup, escaped through `esc`/`escAttr`.
Its nine sections split as follows — hero, welcome, why, services teaser and activities teaser
come from `page_content`; the featured portfolio comes from **buildings**, the reviews from
**testimonials** (`audience='guest'`, managed in `/admin/testimonials` — the page schema owns no
testimonials block), the optional FAQ from **faq**, and the dual-CTA contact line from
**company_settings**. `icon_key` renders directly as an Iconoir glyph (`iconoir-<key>`; the font
is loaded globally by `mock.css`), with `iconoir-sparks` as the fallback for unknown keys.
`localizeUrl` rewrites the stored absolute `/en/…` CTA links to the active locale, because
`cta.url` is `z.url()` and relative paths cannot be stored.

The "Make the Most of Your Stay" **services teaser is real JSX now**: `core/ui`'s new
`PhotoFeatureGrid` (a bordered grid of full-bleed photo cards — icon/title/description in white
over a dark scrim — plus an optional CTA row), ported 1:1 from the old combined `bodyMid`'s
`.feat-grid`/`.feat`/`.cta-row` CSS (now split out as `servicesTeaserSecHead` +
`bodyActivitiesTeaser`, see below). Rendered **outside** `.mk` (Lesson 1: `.mk *{margin:0;
padding:0}` is unlayered CSS and always beats a `@layer`-wrapped Tailwind utility); its
`sec-head` (eyebrow/headline/intro — still DB content) stays raw markup through the existing
`secHead()` helper, in its own small `.mk[data-page="guests"]` wrapper so it keeps picking up
`<ScrollReveal page="guests">`'s sweep. The section/wrap chrome around it (`max-width:1240px;
padding:0 28px`, `padding:clamp(72px,10vw,150px) 0`, the `.alt` tint) is reproduced at the exact
mock metrics directly in `guest-page.tsx`, not `core/ui`'s generic `Section`/`Container` (same
reasoning as About's `NumberedFeatureGrid` call site). **Not** `IconFeatureGrid` (different band
chrome, icon-circle not photo card, 3 fixed items, no CTA) and **not** `StepGallery` (numbered
index not icon, shared hairline-grid border not per-card border, 5 fixed items, no CTA) — see
`PhotoFeatureGrid`'s own docstring for the full comparison, plus a documented, deliberate
deviation it ports: the *approved static* `mock/guest.html` baseline defines `.feat` as a plain
`surface`-background card, but the *live* `guest-page.tsx` had already (pre-dating this
extraction) shipped a photo-background + gradient-scrim + white-text treatment instead, per an
explicit in-code "client feedback: premium look for Services/What-to-do" comment — ported as
shipped, flagged rather than silently resolved. The immediately adjacent "What to Do" teaser is
**unchanged** — still raw markup (same `.feat-grid`/`.feat`/`.cta-row` CSS, still in `PAGE_STYLE`
since this section needs it), now in its own small `.mk` wrapper (`bodyActivitiesTeaser`) since
it no longer shares a markup string with the services teaser. A likely future second consumer of
`PhotoFeatureGrid`: that "What to Do" teaser itself, once it's its own extraction task (just
needs `cta.variant="ghost"`).

The closing guest/owner **dual CTA is real JSX now** too: `core/ui`'s new `SplitCtaPanels` (a
hairline grid — 1px `line` gap + 1px outer `line` border — of one or two solid panels, `light`
= `surface` with an ink `.btn-solid`-style button, `dark` = `feature` with an accent button; 2
cols from 981px, stacked at ≤980px), ported 1:1 from `mock.css`'s `.dual`/`.dcol`/`.dcol.owner`/
`.contact-line`/`.btn-*` rules. The old `bodyBottom()` HTML string and its trailing `.mk` wrapper
are deleted; `guest-page.tsx` keeps only `dualCtaContactLines(globals)` (company_settings →
"phone · email" / "phone · email · WhatsApp …", empty → line omitted). Same shell technique as
the services teaser: the `<section>` (`clamp(72px,10vw,150px)` padding, `scroll-mt-[84px]`, no
tint) + 1240px/28px column at the call site, outside `.mk`, and the original single
`.dual.reveal-io.pre-reveal` fade-in → one `Reveal`. **Not** `DualCtaPanels` (photo "Immersive
Panels" with scrim — a different design, used by Home/Owners via `components/dual-cta.tsx`) and
**not** `FeaturePanel` (dark-only, self-bordered — two of them in this grid would double the
border); buttons are not `ButtonLink` (radius/padding/border/tracking/transition differ, no ink
variant) — see the component's docstring. Props are shaped so `mock/home.html` (owner panel
first, `padding-top:0`) and `mock/buildings.html` (one owner panel, single column) are just a
different `panels` array / section padding — not wired there. The page's `<noscript>` rule now
also un-hides `[data-reveal]` (same fix as Real Estate), which the services teaser's `Reveal`
was already missing — with JS off both sections previously stayed at `opacity:0`.

**Deploy order matters for this page:** migration 0012 must run before the code ships, otherwise
prerendering `/[locale]/guests` throws on the missing `portfolio` / `dual_cta` blocks. A stale
`.next/cache` from a pre-migration build causes the same failure locally — clear it and rebuild.

The Home `guests_pitch.image_media_id` and `dual_cta.*.image_media_id` are **optional images**
(`""` allowed): until an R2 asset is uploaded the render falls back to an approved mock photo,
so the section never renders empty.

All cross-slice data is read **through contracts only** (golden rule 2) — e.g. the featured
portfolio builds its own card from `BuildingSummary` rather than importing buildings' UI.

### Owners earnings wizard on form-card (style unification)

`OwnerEstimateForm` (Owners hero `aside` + Buildings' listing calculator) is built on `core/ui`'s
`form-card.tsx` primitives and **deliberately adopts their look** (user-approved unification
with Real Estate's `#deal-enquiry` form — not a pixel-identical port): 52px controls with a
`bg` fill, 12.5px/`0.03em` labels, the 3px-radius `14px 28px` accent button, the accent border +
3px halo focus, `FormCard`'s 8px radius/padding/shadow, soft-ink `FormNote`. Unchanged:
structure, copy, ids/names/types/placeholders/options, initial state, navigation and the
no-submit behaviour (a verified 0-diff DOM/behaviour inventory, bar the a11y additions below).

- **Logic moved into React.** Step + property count are `useState` in the (now `"use client"`)
  component; the `EstFormWizard`/`EstFormStepper` DOM islands (and their contract exports +
  mounts on Owners and Buildings) were removed. The `data-wizard`/`data-step`/`data-panel`/
  `data-dot`/`data-stepper`/`data-value`/`data-min`/`data-step="up|down"`/`data-wiz-next`/
  `data-wiz-back` markers stay on the same elements. A real `submit` (Enter) is cancelled via
  `onSubmit`, as the island did.
- **New `core/ui` primitives it uses:** `FormButton`, `FormStepper`, `FormCheckbox`,
  `FormProgress`, plus additive `FormSelect` (`placeholder` optional, `{value,label}` options,
  `defaultValue`, opt-in `chevron`), `FormField` (`htmlFor` optional, `labelId`) and `FormRow`
  (`stack={false}`) props — see `form-card.tsx`. Real Estate's render is numerically unchanged.
- **Layout calls (not covered by form-card):** `FormCard` padding/shadow used as-is in both hosts
  (the card grows ~24px: taller controls); `text-ink` + `leading-[1.6]` on the card (the hero is
  `text-surface`; the controls' 52px box needs the 1.6 line box), headings/badge pinned to their
  previous `leading-[1.5]`; properties/bedrooms stay two-up at every width (`stack={false}`, as
  before); both selects use the custom `chevron` (native menulists render 48px with an OS
  arrow); the phone-code select widened 112 → 124px to fit the chevron + 14px padding.
- **Small fixes that came with it:** the consent lines' copy is wrapped in one `<span>` (the
  inline links used to become separate flex items, leaving 10px gaps around them); the stepper
  is a labelled `role="group"` (`aria-labelledby` → its "Nº of Properties" label, which gains
  `id="nprop-label"`) with an `aria-live` value; decorative SVGs are `aria-hidden`.
- Still pending, unchanged: hardcoded English copy (steps 2/3 + labels), `href="#"` terms/privacy
  links, not wired to `submitLead`.

## Routes (`src/app/[locale]/…`)

`/[locale]` (home), `/owners`, `/guests`, `/real-estate`, `/about` — each ISR (`revalidate =
3600`), prebuilds all 4 locales, and emits canonical + `hreflang` alternates via
`buildMetadata`. Page meta titles/descriptions come from the `pages` i18n namespace; the OG
image override comes from the page row.

## i18n

UI-chrome strings live in the root `messages/<locale>.json` under the `pages` namespace
(authored for en/pt/es/fr): per-page meta, section connective labels (stats/reviews/portfolio
eyebrows), `reviews.titleGuests` (the Guests-only reviews heading), the dual-CTA copy, and
plural helpers (`portfolio.apartments`, `portfolio.guests`).
All page *content* prose are [T] DB fields resolved through `core/i18n`.

## Resolution internals (`server/`)

- `overlay.ts` (pure, DB-free, unit tested): `expand` (pattern → concrete numeric paths),
  `overlayTranslations` (clone + overlay approved leaves, source fallback), `collectMediaIds`.
- `resolve.ts` (`server-only`): wraps the overlay with the `core/i18n` translation resolver
  and resolves media via `core/media`.
- `queries.ts`: the cached public reads.
- `publish.ts`: `revalidatePage(key)` — busts `page:<key>` and `revalidatePath` for all 4
  locales (called by the S12 admin publish action).

## Backoffice (`admin/`) — schema-driven page editor (S12)

Plugs into the backoffice shell. Contributes one `content`-group screen (top of the group,
`admin/screens.ts` → `pagesAdminScreens`); the list + per-page editor mount under
`app/(admin)/admin/(panel)/pages/…`.

- `admin/form-model.ts` (pure, unit-tested) — `describe(schema)` walks a page's **fixed Zod
  schema** into a serializable `FieldNode` tree; `emptyValue` / `applyDefaults` scaffold a `data`
  object (fixed-count arrays padded to length); `humanizeKey` makes labels. Leaf mapping:
  `*_media_id` → media picker (a `.describe()` on the media schema becomes the uploader hint:
  recommended size/format), `faq_group_key` → **select** dropdown (a `SELECT_SOURCES` key →
  catalogue heuristic, mirroring the media one; `.describe()` becomes the picker hint), ZodBoolean
  → checkbox, ZodString → text (textarea when long). The `select` options are *not* in the schema:
  `getPageEditModel` fills them server-side from another slice's contract (today
  `faq.listFaqGroups`) and threads them to the renderer alongside media `previews`.
- `admin/queries.ts` (server-only) — `listPagesAdmin` (the five pages + whether each exists),
  `getPageForEdit` (source `data` + og image + media previews), `getPageEditModel` (adds the
  `FieldNode` tree, computed **server-side** so Zod stays out of the client bundle).
- `admin/actions.ts` (`"use server"`, `requireStaff`-gated) — `savePage`: validates `data` against
  `pageSchemas[key]` (single source of truth for shape), upserts `page_content`, `revalidatePage`.
  **No translation-table writes** — source lives in `data`; target locales are S14's job.
- `admin/ui/` — `list.tsx` (server; no status column — pages are always live), `page-editor.tsx`
  (client island; the social-share image + nested `data` edited immutably by path),
  `schema-fields.tsx` (recursive `FieldNode` renderer, surfaces media `hint`s).

Editing an unauthored page works: `applyDefaults` scaffolds the empty skeleton from the schema.

## Deferred / escalations / handoffs

- **Lead forms (S10)**: ✅ wired — `lead-cta.tsx` embeds the leads widget via its contract.
- **Richer JSON-LD** (`Organization`/`LocalBusiness`/`FAQPage`/`Service`): belongs in
  `core/seo` (**S13**, ADR — golden rule 3), not hand-written here.
- **Translation review** of page [T] blocks: **S14**, on the `core/i18n` seam.

## Tests

`tests/pages.test.ts` — the per-page translatable-path contract + the pure overlay logic
(`expand`, `overlayTranslations` with source fallback, `collectMediaIds`) + schema validation
(fixed-count arity, unknown key). `tests/pages-admin.test.ts` — the schema → form model
(`describe` leaf/array detection, `emptyValue`/`applyDefaults` scaffolding, `humanizeKey`). Run:
`npx tsx --test src/slices/pages/tests/pages.test.ts src/slices/pages/tests/pages-admin.test.ts`.
