"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import {
  SlugConflictError,
  deleteContent,
  deleteSlugs,
  setSlugs,
  setSourceContent,
} from "@core/i18n/content-write";
import { APARTMENT } from "../contract";
import { apartment } from "../schema";
import { revalidateApartment } from "../server/publish";
import { recomputeBuildingStats } from "../server/stats";
import {
  type MoveDirection,
  isBuildingChange,
  nextApartmentPosition,
  planApartmentMove,
} from "./derive";
import { apartmentSaveInput } from "./validation";

/**
 * Backoffice write actions for slice `apartments` (S12). `requireStaff`-gated +
 * re-validated. Source [T] content (name, badge) + slugs via the `core/i18n` write
 * seam (ADR 0019). After any change to the published set the parent building's
 * denormalized stats are recomputed and the ISR caches busted via `revalidateApartment`.
 *
 * Nested under the building (spec building-detail-admin-editor S2): the building is
 * fixed at creation (D6 — an update posting another `building_id` is rejected), a new
 * unit goes last in its building, and the order changes only through
 * `moveApartment` (↑ / ↓ in the building's Apartments tab). Admin revalidation targets
 * the building workspace (`/admin/buildings/[id]/…`), not `/admin/apartments`.
 *
 * The per-locale slug is **auto-generated** from the name (the editor no longer asks
 * for one — a unit has no standalone public URL, so the slug is an internal identity
 * key only). On create we suffix it with the new id's short hash if the base form is
 * already taken, which makes a collision effectively impossible; on edit the existing
 * slug is left untouched so it stays stable.
 */

export type ApartmentSaveResult =
  | { ok: true; id: string }
  | { ok: false; error: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; error: "slug_conflict" }
  | { ok: false; error: "not_found" }
  | { ok: false; error: "server" };

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

/** Kebab-case, url-safe slug derived from a name (matches the `slug` primitive). */
function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics (á → a)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");
  return base || "apartment";
}

/**
 * Busts the admin views that show a building's apartments: the buildings list (its
 * "Apartments" column) and the whole building workspace — the layout's tab count plus
 * every nested page (`apartments`, `apartments/new`, `apartments/[aptId]`).
 */
function revalidateBuildingWorkspace(buildingId: string): void {
  revalidatePath("/admin/buildings");
  revalidatePath(`/admin/buildings/${buildingId}`, "layout");
}

/** Positions of one building's apartments (feeds `nextApartmentPosition`). */
async function buildingPositions(buildingId: string): Promise<number[]> {
  const rows = await db
    .select({ position: apartment.position })
    .from(apartment)
    .where(eq(apartment.building_id, buildingId));
  return rows.map((r) => r.position);
}

export async function saveApartment(raw: unknown): Promise<ApartmentSaveResult> {
  const staff = await requireStaff();

  const parsed = apartmentSaveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const input = parsed.data;

  // Card-only columns. Dropped fields (bathrooms / floor / og_image) keep their DB
  // defaults (0) or stay null — they are no longer authored in the editor.
  // `position` is deliberately absent: set once on create (end of the building), then
  // owned by `moveApartment`; a posted value is ignored.
  const coreValues = {
    status: input.status,
    building_id: input.building_id,
    bedrooms: input.bedrooms,
    max_guests: input.max_guests,
    beds_count: input.beds_count,
    size_m2: input.size_m2,
    cover_media_id: input.cover_media_id,
    avantio_id: input.avantio_id,
    avantio_url: input.avantio_url,
  };

  try {
    let id = input.id ?? "";

    if (input.id) {
      const [existing] = await db
        .select({ id: apartment.id, building_id: apartment.building_id })
        .from(apartment)
        .where(eq(apartment.id, input.id))
        .limit(1);
      if (!existing) return { ok: false, error: "not_found" };
      if (isBuildingChange(existing.building_id, input.building_id)) {
        // D6: an apartment never moves to another building.
        return {
          ok: false,
          error: "validation",
          fieldErrors: { building_id: "Apartments cannot move to another building." },
        };
      }
      // Slug is immutable post-create (internal identity only) — leave it as-is.
      await db
        .update(apartment)
        .set({ ...coreValues, updated_at: new Date() })
        .where(eq(apartment.id, input.id));
    } else {
      const base = slugify(input.name);
      const position = nextApartmentPosition(await buildingPositions(input.building_id));
      const [ins] = await db
        .insert(apartment)
        .values({ ...coreValues, position, slug: base })
        .returning({ id: apartment.id });
      if (!ins) return { ok: false, error: "server" };
      id = ins.id;

      // Register the slug for all locales; on collision, suffix with the id's short
      // hash (now known) so the retry is guaranteed unique.
      try {
        await setSlugs(APARTMENT, id, sameSlugAllLocales(base));
      } catch (err) {
        if (err instanceof SlugConflictError) {
          const unique = `${base}-${id.slice(0, 8)}`;
          await db.update(apartment).set({ slug: unique }).where(eq(apartment.id, id));
          await setSlugs(APARTMENT, id, sameSlugAllLocales(unique));
        } else {
          throw err;
        }
      }
    }

    await setSourceContent(
      APARTMENT,
      id,
      {
        name: input.name,
        badge: input.badge,
      },
      { updatedBy: staff.userId },
    );

    // The building is fixed (D6), so only its stats can change.
    await recomputeBuildingStats(input.building_id);

    revalidateApartment(id, input.building_id);
    revalidateBuildingWorkspace(input.building_id);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function deleteApartment(id: string): Promise<{ ok: boolean }> {
  await requireStaff();
  try {
    const [row] = await db
      .select({ building_id: apartment.building_id })
      .from(apartment)
      .where(eq(apartment.id, id))
      .limit(1);

    await db.delete(apartment).where(eq(apartment.id, id)); // cascades apartment_media
    await deleteContent(APARTMENT, id);
    await deleteSlugs(APARTMENT, id);

    if (row) {
      await recomputeBuildingStats(row.building_id);
      revalidateApartment(id, row.building_id);
      revalidateBuildingWorkspace(row.building_id);
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * Moves an apartment one slot up or down within ITS building (↑ / ↓ in the
 * workspace's Apartments tab). Swaps with the neighbour in display order (position,
 * then id) and renumbers the building to `0..n-1`; a no-op at either end. The
 * changed rows are written in one Neon batch (a single transaction).
 */
export async function moveApartment(
  id: string,
  direction: MoveDirection,
): Promise<{ ok: boolean }> {
  await requireStaff();
  if (direction !== "up" && direction !== "down") return { ok: false };
  try {
    const [row] = await db
      .select({ building_id: apartment.building_id })
      .from(apartment)
      .where(eq(apartment.id, id))
      .limit(1);
    if (!row) return { ok: false };

    const slots = await db
      .select({ id: apartment.id, position: apartment.position })
      .from(apartment)
      .where(eq(apartment.building_id, row.building_id))
      .orderBy(asc(apartment.position), asc(apartment.id));
    const updates = planApartmentMove(slots, id, direction);
    if (!updates || updates.length === 0) return { ok: true };

    const now = new Date();
    const [first, ...rest] = updates.map((u) =>
      db
        .update(apartment)
        .set({ position: u.position, updated_at: now })
        .where(eq(apartment.id, u.id)),
    );
    if (first) await db.batch([first, ...rest]);

    revalidateApartment(id, row.building_id);
    revalidateBuildingWorkspace(row.building_id);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
