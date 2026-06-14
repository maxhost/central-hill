"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import {
  SlugConflictError,
  deleteContent,
  deleteSlugs,
  setSlugs,
  setSourceContent,
} from "@core/i18n/content-write";
import { BLOG_POST } from "../contract";
import { author, blog_category, blog_post, blog_post_related } from "../schema";
import { revalidateBlogList, revalidatePost } from "../server/publish";
import {
  type BlogPostSaveInput,
  authorSaveInput,
  blogCategorySaveInput,
  blogPostSaveInput,
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

const sameSlugAllLocales = (slug: string) => ({ en: slug, pt: slug, es: slug, fr: slug });

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
export async function savePost(raw: unknown): Promise<BlogSaveResult> {
  const staff = await requireStaff();
  const parsed = blogPostSaveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const input = parsed.data;

  const publishedAt =
    input.published_at && input.published_at.trim() ? new Date(input.published_at) : null;

  const coreValues = {
    slug: input.slug,
    status: input.status,
    category_id: input.category_id,
    author_id: input.author_id,
    cover_media_id: input.cover_media_id,
    og_image_media_id: input.og_image_media_id,
    published_at: publishedAt,
    reading_minutes: input.reading_minutes,
    is_featured: input.is_featured,
    cta_url: input.cta_url,
  };

  try {
    const isCreate = !input.id;
    let id = input.id ?? "";

    if (input.id) {
      const [exists] = await db
        .select({ id: blog_post.id })
        .from(blog_post)
        .where(eq(blog_post.id, input.id))
        .limit(1);
      if (!exists) return { ok: false, error: "not_found" };
      await db
        .update(blog_post)
        .set({ ...coreValues, updated_at: new Date() })
        .where(eq(blog_post.id, input.id));
    } else {
      const [ins] = await db.insert(blog_post).values(coreValues).returning({ id: blog_post.id });
      if (!ins) return { ok: false, error: "server" };
      id = ins.id;
    }

    try {
      await setSlugs(BLOG_POST, id, sameSlugAllLocales(input.slug));
    } catch (err) {
      if (err instanceof SlugConflictError) {
        if (isCreate) {
          await db.delete(blog_post).where(eq(blog_post.id, id));
          await deleteSlugs(BLOG_POST, id);
        }
        return { ok: false, error: "slug_conflict" };
      }
      throw err;
    }

    await setSourceContent(
      BLOG_POST,
      id,
      {
        title: input.title,
        excerpt: input.excerpt,
        body: JSON.stringify(input.body),
        cta_label: input.cta_label,
        meta_title: input.meta_title,
        meta_description: input.meta_description,
      },
      { updatedBy: staff.userId },
    );

    await persistRelated(id, input.related_ids);

    revalidatePost(id, sameSlugAllLocales(input.slug));
    revalidatePath("/admin/posts");
    revalidatePath(`/admin/posts/${id}`);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function deletePost(id: string): Promise<{ ok: boolean }> {
  await requireStaff();
  try {
    await db.delete(blog_post).where(eq(blog_post.id, id)); // cascades blog_post_related
    await deleteContent(BLOG_POST, id);
    await deleteSlugs(BLOG_POST, id);
    revalidatePost(id, {});
    revalidatePath("/admin/posts");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Replace the curated related-post rows (dedupe, drop self, keep order, ≤3). */
async function persistRelated(
  postId: string,
  relatedIds: BlogPostSaveInput["related_ids"],
): Promise<void> {
  await db.delete(blog_post_related).where(eq(blog_post_related.post_id, postId));
  const clean = Array.from(new Set(relatedIds.filter((rid) => rid !== postId))).slice(0, 3);
  if (clean.length > 0) {
    await db
      .insert(blog_post_related)
      .values(clean.map((rid, i) => ({ post_id: postId, related_post_id: rid, position: i })));
  }
}
