/**
 * `about` page content schema (ADR 0012). Source-locale values only.
 *
 * Mirrors the rendered page (`ui/about-page.tsx`, `mock/about.html`) section by section. Every
 * image is optional: blank falls back to the approved mock photo (R2 assets not uploaded yet).
 * Composed at render time: the office panel → company_settings; the contact form fields are
 * fixed in code → lead.kind='contact'. Team/departments, certifications and stats are static
 * copy here — not entities (confirmed against the brief).
 *
 * `defaultAbout` is the copy the page showed while it was hard-coded. It is the single source
 * for the seed, the renderer fallback (no row yet) and `scripts/backfill-about-content.ts`.
 * See docs/data-model.md → Page content model → about.
 */
import { z } from "zod";
import { iconKey } from "@core/validation/icon-key";
import { seoShape, tStr, tStrOpt } from "@core/validation/primitives";
import { between, faqGroupKey, fixed, iconCard, optionalImage, titledItem } from "./_shared";

/*
 * Uploader guidance surfaced in the admin media pickers (form-model reads `.describe`). Sizes
 * measured on `/en/about` with Playwright at 1440 / 1024 / 390 px (spec about-admin-editor S2):
 * - Hero (`Hero compact`, `object-cover`): a band 576 px tall — 1920×576 / 1440×576 / 1024×576
 *   (16:9) on desktop–tablet, 390×630 portrait on a phone. Always cropped.
 * - Story / community (`IntroSplit` media cell, `object-cover`): ~536 px wide on desktop, 433 at
 *   1024, full width (824 at 880, 334 at 390) on tablet/phone. Its height is the larger of the
 *   text column (story 625 / 682 px, community 511 / 559 px at 1440 / 1024), the photo's own
 *   height at that width and a 380 px (280 px on tablet/phone) minimum — so a 4:5 photo shows
 *   uncropped on desktop and phone, and is cropped at the sides only where the text is taller.
 * - Organisation (`TwoColumnShowcase`): fixed `aspect-[4/5]` — 560×700 / 452×565 / 334×418
 *   (824×1030 at 880). Cropped to 4:5.
 * - Audience cards (`PhotoFeatureGrid`, CSS `bg-cover bg-center` under a dark scrim):
 *   377×287 (3 columns) / 305×333 (3 columns) / 334×287–310 (1 column), 399×287 at 880
 *   (2 columns) — between ~0.9:1 and 1.3:1, so 4:3 is the safest source. Always centre-cropped.
 */
const HERO_IMG_HINT =
  "Full-bleed hero photo behind the headline, cropped to fill — a wide band about 1440×576 px on a laptop (1920×576 on large screens, 16:9 on tablet, portrait 390×630 on phones), so keep the subject centred. Landscape 16:9 — 1920×1080 px (min 1600×900), JPG or WebP, under 500 KB.";
/** `IntroSplit` cell (story, community): the photo's own shape sets the height unless the text is taller. */
const SPLIT_IMG_HINT =
  "Photo beside the text, about 536 px wide on desktop and full width on phones. Portrait 4:5 shows uncropped on desktop and phones; where the text column is taller (tablet) the sides are cropped, so keep the subject centred. Portrait 4:5 — 1200×1500 px (min 960×1200), JPG or WebP, under 500 KB.";
/** `TwoColumnShowcase` photo (organisation): a fixed 4:5 frame. */
const SHOWCASE_IMG_HINT =
  "Photo beside the departments, in a fixed 4:5 frame (560×700 px on desktop, 334×418 on phones) — other shapes are cropped to fit. Portrait 4:5 — 1200×1500 px (min 960×1200), JPG or WebP, under 500 KB.";
const AUDIENCE_IMG_HINT =
  "Card background (a dark overlay is applied, centre-cropped). The card is about 377×287 px on desktop, 305×333 on tablet and 334×300 on phones. Landscape 4:3 — 1200×900 px (min 800×600), JPG or WebP, under 300 KB.";
/** Per-photo alt (spec about-admin-editor S2): blank → `pages.about.alts.<section>`. */
const imageAlt = (fallback: string) =>
  tStrOpt({ max: 160 }).describe(
    `Describe the photo for screen readers and search. Leave blank for “${fallback}”.`,
  );
/*
 * Certification logo (`CertificationCards` logo slot): a fixed 48 px-tall box, at most 160 px
 * wide, the image scaled to fit (`object-contain`). The media upload pipeline accepts JPEG, PNG,
 * WebP and AVIF only (`core/media/mime.ts` → `IMAGE_MIMES`) — no SVG — so the hint asks for a
 * transparent PNG. 300 px wide covers the 160 px slot at 2× density.
 */
