import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { MediaImage, type MediaImageData } from "@core/media";
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
import { aboutSchema, defaultAbout } from "../schemas/about";
import { FaqSection } from "./components/faq-section";

/**
 * About page (`mock/about.html`), fully ported to components. Every string, icon and image comes
 * from the `about` `page_content` row (`schemas/about.ts`; `defaultAbout` while no row exists);
 * an image left blank falls back to the mock photo. The header/footer come from the app layout.
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
 *   (`columns={3}`, per-item `href` fixed by position + `linkLabel`), then `ContactSplit` — the dark office panel
 *   (address / bookings phone / email / office hours from company_settings via `getGlobals`,
 *   so they're edited once in /admin/settings; the check-in phone and website have no settings
 *   field and stay literals) beside the leads slice's `ContactForm` (`source="about-contact"`,
 *   `kind = "contact"` — the same form, validation, consent and success/error states as the
 *   header contact dialog). The mock's form was static (`onsubmit="return false"`); it now
 *   submits a real lead.
 * Every section uses the standard page shell and `SectionHead`; entrance motion is `Reveal`.
 */


// Image fallbacks = the approved mock photo, used 1:1 until a real R2 asset is set in the
// backoffice (an empty `*_media_id` → no resolved media). Same convention as Real Estate.
const HERO_FALLBACK = {
  src: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70",
  alt: "Rooftops and historic streets of Lisbon at golden hour",
};
const STORY_FALLBACK = {
  src: "https://images.pexels.com/photos/19295144/pexels-photo-19295144.jpeg?auto=compress&cs=tinysrgb&w=1200",
  alt: "Traditional tiled façades along a historic Lisbon street",
};
const ORGANISED_FALLBACK = {
  src: "https://images.pexels.com/photos/5324937/pexels-photo-5324937.jpeg?auto=compress&cs=tinysrgb&w=1200",
  alt: "Team reviewing property performance documents together",
};
const COMMUNITY_FALLBACK = {
  src: "https://images.unsplash.com/photo-1591825729269-caeb344f6df2?auto=format&fit=crop&w=900&q=70",
  alt: "People sharing a meal together at a community table in Lisbon",
};
/** `PhotoFeatureGrid` backgrounds, by audience position. */
const AUDIENCE_FALLBACK_IMGS = [
  "https://images.pexels.com/photos/39205181/pexels-photo-39205181.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/7415097/pexels-photo-7415097.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/36733412/pexels-photo-36733412.jpeg?auto=compress&cs=tinysrgb&w=1200",
];
/** Issuer logos by certification position; a card with neither logo nor fallback shows its icon. */
const CERT_FALLBACK_LOGOS: ({ src: string; alt: string } | undefined)[] = [
  {
    src: "https://d11n7da8rpqbjy.cloudfront.net/alep/19726083_1621536323PF6Ativo_12.png",
    alt: "ALEP — Associação do Alojamento Local em Portugal logo",
  },
  {
    src: "https://www.turismodeportugal.pt/Style%20Library/TPortugal16Branding/img/logotipo_institucional_preto.png",
    alt: "Turismo de Portugal logo",
  },
];
/** Contact card destinations, by position (guests / owners / partners). */
const CONTACT_CARD_PATHS = ["/buildings", "/owners", "/real-estate"];

const SPLIT_SIZES = "(max-width: 1024px) 100vw, 600px";

// Standard page shell (Real Estate, Guests): padding, 84px scroll margin, 1240px/28px column,
// and the warm `alt` band.
const SECTION_SHELL = "scroll-mt-[84px] py-[clamp(72px,10vw,150px)]";
const SECTION_WRAP = "mx-auto max-w-[1240px] px-[28px]";
const ALT_BAND = "bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))]";

/**
 * A section photo: the uploaded asset through `MediaImage`, or the mock photo as a plain `<img>`
 * (external TEMP fallback) while none is set.
 */
