import { requireStaff } from "@core/auth";
import { getEditorialEditModel } from "@slices/pages/admin/editorial-queries";
import { PageContextualEditor } from "@slices/pages/admin/ui/page-contextual-editor";

export default async function BlogArticleSidebarEditor() {
  await requireStaff();
  return <PageContextualEditor key="blog-article" model={await getEditorialEditModel("blog")} view="blog_article" />;
}
