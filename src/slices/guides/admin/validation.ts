import { z } from "zod";
import { contentStatus, latitude, longitude, position, slug } from "@core/validation/primitives";
import { guideTemplate, priceTier } from "../validation";
import { guideSectionPresentation, GUIDE_MODULE_KEYS, parseGuidePresentation, isGuideSectionVisible, isGuideModuleVisible } from "../presentation";
import type { GuidePageEdit, GuideCityOption, GuideSectionEdit, GuidePlaceEdit } from "./model";
const text = (max: number) => z.string().trim().max(max).nullable().transform(v => v || null);
const title = (max: number) => z.string().trim().min(1, "Enter a title.").max(max);
const image = z.uuid().nullable();
const url = z.string().trim().max(2000).nullable().transform(v => v || null).refine(v => !v || /^https?:\/\//i.test(v) && URL.canParse(v), "Enter an absolute HTTP or HTTPS URL.");
export const pageColumns = z.strictObject({ city_id: z.uuid(), template: guideTemplate, status: contentStatus, position, hero_media_id: image, og_image_media_id: image });
export const pageSource = z.strictObject({ title: title(200), intro: text(1200), meta_title: text(70), meta_description: text(200) });
export const sectionColumns = z.strictObject({ position, header_media_id: image, cta_url: url, presentation: guideSectionPresentation.nullable() });
export const sectionSource = z.strictObject({ title: title(200), body: text(4000), local_tip: text(600), cta_label: text(80) });
export const placeColumns = z.strictObject({ position, category: text(80), address: text(240), phone: text(40), price_tier: priceTier.nullable(), opening_hours: text(400), latitude: latitude.nullable(), longitude: longitude.nullable(), website_url: url, booking_url: url, media_id: image });
export const placeSource = z.strictObject({ name: title(160), description: text(1200) });
const patchBase = { id: z.uuid(), create: z.boolean().optional() };
const slugs = z.strictObject({ en: slug.optional(), pt: slug.optional(), es: slug.optional(), fr: slug.optional() });
/** Reject explicit undefined rather than accidentally clearing translations. */
function noUndefined(value: unknown, ctx: z.RefinementCtx, path: PropertyKey[] = []): void {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (child === undefined) ctx.addIssue({ code: "custom", path: [...path, key], message: "Omit unchanged fields; use null to clear an optional field." });
    else noUndefined(child, ctx, [...path, key]);
  }
}
export const guidePageMutation = z.strictObject({ ...patchBase, changes: pageColumns.partial(), source: pageSource.partial(), slugs: slugs.optional() }).superRefine((value, ctx) => noUndefined(value, ctx));
export const guideSectionMutation = z.strictObject({ ...patchBase, changes: sectionColumns.partial(), source: sectionSource.partial() }).superRefine((value, ctx) => noUndefined(value, ctx));
export const guidePlaceMutation = z.strictObject({ ...patchBase, changes: placeColumns.partial(), source: placeSource.partial() }).superRefine((value, ctx) => noUndefined(value, ctx));
export function guideFieldErrors(issues: readonly { path: PropertyKey[]; message: string }[]): Record<string, string> {
  return Object.fromEntries(issues.map(i => [i.path.map(String).join("."), i.message]));
}
export function guideSectionErrors(section: GuideSectionEdit): Record<string, string> {
  const errors: Record<string, string> = {};
  const cols = sectionColumns.safeParse({ position: section.position, header_media_id: section.header_media_id, cta_url: section.cta_url, presentation: section.presentation });
  if (!cols.success) Object.assign(errors, guideFieldErrors(cols.error.issues));
  const source = sectionSource.safeParse({ title: section.title, body: section.body, local_tip: section.local_tip, cta_label: section.cta_label });
  if (!source.success) Object.assign(errors, guideFieldErrors(source.error.issues));
  if (Boolean(section.cta_label) !== Boolean(section.cta_url)) errors.cta_url = "Provide both a button label and an HTTP(S) URL, or clear both.";
  return errors;
}
export function guidePlaceErrors(place: GuidePlaceEdit): Record<string, string> {
  const { name, description } = place;
  const columns = Object.fromEntries(Object.keys(placeColumns.shape).map(key => [key, place[key as keyof GuidePlaceEdit]]));
  const errors: Record<string, string> = {};
  const cols = placeColumns.safeParse(columns), source = placeSource.safeParse({ name, description });
  if (!cols.success) Object.assign(errors, guideFieldErrors(cols.error.issues));
  if (!source.success) Object.assign(errors, guideFieldErrors(source.error.issues));
  if ((place.latitude === null) !== (place.longitude === null)) errors.latitude = "Provide both coordinates, or clear both.";
  if (place.phone && !place.phone.replace(/[^\d+]/g, "")) errors.phone = "Enter a valid telephone number.";
  return errors;
}
/** Validate the EFFECTIVE tree for every mutation, including deletes, of a live guide. */
export function guideTreeErrors(page: GuidePageEdit, cities: GuideCityOption[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const city = cities.find(c => c.id === page.city_id);
  if (!city) errors.city_id = "Select an existing city.";
  if (page.status !== "published") return errors;
  if (city?.status !== "published") errors.city_id = "Publish the city before publishing its guides.";
  if (!page.title.trim()) errors.title = "Enter a title.";
  if (!page.slugs.en) errors.slug = "Enter an English slug.";
  if (!page.sections.some(s => isGuideSectionVisible(s.presentation))) errors.sections = "Keep at least one complete visible section.";
  for (const section of page.sections) {
    if (!isGuideSectionVisible(section.presentation)) continue;
    const prefix = `sections.${section.id}.`;
    for (const [k, v] of Object.entries(guideSectionErrors(section))) errors[prefix + k] = v;
    const data: Record<(typeof GUIDE_MODULE_KEYS)[number], boolean> = {
      body: Boolean(section.body?.trim()), image: Boolean(section.header_media_id),
      local_tip: Boolean(section.local_tip?.trim()), places: section.places.length > 0,
      cta: Boolean(section.cta_label?.trim() && section.cta_url),
    };
    const presentation = parseGuidePresentation(section.presentation);
    if (!GUIDE_MODULE_KEYS.some(k => isGuideModuleVisible(section.presentation, k) && data[k])) errors[prefix + "presentation"] = "Keep at least one module with content, or hide this section.";
    for (const key of GUIDE_MODULE_KEYS) if (presentation?.modules?.[key] === true && !data[key]) errors[prefix + key] = "Complete this module or switch it off.";
    if (isGuideModuleVisible(section.presentation, "places")) for (const place of section.places) for (const [k, v] of Object.entries(guidePlaceErrors(place))) errors[`${prefix}places.${place.id}.${k}`] = v;
  }
  return errors;
}
export function isExactGuideOrder(existing: readonly string[], ordered: readonly string[]): boolean {
  return existing.length === ordered.length && new Set(ordered).size === ordered.length && ordered.every(id => existing.includes(id));
}
