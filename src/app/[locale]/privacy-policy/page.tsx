import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getLegalPage, buildLegalPageMetadata } from "@slices/pages/legal-public-contract";
import { LegalPage } from "@slices/pages/ui/legal-page";

// Keep footer navigation fresh after Publish; page data retains its explicit tagged cache.
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  setRequestLocale(locale);
  return buildLegalPageMetadata("privacy_policy", locale);
}
export default async function LegalPageRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const page = await getLegalPage("privacy_policy", locale);
  if (!page) notFound();
  return <LegalPage pageKey="privacy_policy" locale={locale} page={page} />;
}
