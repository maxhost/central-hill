/**
 * Admin **save** schema for slice `geography` (S12). A city is edited together with
 * its neighbourhoods (one editor screen). City + neighbourhood both carry a public
 * slug (slug table). Optional fields are `nullable` (the client posts `null` for an
 * empty control); required [T] text gets a `min(1)`.
 */
import { z } from "zod";
import { contentStatus, position, slug, tStr } from "@core/validation/primitives";

/** A neighbourhood row as the editor posts it; `id` present ⇒ update, absent ⇒ insert. */
export const neighbourhoodForm = z.object({
  id: z.uuid().optional(),
  slug,
  name: tStr({ min: 1, max: 120 }),
});

export const citySaveInput = z.object({
  id: z.uuid().optional(),
  slug,
  position,
  status: contentStatus,
  country: z.string().length(2),
  hero_media_id: z.uuid().nullable(),
  // [T] source values (en):
  name: tStr({ min: 1, max: 120 }),
  intro: tStr({ max: 800 }).nullable(),
  // Relation:
  neighbourhoods: z.array(neighbourhoodForm),
});

export type CitySaveInput = z.infer<typeof citySaveInput>;
