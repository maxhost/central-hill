import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import {
  getPostForEdit,
  listAuthorOptions,
  listBlogCategoryOptions,
  listPostOptions,
} from "@slices/blog/admin/queries";
import { PostForm } from "@slices/blog/admin/ui/post-form";

/** Edit-post route (`/admin/posts/[id]`). Gated by `(panel)`. */
export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const [bundle, categories, authors, posts] = await Promise.all([
    getPostForEdit(id),
    listBlogCategoryOptions(),
    listAuthorOptions(),
    listPostOptions(),
  ]);
  if (!bundle) notFound();
  return (
    <PostForm
      initial={bundle.data}
      previews={bundle.previews}
      categories={categories}
      authors={authors}
      posts={posts}
    />
  );
}
