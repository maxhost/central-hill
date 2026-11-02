import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { sourceSnapshotCtes } from "@core/i18n";
import { loadMedia } from "@core/media";
import { uuid } from "@core/validation/primitives";
import { blogSourceFields } from "../blog-content";
import { page_content } from "../schema";
import { blogSchema, type BlogContent } from "../schemas/blog";
import { blogMediaErrors, blogMediaReferences } from "./blog-media-validation";
import type { PageSaveResult } from "./actions";

export async function saveBlog(content: BlogContent, og: string | null, actor: string): Promise<PageSaveResult> {
  const [existing] = await db.select({ data: page_content.data }).from(page_content).where(eq(page_content.key, "blog")).limit(1);
  if (existing && !blogSchema.safeParse(existing.data).success) {
    return { ok: false, error: "validation", fieldErrors: { _source: "The saved Blog content is invalid. Repair it before saving." } };
  }
  // Reject malformed IDs before asking the media query to cast them to UUIDs.
  const refs = blogMediaReferences(content, og);
  const malformed = refs.filter(ref => !uuid.safeParse(ref.id).success);
  if (malformed.length) return { ok: false, error: "validation", fieldErrors: Object.fromEntries(malformed.map(ref => [ref.path, "Select an uploaded image."])) };
  const assets = await loadMedia(refs.map(ref => ref.id));
  const errors = blogMediaErrors(content, og, assets);
  if (Object.keys(errors).length) return { ok: false, error: "validation", fieldErrors: errors };
  const sync = sourceSnapshotCtes("page_content", sql`select id from saved`, blogSourceFields(content), actor);
  await db.execute(sql`with saved as (
    insert into page_content (key, data, og_image_media_id) values ('blog', ${JSON.stringify(content)}::jsonb, ${og}::uuid)
    on conflict (key) do update set data=excluded.data, og_image_media_id=excluded.og_image_media_id, updated_at=now()
    returning id
  ), ${sync} select id from saved`);
  return { ok: true };
}
