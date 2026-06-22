import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@core/db/columns";
import { buildMetadata } from "@core/seo";
import { OwnersPage } from "@slices/pages/ui/owners-page";
import "../../mock.css";

/** Static per locale. Content is the embedded mock (no DB). */
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

  const languages: Partial<Record<Locale | "x-default", string>> = { "x-default": "/owners" };
  for (const l of routing.locales) languages[l] = `/${l}/owners`;

  return buildMetadata({
    title: "For Owners — Central Hill",
    description:
      "Turn your Portugal property into a high-performing asset — fully managed, transparent, with consistently above-market returns. AI-driven pricing and a 24/7 owner dashboard.",
    canonicalPath: `/${locale}/owners`,
    languages,
  });
}

export default async function OwnersRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <OwnersPage locale={locale} />;
}
