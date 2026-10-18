import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import {
  FeatureCtaBand,
  Hero,
  IconFeatureGrid,
  Reveal,
  SectionHead,
} from "@core/ui";
import { Icon } from "@core/ui/icon";
import { SITE_ICON_DEFAULTS, getGlobals } from "@slices/settings/contract";
import type { ServicesPage } from "../../contract";
import { orMessage } from "../or-message";
import {
  SERVICES_CTA_IMAGE,
  SERVICES_HERO_IMAGE,
  ServicesMedia,
} from "./services-media";

type SectionProps = { page: ServicesPage; locale: Locale };

/** Existing Services visual configuration; blank overrides keep visitor-locale messages. */
export async function ServicesHero({ page, locale }: SectionProps) {
  const t = await getTranslations({ locale, namespace: "services" });
  const hero = page.content.hero;
  return (
    <Hero
      background={
        <ServicesMedia
          media={page.media[hero?.media_media_id ?? ""]}
          poster={page.media[hero?.poster_media_id ?? ""]}
          fallback={SERVICES_HERO_IMAGE}
          alt=""
          hero
        />
      }
      compact
      align="center"
      overlayClassName="bg-[linear-gradient(180deg,rgba(18,16,13,0.5)_0%,rgba(18,16,13,0.46)_45%,rgba(18,16,13,0.88)_100%)]"
      wrapClassName="mx-auto max-w-[1600px] p-10"
      copyClassName="max-w-none"
      headlineClassName="max-w-[26ch] text-[clamp(2.5rem,5.4vw,4.25rem)]"
      subtitleClassName="mt-5 max-w-[60ch] text-lg"
      eyebrow={orMessage(hero?.eyebrow, t("eyebrow"))}
      headline={orMessage(hero?.headline, t("title"))}
      subtitle={orMessage(hero?.body, t("intro"))}
    />
  );
}

export async function ServicesIntro({ page, locale }: SectionProps) {
  const t = await getTranslations({ locale, namespace: "services" });
  const intro = page.content.intro;
  return (
    <Reveal>
      <SectionHead
        align="center"
        eyebrow={orMessage(intro?.eyebrow, t("gridEyebrow"))}
        headline={orMessage(intro?.headline, t("gridTitle"))}
        intro={orMessage(intro?.body, t("gridIntro"))}
      />
    </Reveal>
  );
}

export async function ServicesHowItWorks({ page, locale }: SectionProps) {
  const [t, globals] = await Promise.all([
    getTranslations({ locale, namespace: "services" }),
    getGlobals(locale),
  ]);
  const icons = globals?.icons ?? SITE_ICON_DEFAULTS;
  const section = page.content.how_it_works;
  return (
    <Reveal label="services-how-it-works">
      <IconFeatureGrid
        eyebrow={orMessage(section?.eyebrow, t("howEyebrow"))}
        headline={orMessage(section?.headline, t("howTitle"))}
        items={([1, 2, 3] as const).map((number, index) => {
          const item = section?.items?.[index];
          const iconKey = `services_how_${number}` as const;
          return {
            icon: (
              <Icon
                name={orMessage(
                  item?.icon_key,
                  icons[iconKey] || SITE_ICON_DEFAULTS[iconKey],
                )}
                size={24}
                className="block"
              />
            ),
            title: orMessage(item?.title, t(`how${number}Title`)),
            description: orMessage(item?.body, t(`how${number}Body`)),
          };
        })}
      />
    </Reveal>
  );
}

export async function ServicesFinalCta({ page, locale }: SectionProps) {
  const [t, globals] = await Promise.all([
    getTranslations({ locale, namespace: "services" }),
    getGlobals(locale),
  ]);
  const cta = page.content.final_cta;
  const contactLine = [
    orMessage(cta?.contact_note, t("ctaNote")).replace(/\.$/, ""),
    globals?.email,
    globals?.whatsapp ? `WhatsApp ${globals.whatsapp}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const label = orMessage(cta?.cta_label, t("ctaButton")).replace(
    /(?:\s*→)+\s*$/,
    "",
  );
  return (
    <div id="plan" className="scroll-mt-[84px]">
      <Reveal label="services-cta">
        <FeatureCtaBand
          eyebrow={orMessage(cta?.eyebrow, t("ctaEyebrow"))}
          headline={orMessage(cta?.headline, t("ctaTitle"))}
          body={orMessage(cta?.body, t("ctaIntro"))}
          cta={{ href: `/${locale}/buildings`, label: `${label} →` }}
          contactLine={contactLine || undefined}
          image={
            <ServicesMedia
              media={page.media[cta?.media_media_id ?? ""]}
              poster={page.media[cta?.poster_media_id ?? ""]}
              fallback={SERVICES_CTA_IMAGE}
              alt={orMessage(cta?.media_alt, t("ctaImageAlt"))}
            />
          }
        />
      </Reveal>
    </div>
  );
}
