"use server";
import { createElement, Fragment, type ReactNode } from "react";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { loadMedia, mediaUrl } from "@core/media";
import type {
  SavePropertyDraftInput,
  PublishPropertyDraftInput,
  PropertyEditorialResult,
} from "@slices/backoffice/contract";
import type { BuildingEditorialContent } from "../editorial-types";
import {
  saveBuildingDraft,
  publishBuildingDraft,
  validateBuildingReferences,
} from "../server/editorial-store";
import {
  propertyGraphLockQuery,
  buildingSlugMap,
} from "../server/editorial-bootstrap";
import { checkBuildingEnvelope } from "../server/editorial-validation";
import { resolveBuildingDocument } from "../server/queries";
import { revalidateBuilding } from "../server/publish";
import { BuildingDetailRenderer } from "../ui/building-detail";
export async function saveBuildingLocaleDraft(
  input: SavePropertyDraftInput<BuildingEditorialContent>,
): Promise<PropertyEditorialResult<BuildingEditorialContent>> {
  const staff = await requireStaff();
  const result = await saveBuildingDraft(input, staff.userId);
  if (!result.ok) return result;
  try {
    if (input.sharedChanged ?? input.locale === "en")
      revalidateBuilding(result.id, result.slugByLocale);
    revalidatePath("/admin/buildings");
    revalidatePath(`/admin/buildings/${result.id}`);
    return result;
  } catch {
    return { ...result, refreshWarning: true };
  }
}
export async function publishBuildingLocaleDraft(
  input: PublishPropertyDraftInput,
): Promise<PropertyEditorialResult<BuildingEditorialContent>> {
  const staff = await requireStaff();
  const result = await publishBuildingDraft(input, staff.userId);
  if (!result.ok) return result;
  try {
    revalidateBuilding(result.id, result.slugByLocale);
    revalidatePath("/admin/buildings");
    revalidatePath(`/admin/buildings/${result.id}`);
    return result;
  } catch {
    return { ...result, refreshWarning: true };
  }
}
export async function archiveBuilding(
  id: string,
): Promise<{ ok: boolean; refreshWarning?: boolean }> {
  await requireStaff();
  if (!z.uuid().safeParse(id).success) return { ok: false };
  try {
    const slugs = await buildingSlugMap(id);
    const [, result] = await db.batch([
      propertyGraphLockQuery(),
      db.execute(
        sql`update building set status='archived',updated_at=now()where id=${id}::uuid returning id`,
      ),
    ]);
    if (!result.rows.length) return { ok: false };
    try {
      revalidateBuilding(id, slugs);
      revalidatePath("/admin/buildings");
      revalidatePath(`/admin/buildings/${id}`);
      return { ok: true };
    } catch {
      return { ok: true, refreshWarning: true };
    }
  } catch {
    return { ok: false };
  }
}
const previewRequest = z
  .object({
    id: z.uuid(),
    locale: z.enum(["en", "es", "pt", "fr"]),
    slug: z.string().max(120).optional(),
    envelope: z.unknown(),
    localMedia: z.record(
      z.uuid(),
      z.object({
        id: z.uuid(),
        url: z.string().max(512),
        mime: z.string().max(100),
        width: z.number().positive().nullable(),
        height: z.number().positive().nullable(),
        name: z.string().max(120).optional(),
      }),
    ),
  })
  .strict();
export async function renderBuildingLivePreview(
  raw: unknown,
): Promise<
  | { ok: true; content: ReactNode }
  | { ok: false; error: "validation" | "server" }
> {
  await requireStaff();
  try {
    if (new TextEncoder().encode(JSON.stringify(raw)).byteLength > 256 * 1024)
      return { ok: false, error: "validation" };
  } catch {
    return { ok: false, error: "validation" };
  }
  const parsed = previewRequest.safeParse(raw);
  if (!parsed.success || Object.keys(parsed.data.localMedia).length > 102)
    return { ok: false, error: "validation" };
  const { id, locale, slug, localMedia } = parsed.data;
  const checked = checkBuildingEnvelope(parsed.data.envelope);
  if (!checked.envelope || Object.keys(checked.errors).length)
    return { ok: false, error: "validation" };
  try {
    const h = await headers();
    const origin =
      h.get("origin") ??
      new URL(h.get("referer") ?? `http://${h.get("host")}`).origin;
    for (const [id, a] of Object.entries(localMedia)) {
      const url = new URL(a.url);
      if (
        id !== a.id ||
        !a.mime.startsWith("image/") ||
        url.protocol !== "blob:" ||
        url.origin !== origin
      )
        return { ok: false, error: "validation" };
    }
    const envelope = checked.envelope;
    const errors = await validateBuildingReferences(
      envelope,
      true,
      new Set(Object.keys(localMedia)),
    );
    if (Object.keys(errors).length) return { ok: false, error: "validation" };
    const detail = await resolveBuildingDocument(
      id,
      envelope,
      locale,
      slug ?? "",
    );
    const persisted = await loadMedia(Object.keys(localMedia));
    const image = (id: string) => {
      const stored = persisted.get(id);
      const local = localMedia[id];
      return stored
        ? {
            url: mediaUrl(stored.r2_key),
            width: stored.width ?? 1600,
            height: stored.height ?? 1200,
            alt: detail.name,
            blurhash: stored.blurhash,
          }
        : local
          ? {
              url: local.url,
              width: local.width ?? 1600,
              height: local.height ?? 1200,
              alt: detail.name,
              blurhash: null,
            }
          : null;
    };
    const c = envelope.content;
    if (c.cover_media_id && localMedia[c.cover_media_id])
      detail.cover = image(c.cover_media_id);
    if (c.og_image_media_id && localMedia[c.og_image_media_id])
      detail.ogImage = image(c.og_image_media_id);
    if (c.gallery.some((id) => localMedia[id])) {
      const assets = await loadMedia(c.gallery);
      detail.gallery = c.gallery.flatMap((id) => {
        const asset = assets.get(id);
        const img = asset
          ? {
              url: mediaUrl(asset.r2_key),
              width: asset.width ?? 1600,
              height: asset.height ?? 1200,
              alt: detail.name,
              blurhash: asset.blurhash,
            }
          : image(id);
        return img ? [img] : [];
      });
    }
    const content = await BuildingDetailRenderer({
      locale,
      detail,
      preview: true,
      editorBindings: true,
    });
    const t = await getTranslations({ locale, namespace: "propertyEditor" });
    return {
      ok: true,
      content: createElement(
        Fragment,
        null,
        Object.keys(checkBuildingEnvelope(envelope, true).errors).length
          ? createElement(
              "p",
              {
                role: "status",
                className:
                  "border-b border-line bg-surface px-7 py-3 text-sm text-ink-soft",
              },
              t("previewIncomplete"),
            )
          : null,
        content,
      ),
    };
  } catch (error) {
    console.error(
      "Building preview failed",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: "server" };
  }
}
