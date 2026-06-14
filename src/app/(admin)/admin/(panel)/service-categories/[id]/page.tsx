import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { getServiceCategoryForEdit } from "@slices/services/admin/queries";
import { ServiceCategoryForm } from "@slices/services/admin/ui/category-form";

/** Edit-service-category route (`/admin/service-categories/[id]`). Gated by `(panel)`. */
export default async function EditServiceCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const data = await getServiceCategoryForEdit(id);
  if (!data) notFound();
  return <ServiceCategoryForm initial={data} />;
}
