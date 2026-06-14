import { getTranslations } from "next-intl/server";
import { LoginForm } from "@slices/backoffice/contract";

/** Ungated backoffice sign-in screen (outside the `(panel)` gate). */
export default async function LoginPage() {
  const t = await getTranslations("backoffice");
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl text-ink">{t("login.title")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t("login.subtitle")}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
