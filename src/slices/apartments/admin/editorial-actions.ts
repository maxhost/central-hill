"use server";
import { createElement, Fragment, type ReactNode } from "react";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireStaff } from "@core/auth";
import {
  getBuildingDraftPreview,
  BuildingDetailRenderer,
} from "@slices/buildings/contract";
import type { PropertyEditorialResult } from "@slices/backoffice/contract";
import type {
  ApartmentEditorialContent,
  SaveApartmentDraftInput,
  PublishApartmentDraftInput,
} from "../editorial-types";
import {
  archiveApartmentIdentity,
  publishApartmentDraft,
  saveApartmentDraft,
  validateApartmentReferences,
} from "../server/editorial-store";
import { readApartmentIdentity } from "../server/editorial-bootstrap";
import {
  listApartmentPreviewSiblings,
  resolveApartmentDocument,
} from "../server/queries";
import { checkApartmentEnvelope } from "../server/editorial-validation";
import { revalidateApartment } from "../server/publish";
import { recomputeBuildingStats } from "../server/stats";
function refreshAdmin(id: string, parentId: string) {
  revalidatePath("/admin/buildings");
  revalidatePath(`/admin/buildings/${parentId}`, "layout");
  revalidatePath(`/admin/buildings/${parentId}/apartments/${id}`);
}
export async function saveApartmentLocaleDraft(
  input: SaveApartmentDraftInput,
): Promise<PropertyEditorialResult<ApartmentEditorialContent>> {
  const staff = await requireStaff();
  const result = await saveApartmentDraft(input, staff.userId);
  if (result.ok) {
    try {
      // Shared saves are intentionally live, independently of localized text drafts.
      if (input.sharedChanged !== false) {
        await recomputeBuildingStats(input.parentId);
        revalidateApartment(input.id, input.parentId);
      }
      refreshAdmin(input.id, input.parentId);
    } catch {
      return { ...result, refreshWarning: true };
    }
  }
  return result;
}
export async function publishApartmentLocaleDraft(
  input: PublishApartmentDraftInput,
): Promise<PropertyEditorialResult<ApartmentEditorialContent>> {
  const staff = await requireStaff();
  const result = await publishApartmentDraft(input, staff.userId);
  if (!result.ok) return result;
  try {
    await recomputeBuildingStats(input.parentId);
    revalidateApartment(input.id, input.parentId);
    refreshAdmin(input.id, input.parentId);
    return result;
  } catch {
    return { ...result, refreshWarning: true };
  }
}
export async function archiveApartment(
  id: string,
  parentId: string,
): Promise<{ ok: boolean; refreshWarning?: boolean }> {
  await requireStaff();
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(parentId).success)
    return { ok: false };
  try {
    if (!(await archiveApartmentIdentity(id, parentId))) return { ok: false };
    try {
      await recomputeBuildingStats(parentId);
      revalidateApartment(id, parentId);
      refreshAdmin(id, parentId);
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
    parentId: z.uuid(),
    locale: z.enum(["en", "es", "pt", "fr"]),
    slug: z.string().max(200).optional(),
    envelope: z.unknown(),
    localMedia: z.record(
      z.uuid(),
      z
        .object({
          id: z.uuid(),
          url: z.string().max(512),
          mime: z.string().max(100),
          width: z.number().positive().nullable(),
          height: z.number().positive().nullable(),
          name: z.string().max(120).optional(),
        })
        .strict(),
    ),
  })
  .strict();
export async function renderApartmentLivePreview(
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
  if (!parsed.success || Object.keys(parsed.data.localMedia).length > 202)
    return { ok: false, error: "validation" };
  const input = parsed.data,
    checked = checkApartmentEnvelope(input.envelope);
  if (!checked.envelope || Object.keys(checked.errors).length)
    return { ok: false, error: "validation" };
  try {
    const requestHeaders = await headers();
    const origin =
      requestHeaders.get("origin") ??
      new URL(
        requestHeaders.get("referer") ?? `http://${requestHeaders.get("host")}`,
      ).origin;
    for (const [id, asset] of Object.entries(input.localMedia)) {
      const url = new URL(asset.url);
      if (
        id !== asset.id ||
        !asset.mime.startsWith("image/") ||
        url.protocol !== "blob:" ||
        url.origin !== origin
      )
        return { ok: false, error: "validation" };
    }
    const identity = await readApartmentIdentity(input.id);
    if (identity && identity.building_id !== input.parentId)
      return { ok: false, error: "validation" };
    const errors = await validateApartmentReferences(
      checked.envelope,
      new Set(Object.keys(input.localMedia)),
    );
    if (Object.keys(errors).length) return { ok: false, error: "validation" };
    const t = await getTranslations({
      locale: input.locale,
      namespace: "propertyEditor",
    });
    const parent = await getBuildingDraftPreview(input.parentId, input.locale);
    if (!parent)
      return {
        ok: true,
        content: createElement(
          "p",
          { role: "status", className: "p-7 text-sm text-ink-soft" },
          t("previewEmpty"),
        ),
      };
    const [siblings, unit] = await Promise.all([
      listApartmentPreviewSiblings(input.locale, input.parentId),
      resolveApartmentDocument(
        input.id,
        input.parentId,
        checked.envelope,
        input.locale,
        input.slug ?? identity?.slug ?? "apartment",
        input.localMedia,
      ),
    ]);
    const apartments = siblings.some((value) => value.id === input.id)
      ? siblings.map((value) => (value.id === input.id ? unit : value))
      : [...siblings, unit];
    const content = await BuildingDetailRenderer({
      locale: input.locale,
      detail: parent,
      apartments,
      preview: true,
      editorBindings: true,
      previewApartmentId: input.id,
    });
    return {
      ok: true,
      content: createElement(
        Fragment,
        null,
        Object.keys(checkApartmentEnvelope(checked.envelope, true).errors)
          .length
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
      "Apartment preview failed",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: "server" };
  }
}
