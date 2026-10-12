import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildGuestMetadata } from "@slices/pages/contract";
import { GuestPage } from "@slices/pages/ui/guest-page";

/**
 * Static per locale (ISR). Content is the `guest` page_content row plus the buildings,
 * testimonials, faq and settings slices — see `src/slices/pages/ui/guest-page.tsx`.
 * `savePage("guest", …)` revalidates this path for all four locales. Metadata: the page's
 * `seo.*` with the `pages.guests.*` fallback (spec guests-admin-editor S2).
 */
export const revalidate = 3600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  setRequestLocale(locale);

  return buildGuestMetadata(locale);
}

export default async function GuestsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <GuestPage locale={locale} />;
}
