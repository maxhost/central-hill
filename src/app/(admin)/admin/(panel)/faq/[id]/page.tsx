import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { getFaqGroupForEdit } from "@slices/faq/admin/queries";
import { FaqGroupForm } from "@slices/faq/admin/ui/group-form";

/** Edit-FAQ-group route (`/admin/faq/[id]`). Gated by `(panel)`. */
export default async function EditFaqGroupPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const data = await getFaqGroupForEdit(id);
  if (!data) notFound();
  return <FaqGroupForm initial={data} />;
}
