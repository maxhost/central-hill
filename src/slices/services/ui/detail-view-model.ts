import type { Locale } from "@core/db/columns";
import type { ServiceDetail } from "../contract";
import { type ServiceCopy, type ServiceCopyKey, resolveServiceCopy, serviceCopyValueSchema } from "../copy";
import { formatPrice } from "./format";

export type ServiceCopyResolver = (key: ServiceCopyKey) => string;

/** Keep DB overrides as plain text; only the enquiry heading interpolates a name. */
export function createServiceCopyResolver(
  copy: ServiceCopy,
  fallback: ServiceCopyResolver,
  name: string,
): ServiceCopyResolver {
  const validated = resolveServiceCopy((field) => copy[field.slice(5) as ServiceCopyKey]);
  return (key) => {
    const value = validated[key];
    if (!value) return fallback(key);
    return key === "enquiryTitle" ? value.replace("{name}", () => name) : value;
  };
}

/** A supplied label may already contain the decorative arrow. Render one suffix. */
export function actionLabel(label: string): string {
  return `${label.trim().replace(/(?:\s*→)+\s*$/u, "").trimEnd()} →`;
}

type BookingService = Pick<ServiceDetail, "bookingType" | "cta" | "ctaLabel" | "copy"> & {
  detail: Pick<ServiceDetail["detail"], "partners">;
};
export function serviceBookingView(
  service: BookingService,
  labels: ServiceCopyResolver,
  requestFallback: string,
  whatsapp: string | null | undefined,
) {
  let primary: { href: string; label: string } | undefined;
  let secondary: { href: string; label: string } | undefined;
  let mobileLabel: string | undefined;
  const enquiry = service.bookingType === "enquiry";
  if (enquiry) {
    primary = { href: "#enquire", label: actionLabel(service.ctaLabel || requestFallback) };
    const short = serviceCopyValueSchema("requestShort").safeParse(service.copy.requestShort);
    mobileLabel = (short.success && short.data) || service.ctaLabel || labels("requestShort");
    if (whatsapp)
      secondary = {
        href: `https://wa.me/${whatsapp.replace(/\D/g, "")}`,
        label: labels("whatsappCta"),
      };
  } else if (service.bookingType === "external" && service.cta) {
    const label = service.ctaLabel || service.cta.label;
    primary = { href: service.cta.url, label: actionLabel(label) };
    mobileLabel = label;
  } else if (service.detail.partners.length) {
    primary = { href: "#partners", label: actionLabel(labels("seePartners")) };
    mobileLabel = labels("seePartners");
  }
  return { enquiry, primary, secondary, mobileLabel };
}

export function servicePriceView(
  service: Pick<ServiceDetail, "priceDisplay" | "priceFrom" | "priceSuffix" | "presentation"> & {
    detail: Pick<ServiceDetail["detail"], "price_note">;
  },
  locale: Locale,
  onRequest: string,
) {
  const display = service.priceDisplay;
  const price = display === "from" ? formatPrice(service.priceFrom, locale) : null;
  const suffix = price !== null ? service.priceSuffix : null;
  const explicitMode = service.presentation?.price_display;
  const priceNote = display === "hidden" || explicitMode === "on_request"
    ? undefined
    : service.detail.price_note;
  return {
    hidden: display === "hidden",
    price,
    suffix,
    priceNote,
    mobilePrice: display === "hidden" ? null : price ?? onRequest,
  };
}
