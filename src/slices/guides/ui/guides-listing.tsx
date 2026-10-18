import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { SectionHead } from "@core/ui";
import { Icon } from "@core/ui/icon";
import { SITE_ICON_DEFAULTS, getGlobals } from "@slices/settings/contract";
import { listCities } from "@slices/geography/contract";
import { getGuidesPage, GuidesHero, GuidesFinalCta } from "@slices/pages/contract";
import { listGuideCityGroups, listTopRecommendations, type GuideCityGroup, type GuideRecommendation } from "../contract";
import { GuideCard } from "./components/guide-card";
import { RecommendationCard } from "./components/recommendation-card";
import { GuidesCityFilter } from "./components/guides-city-filter";
import { buildListingCities, guideCityHeadline, listingCopy } from "./listing-presentation";

const SECTION_SHELL = "scroll-mt-[84px] py-[clamp(72px,10vw,150px)]";
const SECTION_WRAP = "mx-auto max-w-[1240px] px-[28px]";
const GRID = "grid grid-cols-1 gap-[26px] min-[681px]:grid-cols-2 min-[981px]:grid-cols-3";
const ALT_BAND = "bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))]";

/** Fixed editorial page plus published catalogues. Filtering changes presentation, never detail routes. */
export async function GuidesListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [groups, cities, sourceCities, page, t, globals] = await Promise.all([
    listGuideCityGroups(locale), listCities(locale), listCities("en"), getGuidesPage(locale),
    getTranslations("guides"), getGlobals(locale),
  ]);
  const icons = globals?.icons ?? SITE_ICON_DEFAULTS;
  const { city_filter: filter, catalogue, recommendations: recCopy } = page.content;
  const enabled = filter?.enabled !== false;
  const recTypeLabels = {
    restaurant: listingCopy(recCopy?.restaurant_label, t("recType.restaurant")),
    viewpoint: listingCopy(recCopy?.viewpoint_label, t("recType.viewpoint")),
    beach: listingCopy(recCopy?.beach_label, t("recType.beach")),
  };
  const renderGroup = (group: GuideCityGroup, priority: boolean) => (
    <section key={group.city.id} className={SECTION_SHELL}>
      <div className={SECTION_WRAP}>
        <SectionHead eyebrow={listingCopy(catalogue?.eyebrow, t("citiesEyebrow"))}
          headline={guideCityHeadline(catalogue?.headline, group.city.name, t("guidesIn", { city: group.city.name }))} />
        <div className={GRID}>
          {group.guides.map((guide, index) => <GuideCard key={guide.id} guide={guide} locale={locale}
            viewLabel={listingCopy(catalogue?.view_label, t("viewGuide")).replace(/(?:\s*→)+\s*$/, "")}
            icon={listingCopy(catalogue?.template_icons?.[`${guide.template}_icon_key`], icons[`guide_${guide.template}`] || SITE_ICON_DEFAULTS[`guide_${guide.template}`])}
            priority={priority && index < 3} />)}
        </div>
      </div>
    </section>
  );
  const renderRecommendations = (recommendations: GuideRecommendation[]) => recommendations.length ? (
    <section className={`${SECTION_SHELL} ${ALT_BAND}`}>
      <div className={SECTION_WRAP}>
        <SectionHead eyebrow={listingCopy(recCopy?.eyebrow, t("recEyebrow"))}
          headline={listingCopy(recCopy?.headline, t("recTitle"))} intro={listingCopy(recCopy?.body, t("recIntro"))} />
        <div className={GRID}>
          {recommendations.map((rec) => <RecommendationCard key={rec.id} rec={rec} locale={locale}
            typeLabels={recTypeLabels} pinIcon={listingCopy(recCopy?.location_icon_key, icons.location || SITE_ICON_DEFAULTS.location)} />)}
        </div>
      </div>
    </section>
  ) : null;
  const empty = <section className={SECTION_SHELL}><div className={SECTION_WRAP}>
    <p className="text-ink-soft">{listingCopy(catalogue?.empty_message, t("empty"))}</p>
  </div></section>;
  let catalogueContent;
  if (enabled) {
    const choices = buildListingCities(cities, sourceCities, groups.map((group) => group.city.id), {
      porto: t("cityPorto"), cascais: t("cityCascais"),
    });
    const panels = await Promise.all(groups.map(async (group, index) => ({
      cityId: group.city.id,
      guides: renderGroup(group, index === 0),
      recommendations: renderRecommendations(await listTopRecommendations(locale, 3, { cityIds: [group.city.id] })),
    })));
    catalogueContent = <GuidesCityFilter cities={choices} panels={panels} empty={empty}
      label={listingCopy(filter?.label, t("chooseCity"))} note={listingCopy(filter?.note, t("cityNote"))}
      soonLabel={listingCopy(filter?.soon_label, t("citySoon"))}
      icon={<Icon name={listingCopy(filter?.location_icon_key, icons.location || SITE_ICON_DEFAULTS.location)} size={13} />} />;
  } else {
    catalogueContent = <>{groups.length ? groups.map((group, index) => renderGroup(group, index === 0)) : empty}
      {renderRecommendations(await listTopRecommendations(locale))}</>;
  }
  return <><GuidesHero page={page} locale={locale} />{catalogueContent}<GuidesFinalCta page={page} locale={locale} /></>;
}
