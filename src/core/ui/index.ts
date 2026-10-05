/**
 * Public surface of the in-repo design system (`core/ui`). Premium/boutique
 * primitives (design-system.md). Slices compose these — they don't re-implement
 * shared chrome. Token values live in `app/globals.css` `@theme`.
 */
export { cn } from "./cn";
export { Container } from "./container";
export { Section } from "./section";
export { Eyebrow } from "./eyebrow";
export { ButtonLink } from "./button";
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
