/**
 * Public surface of the in-repo design system (`core/ui`). Premium/boutique
 * primitives (design-system.md). Slices compose these — they don't re-implement
 * shared chrome. Token values live in `app/globals.css` `@theme`.
 */
export { cn } from "./cn";
/** Client-safe interface icon (Iconoir subset: chevrons, close, menu, +/−, check, star…). Content icons (`icon_key`) use the server-only `@core/ui/icon` `<Icon>` (ADR 0034). */
export { UiIcon, type UiIconName } from "./ui-icon";
export { Container } from "./container";
export { Section } from "./section";
export { Eyebrow } from "./eyebrow";
export { ButtonLink, buttonClassName, type ButtonSize, type ButtonVariant } from "./button";
/** Scroll-reveal wrapper (fade/slide-in once, IntersectionObserver-based). */
export { Reveal } from "./motion/reveal";
/** Animated count-up for headline figures, parses a display string and counts to it. */
export { CountUp } from "./motion/count-up";
/** Shared scroll-snap carousel (Home's featured portfolio + services tracks). */
export { Carousel } from "./carousel";
/** Two-column "Image Showcase" section (copy + bullets + CTA beside an image). */
export { TwoColumnShowcase } from "./two-column-showcase";
export type { TwoColumnShowcaseBullet, TwoColumnShowcaseCta } from "./two-column-showcase";
/** Two-column "Editorial Split" section (sticky copy + CTAs beside a hairline icon/title/description list). */
export { EditorialSplit } from "./editorial-split";
export type { EditorialSplitCta, EditorialSplitItem } from "./editorial-split";
/** Pricing/plan cards grid (heading + up to 4 bordered cards, optional `footer` slot). */
export { PricingCards } from "./pricing-cards";
export type { PricingTier } from "./pricing-cards";
/** Bare highlighted horizontal callout (title + copy + one CTA) — no Section/Container of its own. */
export { CalloutBand } from "./callout-band";
/** Numbered step gallery (heading + hairline grid of full-bleed photo cards with an overlaid index/title/description). */
export { StepGallery } from "./step-gallery";
export type { StepGalleryItem } from "./step-gallery";
/** Owner/guest "Immersive Panels" closing band — presentational, data composer stays slice-owned. */
export { DualCtaPanels, type DualCtaPanel } from "./dual-cta-panels";
/** Dark "feature band" closing CTA: photo one side, eyebrow/headline/body/CTA/contact-line the other. */
export { FeatureCtaBand } from "./feature-cta-band";
/** Dark "feature band" closing CTA, centred and photo-less: eyebrow/headline/body/CTA/contact-line. */
export { CenteredCtaBand } from "./centered-cta-band";
/** A single bordered, solid dark "feature band" panel: eyebrow/title/body/CTA/contact-line, no image. */
export { FeaturePanel } from "./feature-panel";
/** Site-wide header chrome (sticky bar + hover-dropdown mechanics) — see `nav-bar.tsx`. */
export { NavBar, type NavLinkEntry } from "./nav-bar";
/** Mobile navigation drawer shell — see `mobile-drawer.tsx`. */
export { MobileDrawer, type NavCta, type NavEntry } from "./mobile-drawer";
/** Property card (image/badge/name/meta/view label) — fed as `Carousel` slides. */
export { PropertyCard } from "./property-card";
/** Presentational stats/count-up band (dark feature band + optional title). */
export { StatBand } from "./stat-band";
/** Bare, static (no animation) bordered value/label strip — a value can be plain text too. */
export { SpecStrip } from "./spec-strip";
/** Hairline-separated grid of numbered feature cards (index + title + body) with hover lift. */
export { NumberedFeatureGrid } from "./numbered-feature-grid";
/** Bordered pill-chip row inside a hairline bar (eyebrow label + chips + optional note), presentational. */
export { ChipBar, type ChipBarItem } from "./chip-bar";
/** Page hero (full-bleed video/image band with overlaid editorial headline) — never animated. */
export { Hero } from "./hero";
/** Dev-only diagnostic: logs viewport size + scroll progress to the console. No-op in prod. */
export { ScrollDebugProbe } from "./motion/scroll-debug-probe";
/** Site-wide footer chrome — see `footer.tsx`. */
export { Footer, type FooterContact, type FooterNavGroup, type FooterSocialLink } from "./footer";
/** Bordered/tinted band: centered eyebrow+heading above a fixed 3-column icon/title/description grid. */
export { IconFeatureGrid, type IconFeatureGridItem } from "./icon-feature-grid";
/** Eyebrow + serif heading above free-prose paragraphs, with one optional named (`<h3>`) subsection. */
export { ProseSection, type ProseSectionSubsection } from "./prose-section";
/** Asymmetric 2-row bento: a feature cell (title + embedded stat strip + paragraphs) beside two stacked text/list cells, shared hover-lift + accent sweep-line chrome. */
export { StatBento, type StatBentoCell, type StatBentoStat } from "./stat-bento";
/** Bordered grid of full-bleed photo cards (icon/title/description, white-on-scrim) + optional CTA row. */
export { PhotoFeatureGrid, type PhotoFeatureGridItem } from "./photo-feature-grid";
/** Hairline grid (4 or 3→2→1 cols) of light benefit cards (caller icon above serif title + description, hover lift; optional per-card link + "→" line) + optional centred CTA row. */
export { BenefitCards, type BenefitCardItem } from "./benefit-cards";
/** Hairline grid (3→2→1 cols) of light centred stat tiles: count-up serif accent figure + uppercase label + optional caption. */
export { StatTiles, type StatTile } from "./stat-tiles";
/** Bookable-unit card (photo w/ hover zoom, badge, icon+value spec chips, underlined CTA) + its 3→2→1-col grid. */
export { UnitCard, UnitCardGrid, type UnitCardSpec } from "./unit-card";
/** Full-bleed dark feature band: eyebrow/serif heading/line on the left, accent button + small note on the right. */
export { ActionBand, type ActionBandCta } from "./action-band";
/** Hairline grid (4→2→1 cols) of compact amenity cells: caller icon (svg sized 22px, accent-deep) beside a 15px label. */
export { AmenityGrid, type AmenityGridItem } from "./amenity-grid";
/** Grid (3→2→1 cols) of bordered, rounded, centred certification cards: caller logo slot (48px, img auto-sized, hover scale) + serif name + uppercase accent issuer + description, hover lift. */
export { CertificationCards, type CertificationCardItem } from "./certification-cards";
/** Grid (3→1 cols) of bordered option cards: serif title + uppercase tagline + hairline checklist, hover lift, optional featured card w/ floating pill badge. */
export { ChecklistCards, type ChecklistCard } from "./checklist-cards";
/** Borderless rounded photo mosaic (`2fr 1fr 1fr`, first photo a 2-row lead tile; 2 cols ≤680px) — caller-built images; `adaptive` = count-aware 1/2/3/4/5+ layouts at fixed heights + bottom-right `overlay` slot. */
export { MosaicGallery, MOSAIC_ADAPTIVE_MAX } from "./mosaic-gallery";
/** Hairline grid of 1–2 solid CTA panels (light `surface` / dark `feature`): eyebrow, serif title, body, ink or accent button, contact line. */
export { SplitCtaPanels, type SplitCtaPanel } from "./split-cta-panels";
/** Editorial intro split: serif headline + lede + paragraphs + optional inline accent badge (caller icon) beside one full-height cover image (1.05fr/.95fr → 1 col ≤880px). */
export { IntroSplit, type IntroSplitBadge } from "./intro-split";
/** Standard section head (mock `.sec-head`): optional uppercase eyebrow, serif `<h2>` title, optional lede; left or centred, 720px max. */
export { SectionHead } from "./section-head";
/** The one site-wide FAQ accordion: centred `max-w-3xl` column of hairline native `<details>` rows (serif question + rotating accent "+", ink-soft answer) — bare, caller owns shell/head/JSON-LD. */
export { FaqAccordion, type FaqAccordionItem } from "./faq-accordion";
/** Closing enquiry section: serif title + lede + hairline "contact directly" block beside a form slot (.85fr/1.15fr → 1 col), each column optionally revealed. */
export { EnquirySplit, type EnquiryContactLine } from "./enquiry-split";
/** Form-card primitives: raised (or `bare`) card `<form>` w/ light/dark `tone` (+ `FormToneScope`), titled groups w/ pill tag, label-over-control fields (req marker, error line), 2-up row, `<details>` optional sections, inputs/selects (opt. chevron)/textarea, accent button + full-width submit (disabled/pending) + note, ok/error outcome message, consent checkbox line, controlled −/+ number stepper, wizard progress bars. */
export {
  FormAccordion,
  FormButton,
  FormCard,
  FormCheckbox,
  FormField,
  FormGroup,
  FormInput,
  FormMessage,
  FormNote,
  FormProgress,
  FormRow,
  FormSelect,
  FormStepper,
  FormSubmit,
  FormTextarea,
  FormToneScope,
  type FormSelectOption,
  type FormTone,
} from "./form-card";
/** Hairline `.9fr/1.1fr` split (→ 1 col ≤980px): dark info panel (title + label/value rows) beside a light panel (title + intro + form slot). */
export { ContactSplit, type ContactSplitRow } from "./contact-split";
/** Light, centred page header band (eyebrow + `<h1>` + lede + optional slot), the photo-less counterpart of `Hero`. */
export { PageHead } from "./page-head";
/** Pill search field for `PageHead`'s slot: `<form role="search">` + `<input name="q">`; inert (GET to the current URL) until search lands. */
export { PageHeadSearch } from "./page-head";
/** Left-aligned detail-page title block: breadcrumb, eyebrow, serif `<h1>`, tagline, dot-separated meta line (caller nodes). */
export { DetailTitle, type DetailTitleCrumb } from "./detail-title";
/** Key-facts grid (2 → 1 cols ≤560px): 44px round hairline icon disc (caller svg) + bold title + optional note. */
export { IconFactGrid, type IconFactItem } from "./icon-fact-grid";
/** Detail-page body grid: content column beside a fixed 380px aside (`minmax(0,1fr) 380px` → 1 col ≤980px), standard column + vertical padding. */
export { DetailLayout } from "./detail-layout";
/** Sticky (≥981px, `top:96px`) raised hairline card shell for a detail page's aside column — caller content. */
export { StickyAside } from "./sticky-aside";
/** Content-column block: optional eyebrow + serif `<h2>` + body, 40px padding, hairline top border between blocks (first drops it). */
export { ContentBlock } from "./content-block";
/** Detail-page table of contents (client): uppercase head + `#id` links on a hairline rail, the entry being read highlighted; `collapsible` = the closed mobile `<details>` card above the content. */
export { TocList, type TocItem } from "./toc-list";
/** Tinted inline note with a 2px left rule (accent / accent-deep for `warning` / line for `note`): caller icon, uppercase label, body. The blog `callout` block and the guide "Local tip". */
export { Callout, type CalloutVariant } from "./callout";
/** CTA closing a detail `StickyAside` under its TOC: optional 16:10 photo (caller node), eyebrow, serif title, copy, full-width accent button. */
export { AsideCta } from "./aside-cta";
