import Link from "next/link";
import { getTranslations } from "next-intl/server";

/** Shown to an authenticated user whose role lacks access to a screen. */
export default async function ForbiddenPage() {
  const t = await getTranslations("backoffice");
  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-center">
      <div className="max-w-sm">
        <h1 className="font-serif text-2xl text-ink">{t("forbidden.title")}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t("forbidden.message")}</p>
        <Link
          href="/admin"
          className="mt-6 inline-flex rounded-md bg-accent px-7 py-3 text-sm font-medium text-surface transition-colors hover:bg-accent-deep"
        >
          {t("forbidden.back")}
        </Link>
      </div>
    </main>
  );
}
