import { requireStaff } from "@core/auth";
import { AuthorForm } from "@slices/blog/admin/ui/author-form";

/** New-author route (`/admin/authors/new`). Gated by `(panel)`. */
export default async function NewAuthorPage() {
  await requireStaff();
  return <AuthorForm initial={null} previews={{}} />;
}
