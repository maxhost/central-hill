import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { hashSource, sourceSnapshotCtes } from "@core/i18n";
import { loadMedia } from "@core/media";
import { uuid } from "@core/validation/primitives";
import { homeIdentityErrors, homeSourceFields, normalizeHome, retireHomeIds } from "../home-content";
import { page_content } from "../schema";
import { homeSchema, type HomeContent } from "../schemas/home";
import { homeMediaErrors, homeMediaReferences } from "./home-media-validation";
import type { PageSaveResult } from "./actions";

export function homeRevision(row: { data: unknown; og_image_media_id: string | null; updated_at: Date } | undefined): string {
  return row ? hashSource(JSON.stringify([row.data, row.og_image_media_id, row.updated_at.toISOString()])) : "missing";
}
export async function saveHome(content: HomeContent, og: string | null, revision: string | undefined, actor: string): Promise<PageSaveResult> {
  const [existing] = await db.select().from(page_content).where(eq(page_content.key, "home")).limit(1);
  if (!revision || revision !== homeRevision(existing)) return { ok: false, error: "conflict" };
  const parsed = homeSchema.safeParse(existing?.data ?? content);
  if (!parsed.success) return { ok: false, error: "validation", fieldErrors: { _source: "The saved Home content is invalid. Repair it before saving." } };
  const previous = normalizeHome(parsed.data);
  if (Object.keys(homeIdentityErrors(previous)).length) return { ok: false, error: "validation", fieldErrors: { _source: "The saved Home identities are invalid. Repair them before saving." } };
  // Authored requests must carry identity metadata; normalizing an arbitrary payload would
  // rebind missing IDs to current positions and revive the original ordering defect.
  const errors = homeIdentityErrors(content, previous);
  if (og && !uuid.safeParse(og).success) errors.og_image_media_id = "Select an uploaded image.";
  if (Object.keys(errors).length) return { ok: false, error: "validation", fieldErrors: errors };
  const data = retireHomeIds(content, previous);
  const assets = await loadMedia(homeMediaReferences(data, og).map(ref => ref.id));
  const mediaErrors = homeMediaErrors(data, og, assets);
  if (Object.keys(mediaErrors).length) return { ok: false, error: "validation", fieldErrors: mediaErrors };
  // The raw snapshot guard is evaluated again under the row lock by PostgreSQL.
  // Do not compare JS millisecond dates to PostgreSQL microsecond timestamps.
  const guard = existing
    ? sql`page_content.data=${JSON.stringify(existing.data)}::jsonb and page_content.og_image_media_id is not distinct from ${existing.og_image_media_id}::uuid and date_trunc('milliseconds', page_content.updated_at)=${existing.updated_at.toISOString()}::timestamptz`
    : sql`false`;
  const sync = sourceSnapshotCtes("page_content", sql`select id from saved`, homeSourceFields(data), actor);
  const result = await db.execute(sql`with saved as (
    insert into page_content (key, data, og_image_media_id) values ('home', ${JSON.stringify(data)}::jsonb, ${og}::uuid)
    on conflict (key) do update set data=excluded.data, og_image_media_id=excluded.og_image_media_id, updated_at=now()
    where ${guard} returning id, data, og_image_media_id, updated_at
  ), ${sync} select id, data, og_image_media_id, updated_at from saved`);
  if (!result.rows.length) return { ok: false, error: "conflict" };
  const saved = result.rows[0] as { data: unknown; og_image_media_id: string | null; updated_at: string };
  return { ok: true, revision: homeRevision({ ...saved, updated_at: new Date(saved.updated_at) }) };
}
