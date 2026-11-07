import type { Locale } from "@core/db/columns";
import type { BuildingBookingButton, BuildingEditorialContent } from "./editorial-types";

const labels: Record<Locale, string> = {
  en: "Book Now",
  es: "Reservar",
  pt: "Reservar",
  fr: "Réserver",
};

/** An explicitly cleared localized link never revives a legacy default. */
export function effectiveBuildingBooking(content: BuildingEditorialContent): string | null {
  if (content.booking_button) return content.booking_button.link?.trim() || null;
  return content.booking_url?.trim() || content.default_booking_url?.trim() || null;
}

/** Read-only editor projection: opening old documents never migrates or pins them. */
export function getBuildingBookingButton(content: BuildingEditorialContent, locale: Locale): BuildingBookingButton {
  return content.booking_button ?? { label: labels[locale], link: effectiveBuildingBooking(content) };
}
