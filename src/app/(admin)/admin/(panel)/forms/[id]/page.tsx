import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { FormEditor, getFormEditor } from "@slices/forms/contract";
export default async function FormRoute({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const model = await getFormEditor(id);
  if (!model) notFound();
  return <FormEditor model={model} />;
}
