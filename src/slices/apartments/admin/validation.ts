/**
 * Admin **save** schema for slice `apartments` (S12) — simplified to the fields a
 * building's apartment CARD needs (client direction: apartments surface only inside
 * their building's "Apartments in this Building" grid; there is no standalone unit
 * page). Authored here: building, name [T], badge [T], bedrooms / max_guests /
 * beds_count, an optional cover (a Warm-Editorial placeholder renders when absent),
 * and the Avantio booking handles (optional — the card's "Check availability" falls
 * back to the building's booking band when a unit has none).
 *
 * Dropped from the editor but KEPT in the DB (nullable, no longer authored): the
 * per-locale slug (auto-generated from the name in the action — it never appears in
 * a public URL), bathrooms, size_m2, floor, the gallery, the long description, the OG
 * image and the SEO meta. Removing the columns would be a destructive migration (ADR);
 * leaving them nullable is additive and reversible.
 */
import { z } from "zod";
import { contentStatus, position, tStr } from "@core/validation/primitives";

const count = z.number().int().nonnegative();

export const apartmentSaveInput = z.object({
  id: z.uuid().optional(),
  status: contentStatus,
  position,
  building_id: z.uuid(),
  badge: tStr({ max: 60 }).nullable(),
  bedrooms: count,
  max_guests: z.number().int().positive(),
  beds_count: count,
  cover_media_id: z.uuid().nullable(),
  avantio_id: z.string().min(1).max(120).nullable(),
  avantio_url: z.url().nullable(),
  // [T] source value (en):
  name: tStr({ min: 1, max: 160 }),
});

export type ApartmentSaveInput = z.infer<typeof apartmentSaveInput>;
