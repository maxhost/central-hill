import type { ComponentProps } from "react";
import type { Locale } from "@core/db/columns";
import { Icon } from "@core/ui/icon";
import type { ServiceSummary } from "@slices/services/contract";
import { cardBgSrc } from "../optimized-src";
import { GuestCatalogueCarousel } from "./guest-catalogue-carousel";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=70";

/** Services owns all card data; Guests owns only the section's editorial copy. */
export function GuestServiceCards({ services, locale, cta, prevLabel = "Previous services", nextLabel = "Next services" }: {
  services: ServiceSummary[];
  locale: Locale;
  cta?: ComponentProps<typeof GuestCatalogueCarousel>["cta"];
  prevLabel?: string;
  nextLabel?: string;
}) {
  const items = services.filter((service) => service.slug).map((service) => ({
    id: service.id,
    href: `/${locale}/services/${service.slug}`,
    title: service.name,
    description: service.excerpt,
    icon: <Icon name={service.category.icon ?? "check"} size={30} className="block" />,
    image: cardBgSrc(service.cover, FALLBACK_IMAGE),
  }));
  return (
    <GuestCatalogueCarousel items={items} cta={cta} prevLabel={prevLabel} nextLabel={nextLabel} />
  );
}
