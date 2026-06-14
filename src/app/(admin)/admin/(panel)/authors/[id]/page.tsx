import { notFound } from "next/navigation";
import { requireStaff } from "@core/auth";
import { getAuthorForEdit } from "@slices/blog/admin/queries";
import { AuthorForm } from "@slices/blog/admin/ui/author-form";

/** Edit-author route (`/admin/authors/[id]`). Gated by `(panel)`. */
export default async function EditAuthorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const bundle = await getAuthorForEdit(id);
  if (!bundle) notFound();
  return <AuthorForm initial={bundle.data} previews={bundle.previews} />;
}
