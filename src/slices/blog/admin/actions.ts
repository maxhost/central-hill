"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import {
  deleteContent,
  deleteSlugs,
  setSourceContent,
} from "@core/i18n/content-write";
import { loadAlternateSlugs } from "@core/i18n";
import { BLOG_POST } from "../contract";
import { author, blog_category, blog_post } from "../schema";
import { deletePostIdentityIfUnused } from "../server/post-locale-store";
import { revalidateBlogList, revalidatePost } from "../server/publish";
import {
  authorSaveInput,
  blogCategorySaveInput,
} from "./validation";

/**
 * Backoffice write actions for slice `blog` (S12). `requireStaff`-gated + re-validated.
 * Post slug + source [T] content (incl. the portable-JSON `body`, stored as one field)
 * go through the `core/i18n` write seam (ADR 0019); related posts ride along as an
 * ordered set. Category/author carry a plain-column slug and their deletes refuse while
 * a post references them (RESTRICT FK). All writes bust the relevant blog tags.
 */

const BLOG_CATEGORY = "blog_category";
const AUTHOR = "author";

export type BlogSaveResult =
  | { ok: true; id: string }
  | { ok: false; error: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; error: "slug_conflict" }
  | { ok: false; error: "not_found" }
  | { ok: false; error: "server" };

export type RefDeleteResult = { ok: true } | { ok: false; error: "in_use" | "server" };

function fieldErrorsFrom(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}


// ── Categories ───────────────────────────────────────────────────────────────
export async function saveBlogCategory(raw: unknown): Promise<BlogSaveResult> {
  const staff = await requireStaff();
  const parsed = blogCategorySaveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const input = parsed.data;
  const coreValues = { slug: input.slug, color: input.color, position: input.position };
  try {
    let id = input.id ?? "";
    if (input.id) {
      const [exists] = await db
        .select({ id: blog_category.id })
        .from(blog_category)
        .where(eq(blog_category.id, input.id))
        .limit(1);
      if (!exists) return { ok: false, error: "not_found" };
      await db
        .update(blog_category)
        .set({ ...coreValues, updated_at: new Date() })
        .where(eq(blog_category.id, input.id));
    } else {
      const [ins] = await db
        .insert(blog_category)
        .values(coreValues)
        .returning({ id: blog_category.id });
      if (!ins) return { ok: false, error: "server" };
      id = ins.id;
    }
    await setSourceContent(BLOG_CATEGORY, id, { name: input.name }, { updatedBy: staff.userId });
    revalidateBlogList();
    revalidatePath("/admin/blog-categories");
    revalidatePath(`/admin/blog-categories/${id}`);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function deleteBlogCategory(id: string): Promise<RefDeleteResult> {
  await requireStaff();
  try {
    const [inUse] = await db
      .select({ id: blog_post.id })
      .from(blog_post)
      .where(eq(blog_post.category_id, id))
      .limit(1);
    if (inUse) return { ok: false, error: "in_use" };
    const references = await db.execute(sql`select id from blog_post_locale_content where
      published->'content'->>'category_id'=${id} or draft->'content'->>'category_id'=${id} limit 1`);
    if (references.rows.length) return { ok: false, error: "in_use" };
    await db.delete(blog_category).where(eq(blog_category.id, id));
    await deleteContent(BLOG_CATEGORY, id);
    revalidateBlogList();
    revalidatePath("/admin/blog-categories");
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

// ── Authors ──────────────────────────────────────────────────────────────────
export async function saveAuthor(raw: unknown): Promise<BlogSaveResult> {
  const staff = await requireStaff();
  const parsed = authorSaveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const input = parsed.data;
  const coreValues = {
    slug: input.slug,
    status: input.status,
    avatar_media_id: input.avatar_media_id,
  };
  try {
    let id = input.id ?? "";
    if (input.id) {
      const [exists] = await db
        .select({ id: author.id })
        .from(author)
        .where(eq(author.id, input.id))
        .limit(1);
      if (!exists) return { ok: false, error: "not_found" };
      await db
        .update(author)
        .set({ ...coreValues, updated_at: new Date() })
        .where(eq(author.id, input.id));
    } else {
      const [ins] = await db.insert(author).values(coreValues).returning({ id: author.id });
      if (!ins) return { ok: false, error: "server" };
      id = ins.id;
    }
    await setSourceContent(AUTHOR, id, { name: input.name, bio: input.bio }, { updatedBy: staff.userId });
    revalidateBlogList();
    revalidatePath("/admin/authors");
    revalidatePath(`/admin/authors/${id}`);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function deleteAuthor(id: string): Promise<RefDeleteResult> {
  await requireStaff();
  try {
    const [inUse] = await db
      .select({ id: blog_post.id })
      .from(blog_post)
      .where(eq(blog_post.author_id, id))
      .limit(1);
    if (inUse) return { ok: false, error: "in_use" };
    const references = await db.execute(sql`select id from blog_post_locale_content where
      published->'content'->>'author_id'=${id} or draft->'content'->>'author_id'=${id} limit 1`);
    if (references.rows.length) return { ok: false, error: "in_use" };
    await db.delete(author).where(eq(author.id, id));
    await deleteContent(AUTHOR, id);
    revalidateBlogList();
    revalidatePath("/admin/authors");
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

// ── Posts ────────────────────────────────────────────────────────────────────
/** Retired live entrypoint: adapted posts must use locale draft/publication actions. */
export async function savePost(_raw: unknown): Promise<BlogSaveResult> {
  await requireStaff();
  void _raw;
  return { ok: false, error: "validation", fieldErrors: { _source: "Use Save draft and Publish in the post editor." } };
}

export async function deletePost(id: string): Promise<{ ok: true } | { ok: false; error: "in_use" | "not_found" | "server" }> {
  await requireStaff();
  try {
    const slugs = await loadAlternateSlugs(BLOG_POST, id);
    const deleted = await deletePostIdentityIfUnused(id);
    if (!deleted.ok) return deleted;
    await deleteContent(BLOG_POST, id);
    await deleteSlugs(BLOG_POST, id);
    revalidatePost(id, slugs);
    revalidatePath("/admin/posts");
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

