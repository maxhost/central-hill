import type { ComponentProps } from "react";
import type { Locale } from "@core/db/columns";
import { Icon } from "@core/ui/icon";
import type { GuidePageSummary } from "@slices/guides/contract";
import type { SiteIcons } from "@slices/settings/contract";
import { cardBgSrc } from "../optimized-src";
import { GuestCatalogueCarousel } from "./guest-catalogue-carousel";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=70";

/** Guide and city slugs, copy and images come from the published Guides read model. */
export function GuestGuideCards({ guides, locale, icons, cta, prevLabel, nextLabel }: {
  guides: GuidePageSummary[];
  locale: Locale;
  icons: SiteIcons;
  cta?: ComponentProps<typeof GuestCatalogueCarousel>["cta"];
  prevLabel: string;
  nextLabel: string;
}) {
  const items = guides.filter((guide) => guide.slug && guide.city.slug).map((guide) => ({
    id: guide.id,
    href: `/${locale}/guides/${guide.city.slug}/${guide.slug}`,
    title: guide.title,
    description: guide.intro ?? "",
    icon: <Icon name={icons[`guide_${guide.template}`]} size={30} className="block" />,
    image: cardBgSrc(guide.hero, FALLBACK_IMAGE),
  }));
  return <GuestCatalogueCarousel items={items} cta={cta} prevLabel={prevLabel} nextLabel={nextLabel} />;
}
