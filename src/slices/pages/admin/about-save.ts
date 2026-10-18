import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { hashSource, sourceSnapshotCtes } from "@core/i18n";
import { loadMedia } from "@core/media";
import { uuid } from "@core/validation/primitives";
import { aboutIdentityErrors, aboutSourceFields, normalizeAbout, retireAboutIds } from "../about-content";
import { page_content } from "../schema";
import { aboutSchema, defaultAbout, type AboutContent } from "../schemas/about";
import { aboutMediaErrors, aboutMediaReferences } from "./about-media-validation";
import type { PageSaveResult } from "./actions";

export function aboutRevision(row: { data: unknown; og_image_media_id: string | null; updated_at: Date } | undefined): string {
  return row ? hashSource(JSON.stringify([row.data, row.og_image_media_id, row.updated_at.toISOString()])) : "missing";
}
export async function saveAbout(content: AboutContent, og: string | null, revision: string | undefined, actor: string): Promise<PageSaveResult> {
  const [existing] = await db.select().from(page_content).where(eq(page_content.key, "about")).limit(1);
  if (!revision || revision !== aboutRevision(existing)) return { ok: false, error: "conflict" };
  const parsed = aboutSchema.safeParse(existing?.data ?? defaultAbout);
  if (!parsed.success) return { ok: false, error: "validation", fieldErrors: { _source: "The saved About content is invalid. Repair it before saving." } };
  const previous = normalizeAbout(parsed.data);
  if (Object.keys(aboutIdentityErrors(previous)).length) return { ok: false, error: "validation", fieldErrors: { _source: "The saved About identities are invalid. Repair them before saving." } };
  // Authored requests must carry identity metadata; normalizing an arbitrary payload would
  // rebind missing IDs to current positions and revive the original ordering defect.
  const errors = aboutIdentityErrors(content, previous);
  if (og && !uuid.safeParse(og).success) errors.og_image_media_id = "Select an uploaded image.";
  if (Object.keys(errors).length) return { ok: false, error: "validation", fieldErrors: errors };
  const data = retireAboutIds(content, previous);
  const assets = await loadMedia(aboutMediaReferences(data, og).map(ref => ref.id));
  const mediaErrors = aboutMediaErrors(data, og, assets);
  if (Object.keys(mediaErrors).length) return { ok: false, error: "validation", fieldErrors: mediaErrors };
  // The raw snapshot guard is evaluated again under the row lock by PostgreSQL.
  // Do not compare JS millisecond dates to PostgreSQL microsecond timestamps.
  const guard = existing
    ? sql`page_content.data=${JSON.stringify(existing.data)}::jsonb and page_content.og_image_media_id is not distinct from ${existing.og_image_media_id}::uuid and date_trunc('milliseconds', page_content.updated_at)=${existing.updated_at.toISOString()}::timestamptz`
    : sql`false`;
  const sync = sourceSnapshotCtes("page_content", sql`select id from saved`, aboutSourceFields(data), actor);
  const result = await db.execute(sql`with saved as (
    insert into page_content (key, data, og_image_media_id) values ('about', ${JSON.stringify(data)}::jsonb, ${og}::uuid)
    on conflict (key) do update set data=excluded.data, og_image_media_id=excluded.og_image_media_id, updated_at=now()
    where ${guard} returning id
  ), ${sync} select id from saved`);
  return result.rows.length ? { ok: true } : { ok: false, error: "conflict" };
}
