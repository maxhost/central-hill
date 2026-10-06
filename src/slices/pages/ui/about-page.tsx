import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import {
  CertificationCards,
  Hero,
  IntroSplit,
  NumberedFeatureGrid,
  PhotoFeatureGrid,
  Reveal,
  SectionHead,
  StatBand,
  TwoColumnShowcase,
  type CertificationCardItem,
} from "@core/ui";
import { getAboutPage } from "../contract";
import { FaqSection } from "./components/faq-section";
import { ScrollReveal } from "./components/scroll-reveal";

/**
 * About page (`mock/about.html`), being ported to components. Content is static (no
 * `page_content` row backs About beyond `faq_group_key`), so every string is a literal, as in the
 * original markup. The header/footer and i18n come from the app layout.
 *
 * Now JSX, with existing `core/ui` components (consistency over mock fidelity):
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
 * Every section uses the standard page shell and `SectionHead`; entrance motion is `Reveal`.
 *
 * Still raw, in a small `.mk` block under a JSX `SectionHead`: the "Let's Start a Conversation"
 * link cards and the office + contact form (static, not wired to leads yet). That raw block keeps the page's own `.pre-reveal` entrance motion
 * (`ScrollReveal`), and `PAGE_STYLE` now only holds its rules.
  */

const PAGE_STYLE = `
/* Iconoir glyphs in the still-raw contact cards. */
.mk .ico{font-size:30px;line-height:1;color:var(--accent-deep);display:inline-block;margin-bottom:18px}
/* Page-wide entrance motion (immediate on load for above-the-fold content, on scroll
   for the rest, via <ScrollReveal page="about">/scroll-reveal.tsx) + hover motion
   (client feedback: the page read too static, wanted a more premium feel). The hidden
   state is baked straight into the server-rendered markup (.pre-reveal, applied on the
   elements below) so there's no flash of visible-then-hidden; the <noscript> rule keeps
   content visible with JS off. Scoped to [data-page="about"] so it never touches the
   shared, neutralised .reveal
   rule in mock.css or any other page/section. */
.mk[data-page="about"] .reveal-io{transition:opacity .7s var(--ease),transform .7s var(--ease)}
.mk[data-page="about"] .reveal-io.pre-reveal{opacity:0;transform:translateY(18px)}
.mk .touch-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.mk .touch{background:var(--surface);padding:40px 34px;display:flex;flex-direction:column;transition:transform .35s var(--ease),box-shadow .35s var(--ease)}
.mk .touch:hover{transform:translateY(-4px);box-shadow:0 16px 28px -20px rgba(0,0,0,.35);z-index:1}
.mk .touch .ico{transition:transform .35s var(--ease),color .35s var(--ease)}
.mk .touch:hover .ico{transform:translateY(-3px) scale(1.1);color:var(--accent)}
.mk .touch h3{font-size:23px;margin-bottom:10px}
.mk .touch p{font-size:15px;color:var(--ink-soft);flex:1}
.mk .touch .view{margin-top:18px;font-size:14px;color:var(--accent-deep);font-weight:600;display:inline-block;transition:transform .35s var(--ease)}
.mk .touch:hover .view{transform:translateX(4px)}
.mk .contact-split{display:grid;grid-template-columns:.9fr 1.1fr;gap:1px;background:var(--line);border:1px solid var(--line);margin-top:48px}
.mk .office{background:var(--feature);color:var(--on-feature);padding:48px 44px}
.mk .office h3{color:#fff;font-size:26px;margin-bottom:22px}
.mk .office .ofield{margin-bottom:20px}
.mk .office .olbl{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--feature-accent);font-weight:600;margin-bottom:6px}
.mk .office .oval{font-size:15px;color:var(--on-feature-soft);line-height:1.7}
.mk .office .oval a{color:var(--on-feature)}
.mk .cform{background:var(--surface);padding:48px 44px}
.mk .cform h3{font-size:26px;margin-bottom:8px}
.mk .cform .cform-sub{font-size:14px;color:var(--ink-soft);margin-bottom:24px}
.mk .cfield{margin-bottom:18px}
.mk .cfield label{display:block;font-size:12px;letter-spacing:.04em;font-weight:600;color:var(--ink);margin-bottom:7px}
.mk .cfield input,.mk .cfield textarea{width:100%;font-family:var(--sans);font-size:15px;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:4px;padding:13px 14px;transition:.2s var(--ease)}
.mk .cfield textarea{resize:vertical;min-height:130px}
.mk .cfield input:focus,.mk .cfield textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.mk .cform-two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.mk .cform .btn{justify-content:center}
@media(max-width:980px){
    .mk .contact-split{grid-template-columns:1fr}
}
@media(max-width:680px){
    .mk .office,.mk .cform{padding:36px 28px}
}
`;

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
  <i className={`iconoir-${name} mt-0.5 flex-none text-[26px] leading-none text-accent-deep`} aria-hidden="true" />
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
    icon: <i className="iconoir-suitcase" aria-hidden="true" />,
    title: "For Guests",
    description:
      "Professionally managed, fully equipped apartments in Portugal's most desirable locations. Every property is quality-checked, consistently maintained, and backed by 24/7 support — so every stay is exactly what it should be.",
    image: "https://images.pexels.com/photos/39205181/pexels-photo-39205181.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    icon: <i className="iconoir-home" aria-hidden="true" />,
    title: "For Property Owners",
    description:
      "Full-service property management that removes every burden and maximises every opportunity. AI-driven dynamic pricing, professional photography, 24/7 guest management, maintenance, and a real-time performance dashboard — all included.",
    image: "https://images.pexels.com/photos/7415097/pexels-photo-7415097.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    icon: <i className="iconoir-bank" aria-hidden="true" />,
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
    logo: <i className="iconoir-check-circle text-[40px] leading-none text-accent-deep" aria-hidden />,
    name: "I-PRAC Certified",
    issuer: "International Property Rental Approval Certification",
    description:
      "International certification body verifying vacation rental operators worldwide, assuring guests and partners of our professional standards.",
  },
];

