"use server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { loadAlternateSlugs } from "@core/i18n";
import { blog_post } from "../schema";
import type { SaveBlogPostDraftInput, PublishBlogPostDraftInput, BlogPostEditorialResult } from "../editorial-types";
import { savePostDraft, publishPostDraft } from "../server/post-locale-store";
import { revalidatePost } from "../server/publish";

export async function savePostLocaleDraft(input: SaveBlogPostDraftInput): Promise<BlogPostEditorialResult> {
  const staff = await requireStaff();
  const result = await savePostDraft(input, staff.userId);
  if (result.ok) {
    revalidatePath("/admin/posts");
    revalidatePath(`/admin/posts/${result.postId}`);
  }
  return result;
}
export async function publishPostLocaleDraft(input: PublishBlogPostDraftInput): Promise<BlogPostEditorialResult> {
  const staff = await requireStaff();
  const result = await publishPostDraft(input, staff.userId);
  if (!result.ok) return result;
  try {
    revalidatePost(result.postId, result.slugByLocale);
    revalidatePath("/admin/posts");
    revalidatePath(`/admin/posts/${result.postId}`);
    return result;
  } catch { return { ...result, refreshWarning: true }; }
}
export async function archivePost(postId: string): Promise<{ ok: boolean; refreshWarning?: boolean }> {
  await requireStaff();
  if (!z.uuid().safeParse(postId).success) return { ok: false };
  try {
    const slugs = await loadAlternateSlugs("blog_post", postId);
    const rows = await db.update(blog_post).set({ status: "archived", updated_at: new Date() }).where(eq(blog_post.id, postId)).returning({ id: blog_post.id });
    if (!rows.length) return { ok: false };
    try {
      revalidatePost(postId, slugs);
      revalidatePath("/admin/posts");
      revalidatePath(`/admin/posts/${postId}`);
      return { ok: true };
    } catch { return { ok: true, refreshWarning: true }; }
  } catch {
    return { ok: false };
  }
}
