import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { requireStaff } from "@core/auth";
import { HomePageRenderer, homeEditorBindingIds, getPageDraftPreview } from "@slices/pages/contract";
import { PageEditorPreviewBridge } from "@slices/backoffice/contract";
import { SiteHeader, SiteFooter } from "@slices/settings/contract";
import type { Locale } from "@core/db/columns";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { robots: { index: false, follow: false } };

/** Staff-only saved-content preview; no snapshot payload or public ISR entry. */
export default async function HomePreview({ searchParams }: {
  searchParams: Promise<{ locale?: string; instance?: string }>;
}) {
  await requireStaff();
  const query = await searchParams;
  const locale = query.locale ?? "en";
  if (!["en", "es", "pt", "fr"].includes(locale) || !query.instance || !/^[a-zA-Z0-9_-]{1,100}$/.test(query.instance)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const page = await getPageDraftPreview("home", locale as Locale);
  return <NextIntlClientProvider locale={locale} messages={messages}>
    <SiteHeader locale={locale as Locale} />
    <HomePageRenderer locale={locale as Locale} preview page={page} />
    <SiteFooter locale={locale as Locale} />
    <PageEditorPreviewBridge instance={query.instance} bindingIds={homeEditorBindingIds} />
  </NextIntlClientProvider>;
}
