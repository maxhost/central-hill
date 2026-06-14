import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { getBlogCategoryForEdit } from "@slices/blog/admin/queries";
import { BlogCategoryForm } from "@slices/blog/admin/ui/category-form";

/** Edit-blog-category route (`/admin/blog-categories/[id]`). Gated by `(panel)`. */
export default async function EditBlogCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const data = await getBlogCategoryForEdit(id);
  if (!data) notFound();
  return <BlogCategoryForm initial={data} />;
}
