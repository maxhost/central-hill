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
/** Owner/guest "Immersive Panels" closing band — presentational, data composer stays slice-owned. */
export { DualCtaPanels, type DualCtaPanel } from "./dual-cta-panels";
/** Site-wide header chrome (sticky bar + hover-dropdown mechanics) — see `nav-bar.tsx`. */
export { NavBar, type NavLinkEntry } from "./nav-bar";
/** Mobile navigation drawer shell — see `mobile-drawer.tsx`. */
export { MobileDrawer, type NavCta, type NavEntry } from "./mobile-drawer";
/** Property card (image/badge/name/meta/view label) — fed as `Carousel` slides. */
export { PropertyCard } from "./property-card";
/** Presentational stats/count-up band (dark feature band + optional title). */
export { StatBand } from "./stat-band";
