import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { GuestPage } from "@slices/pages/ui/guest-page";
import "../../mock.css";

/**
 * Static per locale (ISR). Content is the `guest` page_content row plus the buildings,
 * testimonials, faq and settings slices — see `src/slices/pages/ui/guest-page.tsx`.
 * `savePage("guest", …)` revalidates this path for all four locales.
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

  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": "/guests" };
  for (const l of routing.locales) languages[l] = `/${l}/guests`;

  const t = await getTranslations({ locale, namespace: "pages" });

  return buildMetadata({
    title: t("guests.metaTitle"),
    description: t("guests.metaDescription"),
    canonicalPath: `/${locale}/guests`,
    languages,
  });
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
