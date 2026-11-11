import { requireStaff } from "@core/auth";
import { getLegacyTranslationRedirect } from "@slices/translation/contract";
import { redirect } from "next/navigation";

/**
 * Authenticated compatibility links to the owning editors (ADR0077).
 */
export default async function TranslationReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const { type, id } = await params;
  const sp = await searchParams;
  const locale = typeof sp.locale === "string" ? sp.locale : undefined;

  redirect(await getLegacyTranslationRedirect(type, id, locale));
}
