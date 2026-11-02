import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import {
  ButtonLink,
  FeatureCtaBand,
  Hero,
  Reveal,
  SectionHead,
} from "@core/ui";
import { getGlobals } from "@slices/settings/contract";
import type { ServicesPage } from "../../contract";
import { orMessage } from "../or-message";
import {
  SERVICES_CTA_IMAGE,
  SERVICES_HERO_IMAGE,
  ServicesMedia,
} from "./services-media";

type SectionProps = { page: ServicesPage; locale: Locale; preview?: boolean };

/** Existing Services visual configuration; blank overrides keep visitor-locale messages. */
export async function ServicesHero({
  page,
  locale,
  preview = false,
}: SectionProps) {
  const [t, tSettings] = await Promise.all([
    getTranslations({ locale, namespace: "services" }),
    getTranslations({ locale, namespace: "settings" }),
  ]);
  const hero = page.content.hero;
  return (
    <Hero
      editorBindings={
        preview
          ? {
              background: "hero.media_media_id",
              eyebrow: "hero.eyebrow",
              subtitle: "hero.body",
            }
          : undefined
      }
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
      wrapClassName="mx-auto max-w-[1600px] px-10 pb-10 pt-[60px]"
      copyClassName="max-w-none"
      headlineClassName="max-w-[26ch] text-[clamp(2.5rem,5.4vw,4.25rem)]"
      subtitleClassName="mt-5 max-w-[60ch] text-lg"
      actionsClassName="mt-2"
      eyebrow={orMessage(hero?.eyebrow, t("eyebrow"))}
      headline={
        preview ? (
          <span data-editor-binding="hero.headline">
            {orMessage(hero?.headline, t("title"))}
          </span>
        ) : (
          orMessage(hero?.headline, t("title"))
        )
      }
      subtitle={orMessage(hero?.body, t("intro"))}
      actions={
        <ButtonLink href="https://www.centralhill.pt/en/rentals/holidays-rentals-rentals-d0/">
          {tSettings("ctaBook")}
        </ButtonLink>
      }
    />
  );
}

export async function ServicesIntro({
  page,
  locale,
  preview = false,
}: SectionProps) {
  const t = await getTranslations({ locale, namespace: "services" });
  const intro = page.content.intro;
  return (
    <Reveal>
      <SectionHead
        align="center"
        headline={
          preview ? (
            <span data-editor-binding="intro.headline">
              {orMessage(intro?.headline, t("gridTitle"))}
            </span>
          ) : (
            orMessage(intro?.headline, t("gridTitle"))
          )
        }
        intro={
          preview ? (
            <span data-editor-binding="intro.body">
              {orMessage(intro?.body, t("gridIntro"))}
            </span>
          ) : (
            orMessage(intro?.body, t("gridIntro"))
          )
        }
      />
    </Reveal>
  );
}

export async function ServicesFinalCta({
  page,
  locale,
  preview = false,
}: SectionProps) {
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
    <div
      {...(preview ? { "data-editor-binding": "final_cta" } : {})}
      id="plan"
      className="scroll-mt-[84px] [&_section]:py-[70px]"
    >
      <Reveal label="services-cta">
        <FeatureCtaBand
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
