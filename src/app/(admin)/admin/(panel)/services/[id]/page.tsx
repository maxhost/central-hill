import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@core/auth";
import { listServiceCategoryOptions } from "@slices/services/admin/queries";
import { getServiceEditorialModel } from "@slices/services/server/locale-model";
import { ServiceLegacyError } from "@slices/services/server/locale-bootstrap";
import { ServiceForm } from "@slices/services/admin/ui/service-form";

/** Edit-service route (`/admin/services/[id]`). Gated by `(panel)`. */
export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  let bundle;
  try {
    bundle = await getServiceEditorialModel(id);
  } catch (error) {
    if (!(error instanceof ServiceLegacyError)) throw error;
    const t = await getTranslations("services");
    return <div className="space-y-4">
      <p role="alert" className="rounded-md border border-line p-4 text-sm text-ink">{t("admin.presentation.integrity")}</p>
      <Link href="/admin/services" className="text-sm text-ink-soft underline underline-offset-4">{t("admin.backToList")}</Link>
    </div>;
  }
  if (!bundle) notFound();
  const categories = await listServiceCategoryOptions();
  return <ServiceForm initial={bundle} categories={categories} />;
}
