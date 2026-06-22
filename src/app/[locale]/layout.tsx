import type { ReactNode } from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SiteFooter } from "@slices/settings/ui/site-footer";
import { SiteHeader } from "@slices/settings/ui/site-header";
import { WhatsAppFab } from "@slices/settings/ui/components/whatsapp-fab";
import { SiteJsonLd } from "@slices/seo/contract";
import type { Locale } from "@core/db/columns";
import "../globals.css";

/** Statically generate every locale segment (no DB at request time). */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enables static rendering for this locale.
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <SiteJsonLd locale={locale as Locale} />
          <SiteHeader locale={locale as Locale} />
          <div id="main">{children}</div>
          <SiteFooter locale={locale as Locale} />
          <WhatsAppFab />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
