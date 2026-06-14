import { requireStaff } from "@core/auth";
import { BlogCategoriesAdminList } from "@slices/blog/admin/ui/category-list";

/** Blog-categories list route (`/admin/blog-categories`). Gated by `(panel)`. */
export default async function BlogCategoriesPage() {
  await requireStaff();
  return <BlogCategoriesAdminList />;
}
