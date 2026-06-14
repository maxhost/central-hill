import { requireStaff } from "@core/auth";
import { listAuthorOptions, listBlogCategoryOptions, listPostOptions } from "@slices/blog/admin/queries";
import { PostForm } from "@slices/blog/admin/ui/post-form";

/** New-post route (`/admin/posts/new`). Gated by `(panel)`. */
export default async function NewPostPage() {
  await requireStaff();
  const [categories, authors, posts] = await Promise.all([
    listBlogCategoryOptions(),
    listAuthorOptions(),
    listPostOptions(),
  ]);
  return <PostForm initial={null} previews={{}} categories={categories} authors={authors} posts={posts} />;
}
