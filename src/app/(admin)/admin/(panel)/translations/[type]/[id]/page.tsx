import { requireStaff } from "@core/auth";
import { TranslationReview } from "@slices/translation/admin/ui/review";

/**
 * Per-entity translation review route (`/admin/translations/[type]/[id]`). Gated by
 * `(panel)`; the selected target locale comes from `?locale=` (validated by the
 * screen, defaulting to the first target). The screen `notFound()`s when the entity
 * has no [T] rows.
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

  return <TranslationReview type={type} id={id} locale={locale} />;
}
