import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { getServiceForEdit, listServiceCategoryOptions } from "@slices/services/admin/queries";
import { ServiceForm } from "@slices/services/admin/ui/service-form";

/** Edit-service route (`/admin/services/[id]`). Gated by `(panel)`. */
export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const [bundle, categories] = await Promise.all([
    getServiceForEdit(id),
    listServiceCategoryOptions(),
  ]);
  if (!bundle) notFound();
  return <ServiceForm initial={bundle.data} previews={bundle.previews} categories={categories} />;
}