const LOGO_HINT =
  "Issuer logo on a transparent background, PNG (SVG is not accepted). Shown in a slot 48 px tall and up to 160 px wide — upload at least 300 px wide, under 100 KB. Blank shows the card's icon.";

/** A company figure in the stats band (`value` is displayed as authored; numbers count up). */
const stat = z.object({
  value: tStr({ max: 40 }),
  label: tStr({ max: 80 }),
});

/** An org department/team unit (uses `name`, not `title`). */
const department = z.object({
  icon_key: iconKey,
  name: tStr({ max: 120 }),
  description: tStr({ max: 400 }),
});

/** A certification/accreditation (issuer is a proper noun → not translated). */
const certification = z.object({
  /** Shown only when the card has no logo. */
  icon_key: iconKey,
  logo_media_id: optionalImage(LOGO_HINT),
  /** Optional (S4): the logo's alt text. Blank → the row's `issuer`. */
  logo_alt: tStrOpt({ max: 160 }).describe(
    "Describe the logo for screen readers and search. Leave blank to use the issuer name.",
  ),
  title: tStr({ max: 120 }),
  issuer: z.string().min(1).max(120),
  description: tStr({ max: 400 }),
});

/**
 * A "Let's Start a Conversation" card. The destination is fixed by position (guests →
 * buildings, owners → owners, partners → real estate) so it stays on the visitor's locale.
 */
const contactCard = z.object({
  icon_key: iconKey,
  title: tStr({ max: 120 }),
  description: tStr({ max: 400 }),
  link_label: tStr({ max: 80 }),
});

/*
 * Optional copy overrides added by spec `about-admin-editor` S1 (`seo`, `faq`). Both are optional
 * and blank-tolerant: empty / absent → the page renders the current i18n message of the
 * visitor's locale, so a row saved before these keys existed renders exactly as before.
 */
/** An office-panel row label (S3): optional, blank → the i18n default named in the hint. */
const officeLabel = (enDefault: string) =>
  tStrOpt({ max: 40 }).describe(`Leave blank for “${enDefault}”.`);

export const aboutSchema = z.object({
  /** Search/social meta for `/<locale>/about`. Blank → `pages.about.metaTitle` / `metaDescription`. */
  seo: z.object({ ...seoShape }).optional(),
  hero: z.object({
    image_media_id: optionalImage(HERO_IMG_HINT),
    /** Optional (S2): blank → `pages.about.alts.hero`. */
    image_alt: imageAlt("Rooftops and historic streets of Lisbon at golden hour"),
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    mission: tStr({ max: 600 }),
  }),
  story: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    narrative: fixed(tStr({ max: 1200 }), 3),
    image_media_id: optionalImage(SPLIT_IMG_HINT),
    /** Optional (S2): blank → `pages.about.alts.story`. */
    image_alt: imageAlt("Traditional tiled façades along a historic Lisbon street"),
  }),
  stats: fixed(stat, 5),
  serve: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    audiences: fixed(iconCard.extend({ image_media_id: optionalImage(AUDIENCE_IMG_HINT) }), 3),
  }),
  values: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    items: fixed(titledItem, 4),
  }),
  organisation: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    /** Floating label on the photo (blank = none). */
    badge: tStrOpt({ max: 80 }),
    image_media_id: optionalImage(SHOWCASE_IMG_HINT),
    /** Optional (S2): blank → `pages.about.alts.organisation`. */
    image_alt: imageAlt("Team reviewing property performance documents together"),
    departments: fixed(department, 6),
  }),
  certifications: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    intro: tStrOpt({ max: 600 }),
    /** Variable since S4: 1–12 rows (the 3 legacy rows stay valid). Add/remove in the editor. */
    items: between(certification, 1, 12),
  }),
  community: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    copy: fixed(tStr({ max: 1200 }), 2),
    image_media_id: optionalImage(SPLIT_IMG_HINT),
    /** Optional (S2): blank → `pages.about.alts.community`. */
    image_alt: imageAlt("People sharing a meal together at a community table in Lisbon"),
  }),
  contact: z.object({
    eyebrow: tStrOpt({ max: 80 }),
    headline: tStr({ max: 160 }),
    cards: fixed(contactCard, 3),
    office_title: tStr({ max: 80 }),
    /**
     * Optional (S3): the office panel's row labels. Blank → `pages.about.office.<key>`. The
     * values come from Settings (address, phones, email, website); a blank Settings value hides
     * its row.
     */
    office_labels: z
      .object({
        address: officeLabel("Address"),
        bookings: officeLabel("Bookings"),
        checkin: officeLabel("Check-in"),
        email: officeLabel("Email"),
        website: officeLabel("Website"),
      })
      .optional(),
    form: z.object({
      headline: tStr({ max: 160 }),
      subheadline: tStrOpt({ max: 280 }),
    }),
  }),
  /** Optional FAQ group to show on the page (blank = none). */
  faq_group_key: faqGroupKey,
  /** FAQ section heading (the group stays in `faq_group_key`). Blank → `pages.faqTitle`. */
  faq: z
    .object({ title: tStrOpt({ max: 160 }).describe("Leave blank for “Frequently Asked Questions”.") })
    .optional(),
});

