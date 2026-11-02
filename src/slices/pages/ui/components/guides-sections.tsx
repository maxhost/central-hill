import type { Locale } from "@core/db/columns";
import type { GuidesPage } from "../../contract";
import { getTranslations } from "next-intl/server";
import { CenteredCtaBand, Hero } from "@core/ui";
import { orMessage } from "../or-message";
import { GuidesMedia } from "./guides-media";
type Props = { page: GuidesPage; locale: Locale; preview?: boolean };
export async function GuidesHero({ page, locale, preview = false }: Props) {
  const t = await getTranslations({ locale, namespace: "guides" });
  const hero = page.content.hero;
  return (
    <Hero
      editorBindings={
        preview
          ? {
              background: "hero.poster_media_id",
              eyebrow: "hero.eyebrow",
              subtitle: "hero.body",
            }
          : undefined
      }
      background={
        <GuidesMedia
          video={page.media[hero?.video_media_id ?? ""]}
          poster={page.media[hero?.poster_media_id ?? ""]}
        />
      }
      compact
      align="center"
      overlayClassName="bg-[linear-gradient(180deg,rgba(18,16,13,0.5)_0%,rgba(18,16,13,0.46)_45%,rgba(18,16,13,0.88)_100%)]"
      wrapClassName="mx-auto max-w-[1600px] px-10 pb-10 pt-[60px]"
      copyClassName="max-w-none"
      headlineClassName="max-w-[26ch] text-[clamp(2.5rem,5.4vw,4.25rem)]"
      subtitleClassName="mt-5 max-w-[60ch] text-lg"
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
    />
  );
}
export async function GuidesFinalCta({ page, locale }: Props) {
  const t = await getTranslations({ locale, namespace: "guides" });
  const cta = page.content.final_cta;
  const label = orMessage(cta?.cta_label, t("ctaButton")).replace(
    /(?:\s*→)+\s*$/,
    "",
  );
  return (
    <CenteredCtaBand
      eyebrow={orMessage(cta?.eyebrow, t("ctaEyebrow"))}
      headline={orMessage(cta?.headline, t("ctaTitle"))}
      body={orMessage(cta?.body, t("ctaBody"))}
      cta={{ href: `/${locale}/buildings`, label: `${label} →` }}
    />
  );
}
