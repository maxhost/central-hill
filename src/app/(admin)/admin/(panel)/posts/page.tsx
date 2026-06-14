import { requireStaff } from "@core/auth";
import { PostsAdminList } from "@slices/blog/admin/ui/list";

/** Blog-posts list route (`/admin/posts`). Gated by `(panel)`. */
export default async function PostsPage() {
  await requireStaff();
  return <PostsAdminList />;
}
