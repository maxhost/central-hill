/**
 * `real_estate` page content schema (ADR 0012). Source-locale values only.
 *
 * Most of the page body (asset-classes / enquiry) is still a STATIC marketing layout in the
 * renderer (`ui/real-estate-page.tsx`). The DB-driven, editable parts are the **hero**, the
 * **partners** section ("Built for Institutional Partners" — an Editorial-Split block
 * modelled on the Owners "why" section: sticky title + two CTAs beside a four-item
 * benefit list), the **market** section ("Portugal: One of Europe's Strongest Hospitality
 * Markets" — the dynamic Why-Portugal bento), and the optional **FAQ group**. Re-add a
 * further section here when it becomes DB-driven. See docs/data-model.md → Page content
 * model → real_estate.
 */
import { z } from "zod";
import { ctaWithNote, mediaId, tStr, tStrOpt } from "@core/validation/primitives";
import { between, faqGroupKey, fixed, iconCard } from "./_shared";

/**
 * An image reference that may be left unset. An empty string means "no asset yet" — the
 * public render falls back to the approved mock photo (R2 isn't wired yet). Accepts a
 * `media_asset.id` once uploaded. `.describe()` becomes the admin uploader hint.
 */
const optionalImage = (hint: string) => z.union([z.literal(""), mediaId]).describe(hint);
const ASSET_IMG_HINT =
  "Lifestyle photo for the Asset Types showcase. Portrait 4:5 — recommended 1200×1500px, JPG or WebP, under 500 KB.";
const CAPABILITIES_IMG_HINT =
  "Photo for the Institutional-Grade Management showcase (rendered on the LEFT). Portrait 4:5 — recommended 1200×1500px, JPG or WebP, under 500 KB.";

