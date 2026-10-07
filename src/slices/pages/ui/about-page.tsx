import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import {
  BenefitCards,
  CertificationCards,
  ContactSplit,
  Hero,
  IntroSplit,
  NumberedFeatureGrid,
  PhotoFeatureGrid,
  Reveal,
  SectionHead,
  StatBand,
  TwoColumnShowcase,
  type BenefitCardItem,
  type CertificationCardItem,
  type ContactSplitRow,
} from "@core/ui";
import { Icon } from "@core/ui/icon";
import { ContactForm } from "@slices/leads/contract";
import { getGlobals, type SiteGlobals } from "@slices/settings/contract";
import { getAboutPage } from "../contract";
import { FaqSection } from "./components/faq-section";

/**
 * About page (`mock/about.html`), fully ported to components — no `.mk` block left. Content is
 * static (no `page_content` row backs About beyond `faq_group_key`), so every string is a
 * literal, as in the original markup. The header/footer and i18n come from the app layout.
 *
 * Every section uses existing `core/ui` components (consistency over mock fidelity):
 * - Hero: `Hero` with the Buildings listing configuration (as on Guests and Real Estate).
 * - "How We Started" and "Giving Back…": `IntroSplit` (`imagePosition="left"`, `eyebrow`).
 * - Company numbers: `StatBand` (`columns={5}`), whose `CountUp` replaces the page's old
 *   `OwnerStatsCounter`.
 * - "One Platform. Three Audiences.": `SectionHead` + `PhotoFeatureGrid`.
 * - "What Guides Us": `SectionHead` + `NumberedFeatureGrid`.
 * - "How We Are Organised": `TwoColumnShowcase` with Owners' showcase configuration.
 * - "Independently Verified": `SectionHead` + `CertificationCards` (the old per-card stagger is
 *   now one `Reveal` fade).
 * - FAQ: the shared `FaqSection` (only when `faq_group_key` is set).
 * - "Let's Start a Conversation": `SectionHead`, then `BenefitCards` as link cards
 *   (`columns={3}`, per-item `href` + `linkLabel`), then `ContactSplit` — the dark office panel
 *   (address / bookings phone / email / office hours from company_settings via `getGlobals`,
 *   so they're edited once in /admin/settings; the check-in phone and website have no settings
 *   field and stay literals) beside the leads slice's `ContactForm` (`source="about-contact"`,
 *   `kind = "contact"` — the same form, validation, consent and success/error states as the
 *   header contact dialog). The mock's form was static (`onsubmit="return false"`); it now
 *   submits a real lead.
 * Every section uses the standard page shell and `SectionHead`; entrance motion is `Reveal`.
 */


// Fixed media for the JSX sections (no `page_content` row backs About; every string below is a
// literal, same as the original markup).
const HERO_IMG =
  "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70";
const HERO_ALT = "Rooftops and historic streets of Lisbon at golden hour";
const STORY_IMG =
  "https://images.pexels.com/photos/19295144/pexels-photo-19295144.jpeg?auto=compress&cs=tinysrgb&w=1200";
const STORY_ALT = "Traditional tiled façades along a historic Lisbon street";
const ORGANISED_IMG =
  "https://images.pexels.com/photos/5324937/pexels-photo-5324937.jpeg?auto=compress&cs=tinysrgb&w=1200";
const ORGANISED_ALT = "Team reviewing property performance documents together";
const COMMUNITY_IMG =
  "https://images.unsplash.com/photo-1591825729269-caeb344f6df2?auto=format&fit=crop&w=900&q=70";
const COMMUNITY_ALT = "People sharing a meal together at a community table in Lisbon";

// Standard page shell (Real Estate, Guests): padding, 84px scroll margin, 1240px/28px column,
// and the warm `alt` band.
const SECTION_SHELL = "scroll-mt-[84px] py-[clamp(72px,10vw,150px)]";
const SECTION_WRAP = "mx-auto max-w-[1240px] px-[28px]";
const ALT_BAND = "bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))]";

