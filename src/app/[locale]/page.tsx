import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("common");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm uppercase tracking-widest text-neutral-500">Central Hill</p>
      <h1 className="text-balance text-4xl font-semibold">{t("tagline")}</h1>
      <p className="text-neutral-500">Scaffold online — slices wire their routes here.</p>
    </main>
  );
}