export const realEstateSchema = z.object({
  hero: z.object({
    image_media_id: mediaId,
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    positioning: tStr({ max: 600 }),
    capability_statement_media_id: mediaId.optional(),
    cta_primary: z.object({ label: tStr({ max: 80 }), url: z.url() }),
    cta_secondary: z.object({ label: tStr({ max: 80 }), url: z.url() }),
  }),
  // "Built for Institutional Partners" — Editorial Split (sticky headline + subheadline +
  // two CTAs beside a hairline benefit list). Mirrors the Owners `why` section; the four
  // benefits are the four institutional partner types. Icons are positional in the
  // renderer (the design SVGs never change) — `icon_key` is stored but not rendered.
  partners: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 4),
    cta_primary: ctaWithNote,
    cta_secondary: ctaWithNote,
  }),
  // "Institutional-Grade Management, End to End" — Image Showcase, MIRRORED (image on the
  // LEFT, text on the right): headline + subheadline + three capability highlights (single
  // column, longer copy) + CTA beside a 4:5 photo with an optional floating reassurance badge
  // (the CTA note). Same DB-driven shape as `asset_management`; the renderer flips the columns
  // via the `reverse` modifier. Benefit icons are positional in the renderer; `icon_key` is
  // stored but not rendered. See `ui/real-estate-page.tsx` → `showcase`.
  capabilities: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 3),
    image_media_id: optionalImage(CAPABILITIES_IMG_HINT),
    cta: ctaWithNote,
  }),
  // "A Management Partner for Every Asset Type" — Image Showcase (the home guests-pitch /
  // owners services layout): headline + subheadline + six benefit highlights (2-col grid) +
  // CTA beside a 4:5 lifestyle image with a floating reassurance badge (the CTA note). Benefit
  // icons are positional in the renderer; `icon_key` is stored but not rendered.
  asset_management: z.object({
    headline: tStr({ max: 160 }),
    subheadline: tStrOpt({ max: 280 }),
    benefits: fixed(iconCard, 6),
    image_media_id: optionalImage(ASSET_IMG_HINT),
    cta: ctaWithNote,
  }),
  // "Deal Structures Built Around Your Risk Profile" — the three partnership-model cards
  // (Fixed Rent / Management Commission / Hybrid). Each card is a name + tagline + a bullet
  // list of terms; one card may be visually highlighted (`featured` + its `feature_label`
  // badge). Fully DB-driven. See `ui/real-estate-page.tsx` → `dealStructuresSection`.
  deal_structures: z.object({
    headline: tStr({ max: 160 }),
    /** Centered lede under the section title (blank = none). */
    subheadline: tStrOpt({ max: 600 }),
    /** Exactly three model cards (the design is a fixed three-column grid). */
    models: fixed(
      z.object({
        name: tStr({ max: 80 }),
        /** Short positioning line under the name (e.g. "Guaranteed income, maximum certainty"). */
        tagline: tStr({ max: 120 }),
        /** Highlight this card (accent border + badge). Typically only one card. */
        featured: z.boolean(),
        /** Badge text shown when `featured` (e.g. "Most Flexible"); blank = no badge. */
        feature_label: tStrOpt({ max: 40 }),
        /** The card's bullet list of contract terms (3–10 points). */
        points: between(tStr({ max: 200 }), 3, 10),
      }),
      3,
    ),
    /** Small disclaimer under the cards (blank = none). */
    note: tStrOpt({ max: 400 }),
  }),
  // "Portugal: One of Europe's Strongest Hospitality Markets" — the Why-Portugal section,
  // rendered as a dynamic asymmetric bento (a tall "fundamentals" feature card carrying three
  // headline stats, beside a regulatory cell and an investment-thesis bullet list). Fully
  // DB-driven so the section text, the three stats, and the thesis points are editable in the
  // backoffice. See `ui/real-estate-page.tsx` → `marketSection`.
  market: z.object({
    headline: tStr({ max: 160 }),
    /** The intro lede under the section title (blank = none). */
    subheadline: tStrOpt({ max: 600 }),
    /** The three headline figures shown across the feature card's stat strip. */
    stats: fixed(
      z.object({
        value: tStr({ max: 40 }),
        label: tStr({ max: 160 }),
      }),
      3,
    ),
    /** Feature card: title + two supporting paragraphs (sits beside the stat strip). */
    fundamentals: z.object({
      title: tStr({ max: 120 }),
      body: fixed(tStr({ max: 600 }), 2),
    }),
    /** Regulatory cell: title + one paragraph. */
    regulatory: z.object({
      title: tStr({ max: 120 }),
      body: tStr({ max: 600 }),
    }),
    /** Investment-thesis cell: title + 3–8 bullet points. */
    thesis: z.object({
      title: tStr({ max: 120 }),
      points: between(tStr({ max: 200 }), 3, 8),
    }),
  }),
  // "Performance You Can Measure" — the track-record stat tiles (3–6). Each tile shows a
  // figure that counts up on scroll-in: the admin authors the displayed `value` (e.g. "85%+",
  // "+25%", "24/7") and the renderer derives the count-up target/prefix/suffix from it (see
  // `ui/real-estate-page.tsx` → `trackRecordSection`). Fully DB-driven.
  track_record: z.object({
    headline: tStr({ max: 160 }),
    /** Lede under the section title (blank = none). */
    subheadline: tStrOpt({ max: 600 }),
    tiles: between(
      z.object({
        /** The displayed figure, e.g. "85%+", "+25%", "24/7", "100%". The numeric part drives
         * the count-up animation; the exact string is shown when the animation settles. */
        value: tStr({ max: 40 }),
        /** Bold label under the figure, e.g. "Average Occupancy". */
        label: tStr({ max: 80 }),
        /** Supporting caption under the label (blank = none). */
        caption: tStrOpt({ max: 160 }),
      }),
      3,
      6,
    ),
  }),
  // "A Structured Path from First Conversation to Full Performance" — the onboarding process,
  // rendered as an Editorial Split (sticky headline + lede + a single CTA beside a numbered
  // step list) that reuses the partners section's `partner-pitch` shell. The step numbers
  // (01, 02, …) are positional — derived from the step order in the renderer — so only each
  // step's title + description are data-driven. Fully DB-driven. See
  // `ui/real-estate-page.tsx` → `processSection`.
  process: z.object({
    headline: tStr({ max: 160 }),
    /** Lede under the section title (blank = none). */
    subheadline: tStrOpt({ max: 600 }),
    /** The single accent CTA button (anchors to the enquiry form). */
    cta: z.object({ label: tStr({ max: 80 }) }),
    /** The numbered onboarding steps (3–8). Numbers are derived from order, not stored. */
    steps: between(
      z.object({
        title: tStr({ max: 120 }),
        description: tStr({ max: 600 }),
      }),
      3,
      8,
    ),
  }),
  /** Optional FAQ group to show on the page (blank = none). */
  faq_group_key: faqGroupKey,
});

