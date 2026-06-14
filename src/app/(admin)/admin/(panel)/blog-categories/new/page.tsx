import { requireStaff } from "@core/auth";
import { BlogCategoryForm } from "@slices/blog/admin/ui/category-form";

/** New-blog-category route (`/admin/blog-categories/new`). Gated by `(panel)`. */
export default async function NewBlogCategoryPage() {
  await requireStaff();
  return <BlogCategoryForm initial={null} />;
}
