import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { getPageEditModel } from "@slices/pages/admin/queries";
import { PageEditor } from "@slices/pages/admin/ui/page-editor";

/** Page editor route (`/admin/pages/[key]`). Gated by `(panel)`. */
export default async function EditPageRoute({ params }: { params: Promise<{ key: string }> }) {
  await requireStaff();
  const { key } = await params;

  const model = await getPageEditModel(key);
  if (!model) notFound();

  return (
    <PageEditor
      pageKey={model.key}
      rootNode={model.rootNode}
      initialData={model.data}
      initialStatus={model.status}
      initialOgImageMediaId={model.ogImageMediaId}
      previews={model.previews}
    />
  );
}