export type RealEstateContent = z.infer<typeof realEstateSchema>;

/**
 * Canonical source-locale content for the `capabilities` section. Single source of truth
 * shared by the seed (`scripts/seed-demo.ts`), the renderer's fallback (so a `real_estate`
 * row authored before this section existed still renders the approved copy), and the
 * one-off backfill (`scripts/backfill-real-estate-sections.ts`). `image_media_id` is
 * intentionally blank — the render falls back to the approved mock photo until an R2 asset
 * is set in the backoffice.
 */
export const defaultCapabilities: RealEstateContent["capabilities"] = {
  headline: "Institutional-Grade Management, End to End",
  subheadline:
    "We operate at the intersection of hospitality excellence and real estate performance. Our capabilities cover every dimension of asset management — from technology and distribution to operations and strategic partnership.",
  benefits: [
    {
      icon_key: "stats-up-square",
      title: "Digital Excellence",
      description:
        "Multi-platform distribution across Airbnb, Booking.com, and direct channels. AI-powered dynamic pricing updated daily. Automated financial reporting, occupancy analytics, and a real-time performance dashboard accessible by asset managers and fund controllers.",
    },
    {
      icon_key: "settings",
      title: "Operational Mastery",
      description:
        "Professional housekeeping and linen services. 24/7 guest concierge. Premium amenities and quality assurance protocols. Regular property inspections. Rapid-response maintenance with preventive asset protection built into every management contract.",
    },
    {
      icon_key: "peace-hand",
      title: "Strategic Partnership",
      description:
        "Project design consultancy at the planning stage. Dedicated account management throughout the contract term. Performance benchmarking against market comparables. Proactive recommendations for yield improvement and capital expenditure prioritisation.",
    },
  ],
  image_media_id: "",
  cta: {
    label: "Discuss a Partnership",
    url: "https://www.centralhill.pt/en/real-estate",
    note: "End-to-end management — technology, operations, and partnership under one roof.",
  },
};

/**
 * Canonical source-locale content for the `deal_structures` section. Shared by the seed,
 * the renderer fallback, and the backfill — same role as {@link defaultCapabilities}.
 */