/** Iconoir glyph for a `TwoColumnShowcase` bullet, sized like Owners' showcase bullet icons. */
const bulletIcon = (name: string) => (
  <Icon name={name} size={26} className="mt-0.5 flex-none text-accent-deep" />
);

const STATS = [
  { value: "2012", label: "Year Founded" },
  { value: "40+", label: "Apartments Managed" },
  { value: "14", label: "Buildings in Prime Locations" },
  { value: "60,000+", label: "Guests Hosted Worldwide" },
  { value: "6,000+", label: "Reservations per Year" },
];

const SERVE_ITEMS = [
  {
    icon: <Icon name="suitcase" size={30} className="block" />,
    title: "For Guests",
    description:
      "Professionally managed, fully equipped apartments in Portugal's most desirable locations. Every property is quality-checked, consistently maintained, and backed by 24/7 support — so every stay is exactly what it should be.",
    image: "https://images.pexels.com/photos/39205181/pexels-photo-39205181.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    icon: <Icon name="home" size={30} className="block" />,
    title: "For Property Owners",
    description:
      "Full-service property management that removes every burden and maximises every opportunity. AI-driven dynamic pricing, professional photography, 24/7 guest management, maintenance, and a real-time performance dashboard — all included.",
    image: "https://images.pexels.com/photos/7415097/pexels-photo-7415097.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    icon: <Icon name="bank" size={30} className="block" />,
    title: "For Institutional Partners",
    description:
      "Flexible management structures designed for investment funds, developers, and large-scale operators. Fixed rent, management commission, or hybrid models — with full operational management, transparent reporting, and institutional-grade governance.",
    image: "https://images.pexels.com/photos/36733412/pexels-photo-36733412.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
];

// Content for `core/ui`'s `NumberedFeatureGrid` — ported 1:1 from the mock's 4 `.val` cards.
const VALUES_ITEMS = [
  {
    title: "Quality Without Compromise",
    body: "We apply the same standard of care to every property we manage — in its presentation, its maintenance, and its guest experience.",
  },
  {
    title: "Transparency in Everything",
    body: "Owners have real-time access to performance data. Partners receive full, accurate reporting. Trust is built through information, not withheld by it.",
  },
  {
    title: "Local Knowledge, Applied",
    body: "Over a decade learning Portugal's hospitality markets — their rhythms, their regulations, and their opportunities. That knowledge shapes every decision we make.",
  },
  {
    title: "People at the Centre",
    body: "Great hospitality is ultimately about people. We invest in our team, care for our guests, respect our owners' assets, and take our role in the community seriously.",
  },
];

const ORGANISED_BULLETS = [
  {
    icon: bulletIcon("settings"),
    title: "Operations & Property Management",
    description: "Manages day-to-day property performance, housekeeping, maintenance, and quality inspections across all buildings.",
  },
  {
    icon: bulletIcon("bell"),
    title: "Guest Experience & Support",
    description: "Available 24/7, ensuring every guest interaction — from pre-arrival to post-checkout — is handled with care and professionalism.",
  },
  {
    icon: bulletIcon("peace-hand"),
    title: "Owner Relations & Partnerships",
    description: "The dedicated point of contact for property owners, institutional partners, and corporate clients throughout the management relationship.",
  },
  {
    icon: bulletIcon("graph-up"),
    title: "Revenue & Pricing Technology",
    description: "Combines AI-powered dynamic pricing with hands-on revenue strategy to optimise nightly rates and occupancy across all platforms.",
  },
  {
    icon: bulletIcon("wrench"),
    title: "Maintenance & Asset Protection",
    description: "Proactive inspections and rapid-response maintenance protect the long-term value of every asset under our management.",
  },
  {
    icon: bulletIcon("clipboard-check"),
    title: "Finance & Compliance",
    description: "Manages owner payouts, financial reporting, regulatory filings, and certification maintenance with full transparency.",
  },
];

/** "Independently Verified" certifications (`CertificationCards`). */
const CERTIFICATIONS: CertificationCardItem[] = [
  {
    logo: (
      // eslint-disable-next-line @next/next/no-img-element -- external issuer logo, not an R2 asset
      <img
        src="https://d11n7da8rpqbjy.cloudfront.net/alep/19726083_1621536323PF6Ativo_12.png"
        alt="ALEP — Associação do Alojamento Local em Portugal logo"
      />
    ),
    name: "ALEP Member",
    issuer: "Associação do Alojamento Local em Portugal",
    description:
      "National association representing local accommodation operators. Membership signals compliance with industry best practices.",
  },
  {
    logo: (
      // eslint-disable-next-line @next/next/no-img-element -- external issuer logo, not an R2 asset
      <img
        src="https://www.turismodeportugal.pt/Style%20Library/TPortugal16Branding/img/logotipo_institucional_preto.png"
        alt="Turismo de Portugal logo"
      />
    ),
    name: "Clean & Safe Certified",
    issuer: "Turismo de Portugal",
    description:
      "Quality and safety certification awarded by Portugal's national tourism authority, recognising our hygiene and guest safety standards.",
  },
  {
    logo: <Icon name="check-circle" size={40} className="block text-accent-deep" />,
    name: "I-PRAC Certified",
    issuer: "International Property Rental Approval Certification",
    description:
      "International certification body verifying vacation rental operators worldwide, assuring guests and partners of our professional standards.",
  },
];

/** "Let's Start a Conversation" link cards (`BenefitCards`, link variant), one per audience. */
const touchCards = (locale: Locale): BenefitCardItem[] => [
  {
    icon: <Icon name="suitcase" size={30} className="block" />,
    title: "Planning a Stay?",
    description: "Browse our apartments and book directly for the best price.",
    href: `/${locale}/buildings`,
    linkLabel: "Browse Apartments →",
  },
  {
    icon: <Icon name="home" size={30} className="block" />,
    title: "Own a Property?",
    description: "Get a free, no-obligation earnings estimate and find out what your property could achieve.",
    href: `/${locale}/owners`,
    linkLabel: "Get My Free Estimate →",
  },
  {
    icon: <Icon name="bank" size={30} className="block" />,
    title: "Institutional Partner?",
    description: "Discuss investment structures, asset management, and partnership models with our team.",
    href: `/${locale}/real-estate`,
    linkLabel: "Discuss a Partnership →",
  },
];

// Office details company_settings has no field for (or has none set yet) — the mock's literals.
// Address / bookings phone / email fall back to these only if the settings row is missing.
const OFFICE_FALLBACK = {
  address: "Rua da Bempostinha 21A, 1150-065 Lisboa, Portugal",
  phone: "+351 910 075 725",
  email: "info@centralhill.pt",
  hours: "Monday – Friday · 09:30 – 18:00",
};
const CHECKIN_PHONE = "+351 912 310 632"; // no settings field
const WEBSITE = { href: "https://www.centralhill.pt", text: "www.centralhill.pt" }; // no settings field

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** The office panel rows: settings values where company_settings has a field, literals otherwise. */
function officeRows(globals: SiteGlobals | null): ContactSplitRow[] {
  const phone = globals?.phone || OFFICE_FALLBACK.phone;
  const email = globals?.email || OFFICE_FALLBACK.email;
  return [
    { label: "Address", value: globals?.officeAddress || OFFICE_FALLBACK.address },
    { label: "Bookings", value: <a href={telHref(phone)}>{phone}</a> },
    { label: "Check-in", value: <a href={telHref(CHECKIN_PHONE)}>{CHECKIN_PHONE}</a> },
    { label: "Email", value: <a href={`mailto:${email}`}>{email}</a> },
    { label: "Website", value: <a href={WEBSITE.href}>{WEBSITE.text}</a> },
    {
      label: globals?.officeHoursLabel || "Office Hours",
      value: globals?.officeHours || OFFICE_FALLBACK.hours,
    },
  ];
}

export async function AboutPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [page, globals, t] = await Promise.all([
    getAboutPage(locale),
    getGlobals(locale),
    getTranslations("pages"),
  ]);
  const faqGroupKey = page?.content.faq_group_key ?? "";

  return (
    <>
      {/* JS-off fallback: `Reveal` renders hidden until it scrolls into view. */}
      <noscript>
        <style dangerouslySetInnerHTML={{ __html: `[data-reveal]{opacity:1!important;transform:none!important}` }} />
      </noscript>

      {/* Hero: Buildings listing's exact `Hero` configuration (as on Guests and Real Estate). */}
      <Hero
        id="who-we-are"
        background={
          // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
          <img src={HERO_IMG} alt={HERO_ALT} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        }
        compact
        align="center"
        overlayClassName="bg-[linear-gradient(180deg,rgba(18,16,13,0.5)_0%,rgba(18,16,13,0.46)_45%,rgba(18,16,13,0.88)_100%)]"
        wrapClassName="mx-auto max-w-[1600px] p-10"
        copyClassName="max-w-none"
        headlineClassName="max-w-[26ch] text-[clamp(2.5rem,5.4vw,4.25rem)]"
        subtitleClassName="mt-5 max-w-[60ch] text-lg"
        eyebrow="Who We Are"
        headline="Portugal's Hospitality Management Company."
        subtitle="Since 2012, Central Hill Apartments has been turning properties into high-performing hospitality assets — and turning guests into people who feel genuinely at home. We manage short-term, mid-term, and corporate rentals across Portugal's most sought-after locations, combining deep local knowledge with AI-driven technology and an uncompromising commitment to quality."
      />

      {/*
       * "How We Started": `IntroSplit` with the image on the left. The tighter top padding
       * (50px, it sits right under the hero) is the client tweak the old `#story` rule carried.
       */}
      <section id="story" className="scroll-mt-[84px] pt-[50px] pb-[clamp(72px,10vw,150px)]">
        <div className={SECTION_WRAP}>
          <Reveal label="about-story">
            <IntroSplit
              imagePosition="left"
              eyebrow="How We Started"
              headline="From a Clear Vision to a Growing Platform"
              paragraphs={[
                "Central Hill Apartments was founded in 2012, identifying Lisbon as a city of exceptional hospitality opportunity — a destination where guests wanted more than a hotel room; they wanted to feel genuinely part of the city. We started with that conviction and a clear operational model: that professional, data-driven management of well-located residential assets could consistently outperform the market while delivering an experience worth returning to.",
                "Over more than a decade, that process has produced one of Portugal's most established hospitality management platforms. We have built the operational infrastructure, the technology stack, and the institutional relationships needed to manage assets at scale — from individual apartments to full buildings, corporate housing programmes, and strategic real estate partnerships.",
                "Today, Central Hill operates across Portugal's most in-demand urban markets, delivering consistent above-market returns for property owners, dependable occupancy for corporate clients, and institutional-grade performance for investment partners. The company we are now is the direct result of the discipline, systems, and expertise built over twelve years of active asset management.",
              ]}
              image={
                // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
                <img src={STORY_IMG} alt={STORY_ALT} loading="lazy" decoding="async" />
              }
            />
          </Reveal>
        </div>
      </section>

      {/* Company numbers: the same `StatBand` as Home/Owners/Buildings, five columns. */}
      <Reveal label="about-stats">
        <StatBand cells={STATS} columns={5} />
      </Reveal>

      {/* "One Platform. Three Audiences.": `SectionHead` + `PhotoFeatureGrid` (Guests' teasers). */}
      <section id="serve" className={`${SECTION_SHELL} ${ALT_BAND}`}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead
              eyebrow="Our Platform"
              headline="One Platform. Three Audiences."
              intro="Central Hill Apartments operates across three interconnected service lines, each supporting the others. Whether you are a guest looking for a home away from home, a property owner seeking to maximise your asset's potential, or an institutional partner exploring a management agreement — this is your platform."
            />
          </Reveal>
          <Reveal label="about-serve">
            <PhotoFeatureGrid items={SERVE_ITEMS} />
          </Reveal>
        </div>
      </section>

      {/* "What Guides Us": `SectionHead` + `NumberedFeatureGrid`. */}
      <section id="values" className={SECTION_SHELL}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead
              eyebrow="What We Stand For"
              headline="What Guides Us"
              intro="Our values are not statements on a wall. They are the criteria by which we select properties, build partnerships, and measure success. They have remained constant since 2012."
            />
          </Reveal>
          <Reveal>
            <NumberedFeatureGrid items={VALUES_ITEMS} />
          </Reveal>
        </div>
      </section>

      {/*
       * "How We Are Organised": `TwoColumnShowcase` with Owners' showcase configuration (the
       * original was already a page-scoped copy of it), on the `alt` band, no CTA.
       */}
      <div id="organised" className="scroll-mt-[84px]">
        <Reveal label="about-organised">
          <TwoColumnShowcase
            eyebrow="Our Structure"
            headline="How We Are Organised"
            body="Behind every well-managed property is a team of specialists working in close coordination. Central Hill Apartments is structured around six areas of expertise, each essential to the performance of every asset we manage."
            bullets={ORGANISED_BULLETS}
            badge="Six departments. One coordinated platform."
            tone="alt"
            imagePosition="right"
            image={
              // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
              <img src={ORGANISED_IMG} alt={ORGANISED_ALT} className="aspect-[4/5] w-full rounded-sm object-cover" />
            }
          />
        </Reveal>
      </div>

      {/* "Independently Verified": `SectionHead` + `CertificationCards`. */}
      <section id="certifications" className={SECTION_SHELL}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead
              eyebrow="What We Stand For"
              headline="Independently Verified"
              intro="Our certifications and memberships represent a commitment to operating to the highest standards — verified by recognised independent bodies in Portugal and internationally."
            />
          </Reveal>
          <Reveal label="about-certifications">
            <CertificationCards items={CERTIFICATIONS} />
          </Reveal>
        </div>
      </section>

      {/* "Giving Back…": the same `IntroSplit` (image left) as "How We Started", on the `alt` band. */}
      <section id="community" className={`${SECTION_SHELL} ${ALT_BAND}`}>
        <div className={SECTION_WRAP}>
          <Reveal label="about-community">
            <IntroSplit
              imagePosition="left"
              eyebrow="Our Responsibility"
              headline="Giving Back to the Communities We Call Home"
              paragraphs={[
                "Central Hill Apartments is a business rooted in Lisbon, and we take our responsibility to the city and its communities seriously. We are proud partners of 55+ — a Lisbon-based social organisation that empowers people over 55 to remain active and fulfilled — through which we offer guests authentic experiences including Chef at Home services delivered by 55+ members. We also actively support Movimento Famílias Solidárias, a volunteer-led initiative that provides monthly essential goods baskets to families in need across Lisbon.",
                "We additionally work with Santa Casa da Misericórdia de Lisboa, donating items and furniture to support their social care programmes, and maintain ongoing engagement with a number of other local Lisbon organisations through in-kind support, volunteering, and donations.",
              ]}
              image={
                // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
                <img src={COMMUNITY_IMG} alt={COMMUNITY_ALT} loading="lazy" decoding="async" />
              }
            />
          </Reveal>
        </div>
      </section>

      {faqGroupKey ? (
        <div id="faq" className="scroll-mt-[84px]">
          <FaqSection locale={locale} groupKey={faqGroupKey} title={t("faqTitle")} />
        </div>
      ) : null}

      {/*
       * "Let's Start a Conversation": `SectionHead`, `BenefitCards` link cards (3 columns), then
       * `ContactSplit` — office details (company_settings) beside the leads `ContactForm`.
       */}
      <section id="contact" className={SECTION_SHELL}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead eyebrow="Get in Touch" headline="Let's Start a Conversation" />
          </Reveal>
          <Reveal label="about-touch">
            <BenefitCards items={touchCards(locale)} columns={3} />
          </Reveal>
          <Reveal label="about-contact">
            <ContactSplit
              className="mt-[48px]"
              infoTitle="Our Office"
              rows={officeRows(globals)}
              formTitle="Send Us a Message"
              formIntro="Tell us how we can help and we'll be in touch shortly."
            >
              <ContactForm source="about-contact" />
            </ContactSplit>
          </Reveal>
        </div>
      </section>
    </>
  );
}
