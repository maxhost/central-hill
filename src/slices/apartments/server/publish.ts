import "server-only";
import { updateTag } from "@core/revalidate";
// The parent building's denormalized stats (apartments_count / capacity / beds) and
// its detail page embed this unit, so a publish must bust the building's caches too.
// We use the cache-tag constants the buildings slice exports on its CONTRACT (golden
// rule 2 — never reach into another slice's internals).
import { BUILDING_TAGS } from "@slices/buildings/contract";
import { APARTMENT_TAGS } from "../contract";

/**
 * Single place that busts apartment ISR caches on publish (conventions.md → "don't
 * scatter revalidateTag calls"). The apartment admin actions (S12) call this after a
 * successful persist + translation enqueue + a building-stat recompute.
 *
 * Busts the unit + the per-building listing, plus the parent building's detail and
 * listing tags (its denormalized stats change with the apartment set).
 *
 * NOTE (escalation, docs/multi-agent-workflow.md): the actual stat-column **recompute**
 * (`UPDATE building SET apartments_count = …`) writes a buildings-owned table, so it
 * cannot live here (golden rules 1 & 4). It belongs to a buildings-contract write
 * function invoked by the S12 admin publish action; until that contract change lands,
 * this helper only invalidates the caches.
 */
export function revalidateApartment(apartmentId: string, buildingId: string): void {
  updateTag(APARTMENT_TAGS.apartment(apartmentId));
  updateTag(APARTMENT_TAGS.list);
  updateTag(BUILDING_TAGS.building(buildingId));
  updateTag(BUILDING_TAGS.list);
}
