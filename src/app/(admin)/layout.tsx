import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ToastProvider } from "@slices/backoffice/contract";
import "../globals.css";

/**
 * Root layout for the backoffice surface (the `(admin)` route group). It is a
 * second root layout alongside the public `[locale]/layout.tsx`; admin routes
 * live at `/admin` and are NOT locale-prefixed (ADR 0017 — interim path split;
 * the eventual `backoffice.*` host rewrite per ADR 0004 maps onto these paths
 * without touching them). Chrome is English for now, pinned via
 * `setRequestLocale`; `NextIntlClientProvider` forwards messages to the client
 * islands (login form, nav, sign-out).
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  setRequestLocale("en");
  return (
    <html lang="en">
      <body className="bg-bg text-ink antialiased">
        <NextIntlClientProvider>
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
