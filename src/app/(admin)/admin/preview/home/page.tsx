import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { requireStaff } from "@core/auth";
import { HomePageRenderer, homeEditorBindingIds, getPageDraftPreview, renderHomeLivePreview } from "@slices/pages/contract";
import { PageEditorLivePreview } from "@slices/backoffice/contract";
import { SiteHeader, SiteFooter } from "@slices/settings/contract";
import type { Locale } from "@core/db/columns";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { robots: { index: false, follow: false } };

/** Staff-only preview; saved baseline plus ephemeral local snapshots, never public ISR. */
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
    <PageEditorLivePreview instance={query.instance} bindingIds={homeEditorBindingIds}
      renderPreviewAction={renderHomeLivePreview.bind(null, locale)}>
      <HomePageRenderer locale={locale as Locale} preview page={page} />
    </PageEditorLivePreview>
    <SiteFooter locale={locale as Locale} />
  </NextIntlClientProvider>;
}
