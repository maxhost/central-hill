import { requireStaff } from "@core/auth";
import { AuthorsAdminList } from "@slices/blog/admin/ui/author-list";

/** Authors list route (`/admin/authors`). Gated by `(panel)`. */
export default async function AuthorsPage() {
  await requireStaff();
  return <AuthorsAdminList />;
}
