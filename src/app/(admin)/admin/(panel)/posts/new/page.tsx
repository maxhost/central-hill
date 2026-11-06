import { randomUUID } from "node:crypto";
import { requireStaff } from "@core/auth";
import { listAuthorOptions, listBlogCategoryOptions, listPostOptions } from "@slices/blog/admin/queries";
import { PostLocaleEditor } from "@slices/blog/admin/ui/post-locale-editor";
export default async function NewPostPage() {
 await requireStaff();
 const [categories,authors,posts]=await Promise.all([listBlogCategoryOptions(),listAuthorOptions(),listPostOptions()]);
 const newPostId=randomUUID();
 return <PostLocaleEditor initial={null} newPostId={newPostId} categories={categories} authors={authors} posts={posts} />;
}