/** The still-raw contact cards + office/form split (the section shell and head are JSX). */
const CONTACT_BODY_HTML = (locale: Locale) => `
    <div class="touch-grid reveal reveal-io reveal-stagger pre-reveal">
      <a class="touch" href="/${locale}/buildings">
        <i class="iconoir-suitcase ico" aria-hidden="true"></i>
        <h3>Planning a Stay?</h3>
        <p>Browse our apartments and book directly for the best price.</p>
        <span class="view">Browse Apartments →</span>
      </a>
      <a class="touch" href="/${locale}/owners">
        <i class="iconoir-home ico" aria-hidden="true"></i>
        <h3>Own a Property?</h3>
        <p>Get a free, no-obligation earnings estimate and find out what your property could achieve.</p>
        <span class="view">Get My Free Estimate →</span>
      </a>
      <a class="touch" href="/${locale}/real-estate">
        <i class="iconoir-bank ico" aria-hidden="true"></i>
        <h3>Institutional Partner?</h3>
        <p>Discuss investment structures, asset management, and partnership models with our team.</p>
        <span class="view">Discuss a Partnership →</span>
      </a>
    </div>

    <div class="contact-split reveal reveal-io pre-reveal">
      <div class="office">
        <h3>Our Office</h3>
        <div class="ofield">
          <div class="olbl">Address</div>
          <div class="oval">Rua da Bempostinha 21A<br>1150-065 Lisboa, Portugal</div>
        </div>
        <div class="ofield">
          <div class="olbl">Bookings</div>
          <div class="oval"><a href="tel:+351910075725">+351 910 075 725</a></div>
        </div>
        <div class="ofield">
          <div class="olbl">Check-in</div>
          <div class="oval"><a href="tel:+351912310632">+351 912 310 632</a></div>
        </div>
        <div class="ofield">
          <div class="olbl">Email</div>
          <div class="oval"><a href="mailto:info@centralhill.pt">info@centralhill.pt</a></div>
        </div>
        <div class="ofield">
          <div class="olbl">Website</div>
          <div class="oval"><a href="https://www.centralhill.pt">www.centralhill.pt</a></div>
        </div>
        <div class="ofield">
          <div class="olbl">Office Hours</div>
          <div class="oval">Monday – Friday · 09:30 – 18:00</div>
        </div>
      </div>

      <form class="cform" onsubmit="return false">
        <h3>Send Us a Message</h3>
        <div class="cform-sub">Tell us how we can help and we'll be in touch shortly.</div>
        <div class="cform-two">
          <div class="cfield">
            <label for="cf-name">Name</label>
            <input id="cf-name" type="text" name="name" placeholder="Your full name" autocomplete="name">
          </div>
          <div class="cfield">
            <label for="cf-email">Email</label>
            <input id="cf-email" type="email" name="email" placeholder="you@email.com" autocomplete="email">
          </div>
        </div>
        <div class="cfield">
          <label for="cf-subject">Subject</label>
          <input id="cf-subject" type="text" name="subject" placeholder="What is this about?">
        </div>
        <div class="cfield">
          <label for="cf-message">Message</label>
          <textarea id="cf-message" name="message" placeholder="Write your message…"></textarea>
        </div>
        <button type="submit" class="btn btn-accent">Send Message <i class="iconoir-send-diagonal" aria-hidden="true"></i></button>
      </form>
    </div>
`;

export async function AboutPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [page, t] = await Promise.all([getAboutPage(locale), getTranslations("pages")]);
  const faqGroupKey = page?.content.faq_group_key ?? "";

  return (
    <>
      {/* `.mk`-scoped rules for the still-raw cards; selectors don't depend on DOM position. */}
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
      {/*
       * JS-off fallbacks: `Reveal` (JSX sections) and the page's own `.pre-reveal` (the
       * still-raw contact block, animated by `ScrollReveal`).
       */}
      <noscript>
        <style
          dangerouslySetInnerHTML={{
            __html: `[data-reveal]{opacity:1!important;transform:none!important}.mk[data-page="about"] .pre-reveal{opacity:1!important;transform:none!important}`,
          }}
        />
      </noscript>
      <ScrollReveal page="about" />

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

      {/* "Let's Start a Conversation": JSX shell + `SectionHead`; cards and office/form stay raw. */}
      <section id="contact" className={SECTION_SHELL}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead eyebrow="Get in Touch" headline="Let's Start a Conversation" />
          </Reveal>
          <div className="mk" data-page="about">
            <div dangerouslySetInnerHTML={{ __html: CONTACT_BODY_HTML(locale) }} />
          </div>
        </div>
      </section>
    </>
  );
}