export const defaultDealStructures: RealEstateContent["deal_structures"] = {
  headline: "Deal Structures Built Around Your Risk Profile",
  subheadline:
    "We offer three core partnership models designed to align with different investment strategies, risk appetites, and return expectations. All models include full management, technology access, and institutional reporting.",
  models: [
    {
      name: "Fixed Rent",
      tagline: "Guaranteed income, maximum certainty",
      featured: false,
      feature_label: "",
      points: [
        "Guaranteed monthly rent regardless of occupancy",
        "Contract terms: 10–25 years",
        "Zero revenue variability — full income certainty",
        "Ideal for funds requiring predictable cash flows",
        "Asset maintenance obligations shared",
        "Annual rent review mechanism",
        "Full operational management by Central Hill",
      ],
    },
    {
      name: "Management Commission",
      tagline: "Maximum upside, pure performance",
      featured: true,
      feature_label: "Most Flexible",
      points: [
        "Revenue-based model: total receipts minus management fee",
        "Contract terms: 3–25 years",
        "Owner captures full revenue upside",
        "Transparent monthly reporting and payouts",
        "Ideal for operators seeking market-rate returns",
        "Performance KPIs agreed at contract stage",
        "Full operational management by Central Hill",
      ],
    },
    {
      name: "Hybrid Model",
      tagline: "Balanced risk and reward",
      featured: false,
      feature_label: "",
      points: [
        "Guaranteed base rent plus revenue share above threshold",
        "Contract terms: 10–25 years",
        "Downside protection with upside participation",
        "Ideal for funds seeking blended return profiles",
        "Revenue share trigger agreed at contract stage",
        "Regular performance review meetings",
        "Full operational management by Central Hill",
      ],
    },
  ],
  note: "All partnership models are subject to individual asset assessment and negotiation. Contract structures, commission rates, and performance targets are agreed on a case-by-case basis.",
};

/**
 * Canonical source-locale content for the `track_record` section. Shared by the seed,
 * the renderer fallback, and the backfill — same role as {@link defaultCapabilities}.
 */
export const defaultTrackRecord: RealEstateContent["track_record"] = {
  headline: "Performance You Can Measure",
  subheadline:
    "Our track record is built on consistent, data-driven results across a growing portfolio of managed assets. We report transparently, benchmark rigorously, and continuously optimise performance for every asset under management.",
  tiles: [
    { value: "85%+", label: "Average Occupancy", caption: "Across all managed properties year-round" },
    { value: "+25%", label: "Revenue Premium", caption: "Vs. traditional residential letting" },
    { value: "24/7", label: "Operational Coverage", caption: "Guest support, reporting, and management" },
    { value: "10+", label: "Years of Experience", caption: "Managing assets in Portugal's prime markets" },
    { value: "14+", label: "Buildings Managed", caption: "Across Lisbon's most in-demand locations" },
    { value: "100%", label: "Transparent Reporting", caption: "Real-time dashboard access for all partners" },
  ],
};

/**
 * Canonical source-locale content for the `process` section. Shared by the seed, the renderer
 * fallback, and the backfill — same role as {@link defaultCapabilities}.
 */
export const defaultProcess: RealEstateContent["process"] = {
  headline: "A Structured Path from First Conversation to Full Performance",
  subheadline:
    "Our onboarding process is designed for institutional partners. Every step is documented, timeline-driven, and managed by a dedicated account team.",
  cta: { label: "Start the Conversation" },
  steps: [
    {
      title: "Asset Assessment & Commercial Proposal",
      description:
        "We conduct a detailed assessment of your asset — location, unit mix, current performance, and market positioning — and present a tailored commercial proposal including projected yield, recommended partnership model, and contract terms.",
    },
    {
      title: "Due Diligence & Contract Negotiation",
      description:
        "Our legal and commercial team works with your advisors to structure and finalise the management agreement. All performance KPIs, reporting cadence, revenue share triggers, and exit terms are agreed and documented.",
    },
    {
      title: "Operational Onboarding",
      description:
        "We handle all elements of the operational setup: professional photography, platform registration and listing creation, pricing strategy implementation, staff assignment, and property preparation — typically completed within 10–15 business days.",
    },
    {
      title: "Asset Goes Live",
      description:
        "Your property launches across all distribution channels simultaneously. AI-powered pricing begins optimising daily rates from day one. Your account manager is active and reporting from the first booking.",
    },
    {
      title: "Ongoing Management & Reporting",
      description:
        "Monthly performance reports delivered to your agreed format. Quarterly review meetings with your account manager. Continuous yield optimisation and strategic recommendations as market conditions evolve.",
    },
  ],
};