export type AboutContent = z.infer<typeof aboutSchema>;

/** What the page showed while hard-coded (see the module docstring). */
export const defaultAbout: AboutContent = {
  hero: {
    image_media_id: "",
    eyebrow: "Who We Are",
    headline: "Portugal's Hospitality Management Company.",
    mission:
      "Since 2012, Central Hill Apartments has been turning properties into high-performing hospitality assets — and turning guests into people who feel genuinely at home. We manage short-term, mid-term, and corporate rentals across Portugal's most sought-after locations, combining deep local knowledge with AI-driven technology and an uncompromising commitment to quality.",
  },
  story: {
    eyebrow: "How We Started",
    headline: "From a Clear Vision to a Growing Platform",
    narrative: [
      "Central Hill Apartments was founded in 2012, identifying Lisbon as a city of exceptional hospitality opportunity — a destination where guests wanted more than a hotel room; they wanted to feel genuinely part of the city. We started with that conviction and a clear operational model: that professional, data-driven management of well-located residential assets could consistently outperform the market while delivering an experience worth returning to.",
      "Over more than a decade, that process has produced one of Portugal's most established hospitality management platforms. We have built the operational infrastructure, the technology stack, and the institutional relationships needed to manage assets at scale — from individual apartments to full buildings, corporate housing programmes, and strategic real estate partnerships.",
      "Today, Central Hill operates across Portugal's most in-demand urban markets, delivering consistent above-market returns for property owners, dependable occupancy for corporate clients, and institutional-grade performance for investment partners. The company we are now is the direct result of the discipline, systems, and expertise built over twelve years of active asset management.",
    ],
    image_media_id: "",
  },
  stats: [
    { value: "2012", label: "Year Founded" },
    { value: "40+", label: "Apartments Managed" },
    { value: "14", label: "Buildings in Prime Locations" },
    { value: "60,000+", label: "Guests Hosted Worldwide" },
    { value: "6,000+", label: "Reservations per Year" },
  ],
  serve: {
    eyebrow: "Our Platform",
    headline: "One Platform. Three Audiences.",
    intro:
      "Central Hill Apartments operates across three interconnected service lines, each supporting the others. Whether you are a guest looking for a home away from home, a property owner seeking to maximise your asset's potential, or an institutional partner exploring a management agreement — this is your platform.",
    audiences: [
      {
        icon_key: "suitcase",
        title: "For Guests",
        description:
          "Professionally managed, fully equipped apartments in Portugal's most desirable locations. Every property is quality-checked, consistently maintained, and backed by 24/7 support — so every stay is exactly what it should be.",
        image_media_id: "",
      },
      {
        icon_key: "home",
        title: "For Property Owners",
        description:
          "Full-service property management that removes every burden and maximises every opportunity. AI-driven dynamic pricing, professional photography, 24/7 guest management, maintenance, and a real-time performance dashboard — all included.",
        image_media_id: "",
      },
      {
        icon_key: "bank",
        title: "For Institutional Partners",
        description:
          "Flexible management structures designed for investment funds, developers, and large-scale operators. Fixed rent, management commission, or hybrid models — with full operational management, transparent reporting, and institutional-grade governance.",
        image_media_id: "",
      },
    ],
  },
  values: {
    eyebrow: "What We Stand For",
    headline: "What Guides Us",
    intro:
      "Our values are not statements on a wall. They are the criteria by which we select properties, build partnerships, and measure success. They have remained constant since 2012.",
    items: [
      {
        title: "Quality Without Compromise",
        description:
          "We apply the same standard of care to every property we manage — in its presentation, its maintenance, and its guest experience.",
      },
      {
        title: "Transparency in Everything",
        description:
          "Owners have real-time access to performance data. Partners receive full, accurate reporting. Trust is built through information, not withheld by it.",
      },
      {
        title: "Local Knowledge, Applied",
        description:
          "Over a decade learning Portugal's hospitality markets — their rhythms, their regulations, and their opportunities. That knowledge shapes every decision we make.",
      },
      {
        title: "People at the Centre",
        description:
          "Great hospitality is ultimately about people. We invest in our team, care for our guests, respect our owners' assets, and take our role in the community seriously.",
      },
    ],
  },
  organisation: {
    eyebrow: "Our Structure",
    headline: "How We Are Organised",
    intro:
      "Behind every well-managed property is a team of specialists working in close coordination. Central Hill Apartments is structured around six areas of expertise, each essential to the performance of every asset we manage.",
    badge: "Six departments. One coordinated platform.",
    image_media_id: "",
    departments: [
      {
        icon_key: "settings",
        name: "Operations & Property Management",
        description:
          "Manages day-to-day property performance, housekeeping, maintenance, and quality inspections across all buildings.",
      },
      {
        icon_key: "bell",
        name: "Guest Experience & Support",
        description:
          "Available 24/7, ensuring every guest interaction — from pre-arrival to post-checkout — is handled with care and professionalism.",
      },
      {
        icon_key: "peace-hand",
        name: "Owner Relations & Partnerships",
        description:
          "The dedicated point of contact for property owners, institutional partners, and corporate clients throughout the management relationship.",
      },
      {
        icon_key: "graph-up",
        name: "Revenue & Pricing Technology",
        description:
          "Combines AI-powered dynamic pricing with hands-on revenue strategy to optimise nightly rates and occupancy across all platforms.",
      },
      {
        icon_key: "wrench",
        name: "Maintenance & Asset Protection",
        description:
          "Proactive inspections and rapid-response maintenance protect the long-term value of every asset under our management.",
      },
      {
        icon_key: "clipboard-check",
        name: "Finance & Compliance",
        description:
          "Manages owner payouts, financial reporting, regulatory filings, and certification maintenance with full transparency.",
      },
    ],
  },
  certifications: {
    eyebrow: "What We Stand For",
    headline: "Independently Verified",
    intro:
      "Our certifications and memberships represent a commitment to operating to the highest standards — verified by recognised independent bodies in Portugal and internationally.",
    items: [
      {
        icon_key: "check-circle",
        logo_media_id: "",
        title: "ALEP Member",
        issuer: "Associação do Alojamento Local em Portugal",
        description:
          "National association representing local accommodation operators. Membership signals compliance with industry best practices.",
      },
      {
        icon_key: "check-circle",
        logo_media_id: "",
        title: "Clean & Safe Certified",
        issuer: "Turismo de Portugal",
        description:
          "Quality and safety certification awarded by Portugal's national tourism authority, recognising our hygiene and guest safety standards.",
      },
      {
        icon_key: "check-circle",
        logo_media_id: "",
        title: "I-PRAC Certified",
        issuer: "International Property Rental Approval Certification",
        description:
          "International certification body verifying vacation rental operators worldwide, assuring guests and partners of our professional standards.",
      },
    ],
  },
  community: {
    eyebrow: "Our Responsibility",
    headline: "Giving Back to the Communities We Call Home",
    copy: [
      "Central Hill Apartments is a business rooted in Lisbon, and we take our responsibility to the city and its communities seriously. We are proud partners of 55+ — a Lisbon-based social organisation that empowers people over 55 to remain active and fulfilled — through which we offer guests authentic experiences including Chef at Home services delivered by 55+ members. We also actively support Movimento Famílias Solidárias, a volunteer-led initiative that provides monthly essential goods baskets to families in need across Lisbon.",
      "We additionally work with Santa Casa da Misericórdia de Lisboa, donating items and furniture to support their social care programmes, and maintain ongoing engagement with a number of other local Lisbon organisations through in-kind support, volunteering, and donations.",
    ],
    image_media_id: "",
  },
  contact: {
    eyebrow: "Get in Touch",
    headline: "Let's Start a Conversation",
    cards: [
      {
        icon_key: "suitcase",
        title: "Planning a Stay?",
        description: "Browse our apartments and book directly for the best price.",
        link_label: "Browse Apartments →",
      },
      {
        icon_key: "home",
        title: "Own a Property?",
        description: "Get a free, no-obligation earnings estimate and find out what your property could achieve.",
        link_label: "Get My Free Estimate →",
      },
      {
        icon_key: "bank",
        title: "Institutional Partner?",
        description: "Discuss investment structures, asset management, and partnership models with our team.",
        link_label: "Discuss a Partnership →",
      },
    ],
    office_title: "Our Office",
    form: {
      headline: "Send Us a Message",
      subheadline: "Tell us how we can help and we'll be in touch shortly.",
    },
  },
  faq_group_key: "",
};
