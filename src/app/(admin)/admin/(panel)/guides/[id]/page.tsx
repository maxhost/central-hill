import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireStaff } from "@core/auth";
import { getGuideEditorialModel, GuideEditor } from "@slices/guides/contract";

export default async function GuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  await requireStaff(["admin", "editor"]);
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  let initial;
  try {
    initial = await getGuideEditorialModel(id);
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "GuideLegacyError")
      throw error;
    const t = await getTranslations("guides.admin");
    return (
      <div className="space-y-4">
        <p
          role="alert"
          className="rounded-md border border-line p-4 text-sm text-ink"
        >
          {t("invalidStored")}
        </p>
        <Link
          href="/admin/guides"
          className="text-sm text-ink-soft underline underline-offset-4"
        >
          {t("back")}
        </Link>
      </div>
    );
  }
  if (!initial) notFound();
  return (
    <GuideEditor
      key={initial.id}
      initial={initial}
      cities={initial.cities}
      initialLocale={(await searchParams).locale}
      draft={{
        ...initial.locales.en.working.content,
        id: initial.id,
        status: initial.status,
        slug: initial.slugByLocale.en ?? "",
        slugs: initial.slugByLocale,
      }}
    />
  );
}
