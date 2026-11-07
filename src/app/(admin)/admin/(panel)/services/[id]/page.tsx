import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { listServiceCategoryOptions } from "@slices/services/admin/queries";
import { getServiceEditorialModel } from "@slices/services/server/locale-model";
import { ServiceForm } from "@slices/services/admin/ui/service-form";

/** Edit-service route (`/admin/services/[id]`). Gated by `(panel)`. */
export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const [bundle, categories] = await Promise.all([
    getServiceEditorialModel(id),
    listServiceCategoryOptions(),
  ]);
  if (!bundle) notFound();
  return <ServiceForm initial={bundle} categories={categories} />;
}