function photo(
  m: MediaImageData | undefined,
  fallback: { src: string; alt: string },
  opts: { sizes: string; className?: string; priority?: boolean },
) {
  if (m?.url && m.width > 0 && m.height > 0) {
    return (
      <MediaImage
        data={{ ...m, alt: m.alt || fallback.alt }}
        className={opts.className}
        sizes={opts.sizes}
        priority={opts.priority}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external TEMP fallback, not an R2 asset
    <img
      src={m?.url || fallback.src}
      alt={m?.alt || fallback.alt}
      className={opts.className}
      {...(opts.priority
        ? { loading: "eager" as const, fetchPriority: "high" as const }
        : { loading: "lazy" as const })}
      decoding="async"
    />
  );
}

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
  // A row (or a cache entry) still in the pre-3d shape renders the default copy, not a crash.
  const c = page && aboutSchema.safeParse(page.content).success ? page.content : defaultAbout;
  const media = page?.media ?? {};
  const faqGroupKey = c.faq_group_key ?? "";

  const serveItems = c.serve.audiences.map((a, i) => ({
    icon: <Icon name={a.icon_key} size={30} className="block" />,
    title: a.title,
    description: a.description,
    image: media[a.image_media_id]?.url || AUDIENCE_FALLBACK_IMGS[i],
  }));
  const valueItems = c.values.items.map((v) => ({ title: v.title, body: v.description }));
  // Sized like Owners' showcase bullet icons.
  const departmentBullets = c.organisation.departments.map((d) => ({
    icon: <Icon name={d.icon_key} size={26} className="mt-0.5 flex-none text-accent-deep" />,
    title: d.name,
    description: d.description,
  }));
  const certifications: CertificationCardItem[] = c.certifications.items.map((cert, i) => {
    const logo = media[cert.logo_media_id];
    const fallback = CERT_FALLBACK_LOGOS[i];
    return {
      logo:
        logo?.url || fallback ? (
          // eslint-disable-next-line @next/next/no-img-element -- issuer logo in a fixed 48px slot
          <img src={logo?.url || fallback?.src} alt={logo?.alt || fallback?.alt || cert.issuer} />
        ) : (
          <Icon name={cert.icon_key} size={40} className="block text-accent-deep" />
        ),
      name: cert.title,
      issuer: cert.issuer,
      description: cert.description,
    };
  });
  const contactCards: BenefitCardItem[] = c.contact.cards.map((card, i) => ({
    icon: <Icon name={card.icon_key} size={30} className="block" />,
    title: card.title,
    description: card.description,
    href: `/${locale}${CONTACT_CARD_PATHS[i]}`,
    linkLabel: card.link_label,
  }));

  return (
    <>
      {/* JS-off fallback: `Reveal` renders hidden until it scrolls into view. */}
      <noscript>
        <style dangerouslySetInnerHTML={{ __html: `[data-reveal]{opacity:1!important;transform:none!important}` }} />
      </noscript>

      {/* Hero: Buildings listing's exact `Hero` configuration (as on Guests and Real Estate). */}
      <Hero
        id="who-we-are"
        background={photo(media[c.hero.image_media_id], HERO_FALLBACK, {
          sizes: "100vw",
          className: "absolute inset-0 -z-10 h-full w-full object-cover",
          priority: true, // full-bleed hero — the LCP element on this page
        })}
        compact
        align="center"
        overlayClassName="bg-[linear-gradient(180deg,rgba(18,16,13,0.5)_0%,rgba(18,16,13,0.46)_45%,rgba(18,16,13,0.88)_100%)]"
        wrapClassName="mx-auto max-w-[1600px] p-10"
        copyClassName="max-w-none"
        headlineClassName="max-w-[26ch] text-[clamp(2.5rem,5.4vw,4.25rem)]"
        subtitleClassName="mt-5 max-w-[60ch] text-lg"
        eyebrow={c.hero.eyebrow || undefined}
        headline={c.hero.headline}
        subtitle={c.hero.mission}
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
              eyebrow={c.story.eyebrow || undefined}
              headline={c.story.headline}
              paragraphs={c.story.narrative}
              image={photo(media[c.story.image_media_id], STORY_FALLBACK, { sizes: SPLIT_SIZES })}
            />
          </Reveal>
        </div>
      </section>

      {/* Company numbers: the same `StatBand` as Home/Owners/Buildings, five columns. */}
      <Reveal label="about-stats">
        <StatBand cells={c.stats} columns={5} />
      </Reveal>

      {/* "One Platform. Three Audiences.": `SectionHead` + `PhotoFeatureGrid` (Guests' teasers). */}
      <section id="serve" className={`${SECTION_SHELL} ${ALT_BAND}`}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead
              eyebrow={c.serve.eyebrow || undefined}
              headline={c.serve.headline}
              intro={c.serve.intro || undefined}
            />
          </Reveal>
          <Reveal label="about-serve">
            <PhotoFeatureGrid items={serveItems} />
          </Reveal>
        </div>
      </section>

      {/* "What Guides Us": `SectionHead` + `NumberedFeatureGrid`. */}
      <section id="values" className={SECTION_SHELL}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead
              eyebrow={c.values.eyebrow || undefined}
              headline={c.values.headline}
              intro={c.values.intro || undefined}
            />
          </Reveal>
          <Reveal>
            <NumberedFeatureGrid items={valueItems} />
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
            eyebrow={c.organisation.eyebrow || undefined}
            headline={c.organisation.headline}
            body={c.organisation.intro || undefined}
            bullets={departmentBullets}
            badge={c.organisation.badge || undefined}
            tone="alt"
            imagePosition="right"
            image={photo(media[c.organisation.image_media_id], ORGANISED_FALLBACK, {
              sizes: "(max-width: 1024px) 100vw, 560px",
              className: "aspect-[4/5] w-full rounded-sm object-cover",
            })}
          />
        </Reveal>
      </div>

      {/* "Independently Verified": `SectionHead` + `CertificationCards`. */}
      <section id="certifications" className={SECTION_SHELL}>
        <div className={SECTION_WRAP}>
          <Reveal>
            <SectionHead
              eyebrow={c.certifications.eyebrow || undefined}
              headline={c.certifications.headline}
              intro={c.certifications.intro || undefined}
            />
          </Reveal>
          <Reveal label="about-certifications">
            <CertificationCards items={certifications} />
          </Reveal>
        </div>
      </section>

      {/* "Giving Back…": the same `IntroSplit` (image left) as "How We Started", on the `alt` band. */}
      <section id="community" className={`${SECTION_SHELL} ${ALT_BAND}`}>
        <div className={SECTION_WRAP}>
          <Reveal label="about-community">
            <IntroSplit
              imagePosition="left"
              eyebrow={c.community.eyebrow || undefined}
              headline={c.community.headline}
              paragraphs={c.community.copy}
              image={photo(media[c.community.image_media_id], COMMUNITY_FALLBACK, { sizes: SPLIT_SIZES })}
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
            <SectionHead eyebrow={c.contact.eyebrow || undefined} headline={c.contact.headline} />
          </Reveal>
          <Reveal label="about-touch">
            <BenefitCards items={contactCards} columns={3} />
          </Reveal>
          <Reveal label="about-contact">
            <ContactSplit
              className="mt-[48px]"
              infoTitle={c.contact.office_title}
              rows={officeRows(globals)}
              formTitle={c.contact.form.headline}
              formIntro={c.contact.form.subheadline || undefined}
            >
              <ContactForm source="about-contact" />
            </ContactSplit>
          </Reveal>
        </div>
      </section>
    </>
  );
}
