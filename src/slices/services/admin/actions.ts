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
import { SERVICE, SERVICE_CATEGORY } from "../contract";
import { service, service_category, service_media } from "../schema";
import { revalidateServices } from "../server/publish";
import {
  type ServiceSaveInput,
  serviceCategorySaveInput,
  serviceSaveInput,
} from "./validation";

/**
 * Backoffice write actions for slice `services` (S12). `requireStaff`-gated +
 * re-validated. Service source [T] content + slugs go through the `core/i18n` write
 * seam (ADR 0019); the gallery is written here. Categories carry a **plain-column**
 * slug (no slug table) and only their [T] `name` goes through the seam. On success
 * the `service-list` tag is busted via `revalidateServices`.
 */

export type ServiceSaveResult =
  | { ok: true; id: string }
  | { ok: false; error: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; error: "slug_conflict" }
  | { ok: false; error: "not_found" }
  | { ok: false; error: "server" };

export type CategoryDeleteResult = { ok: true } | { ok: false; error: "in_use" | "server" };

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
export async function saveServiceCategory(raw: unknown): Promise<ServiceSaveResult> {
  const staff = await requireStaff();

  const parsed = serviceCategorySaveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const input = parsed.data;

  const coreValues = { slug: input.slug, icon: input.icon, position: input.position };

  try {
    let id = input.id ?? "";
    if (input.id) {
      const [exists] = await db
        .select({ id: service_category.id })
        .from(service_category)
        .where(eq(service_category.id, input.id))
        .limit(1);
      if (!exists) return { ok: false, error: "not_found" };
      await db
        .update(service_category)
        .set({ ...coreValues, updated_at: new Date() })
        .where(eq(service_category.id, input.id));
    } else {
      const [ins] = await db
        .insert(service_category)
        .values(coreValues)
        .returning({ id: service_category.id });
      if (!ins) return { ok: false, error: "server" };
      id = ins.id;
    }

    await setSourceContent(SERVICE_CATEGORY, id, { name: input.name }, { updatedBy: staff.userId });

    revalidateServices();
    revalidatePath("/admin/service-categories");
    revalidatePath(`/admin/service-categories/${id}`);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function deleteServiceCategory(id: string): Promise<CategoryDeleteResult> {
  await requireStaff();
  try {
    // category_id is a RESTRICT FK on `service` — refuse the delete while in use
    // (a clearer message than letting the FK violation surface as a server error).
    const [inUse] = await db
      .select({ id: service.id })
      .from(service)
      .where(eq(service.category_id, id))
      .limit(1);
    if (inUse) return { ok: false, error: "in_use" };

    await db.delete(service_category).where(eq(service_category.id, id));
    await deleteContent(SERVICE_CATEGORY, id);

    revalidateServices();
    revalidatePath("/admin/service-categories");
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

// ── Services ─────────────────────────────────────────────────────────────────
export async function saveService(raw: unknown): Promise<ServiceSaveResult> {
  const staff = await requireStaff();

  const parsed = serviceSaveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const input = parsed.data;

  const coreValues = {
    slug: input.slug,
    status: input.status,
    position: input.position,
    category_id: input.category_id,
    cover_media_id: input.cover_media_id,
    og_image_media_id: input.og_image_media_id,
    price_from: input.price_from,
    booking_type: input.booking_type,
    cta_url: input.cta_url,
  };

  try {
    const isCreate = !input.id;
    let id = input.id ?? "";

    if (input.id) {
      const [exists] = await db
        .select({ id: service.id })
        .from(service)
        .where(eq(service.id, input.id))
        .limit(1);
      if (!exists) return { ok: false, error: "not_found" };
      await db
        .update(service)
        .set({ ...coreValues, updated_at: new Date() })
        .where(eq(service.id, input.id));
    } else {
      const [ins] = await db.insert(service).values(coreValues).returning({ id: service.id });
      if (!ins) return { ok: false, error: "server" };
      id = ins.id;
    }

    try {
      await setSlugs(SERVICE, id, sameSlugAllLocales(input.slug));
    } catch (err) {
      if (err instanceof SlugConflictError) {
        if (isCreate) {
          await db.delete(service).where(eq(service.id, id));
          await deleteSlugs(SERVICE, id);
        }
        return { ok: false, error: "slug_conflict" };
      }
      throw err;
    }

    await setSourceContent(
      SERVICE,
      id,
      {
        name: input.name,
        excerpt: input.excerpt,
        body: input.body,
        duration_label: input.duration_label,
        cta_label: input.cta_label,
        meta_title: input.meta_title,
        meta_description: input.meta_description,
      },
      { updatedBy: staff.userId },
    );

    await persistGallery(id, input.gallery);

    revalidateServices();
    revalidatePath("/admin/services");
    revalidatePath(`/admin/services/${id}`);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function deleteService(id: string): Promise<{ ok: boolean }> {
  await requireStaff();
  try {
    await db.delete(service).where(eq(service.id, id)); // cascades service_media
    await deleteContent(SERVICE, id);
    await deleteSlugs(SERVICE, id);
    revalidateServices();
    revalidatePath("/admin/services");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Replace the gallery rows with the submitted, ordered media ids. */
async function persistGallery(id: string, gallery: ServiceSaveInput["gallery"]): Promise<void> {
  await db.delete(service_media).where(eq(service_media.service_id, id));
  if (gallery.length > 0) {
    await db
      .insert(service_media)
      .values(gallery.map((mediaId, i) => ({ service_id: id, media_id: mediaId, position: i })));
  }
}
