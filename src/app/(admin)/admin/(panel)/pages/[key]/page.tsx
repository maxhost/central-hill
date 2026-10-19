import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { getPageEditModel } from "@slices/pages/admin/queries";
import { getHomeEditorialModel } from "@slices/pages/admin/editorial-queries";
import { HomeContextualEditor } from "@slices/pages/admin/ui/home-contextual-editor";
import { PageEditor } from "@slices/pages/admin/ui/page-editor";

/** Page editor route (`/admin/pages/[key]`). Gated by `(panel)`. */
export default async function EditPageRoute({ params }: { params: Promise<{ key: string }> }) {
  await requireStaff();
  const { key } = await params;

  if (key === "home") {
    const model = await getHomeEditorialModel();
    return <HomeContextualEditor model={model} />;
  }

  const model = await getPageEditModel(key);
  if (!model) notFound();

  return (
    <PageEditor
      pageKey={model.key}
      rootNode={model.rootNode}
      initialData={model.data}
      initialOgImageMediaId={model.ogImageMediaId}
      previews={model.previews}
      options={model.options}
      sourceInvalid={model.sourceInvalid}
      revision={model.revision}
      pageId={model.pageId}
      inheritedValues={model.inheritedValues}
    />
  );
}
