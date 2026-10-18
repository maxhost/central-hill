"use server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { loadMedia } from "@core/media";
import { resolveSlug } from "@core/i18n/content";
import { setSourceContent, setSlugs, deleteContent } from "@core/i18n/content-write";
import { listGuideCityOptions } from "@slices/geography/contract";
import { GUIDE_PAGE, GUIDE_SECTION, GUIDE_PLACE } from "../contract";
import { guide_page, guide_section, guide_place } from "../schema";
import { revalidateGuides } from "../server/publish";
import { getGuideForEdit } from "./queries";
import { guidePageMutation, guideSectionMutation, guidePlaceMutation, pageColumns, pageSource, placeColumns, guideSectionErrors, guidePlaceErrors, guideTreeErrors, guideFieldErrors, isExactGuideOrder } from "./validation";
import { guideMediaReferences, guideMediaErrors } from "./media-validation";
import { runGuideWrite, type GuideActionResult, type GuidePageEdit, type GuideSectionEdit, type GuidePlaceEdit, type GuideWriteStep } from "./model";

const fail = (error: "not_found" | "ownership" | "slug_conflict" | "invalid_stored_content" | "server"): GuideActionResult => ({ ok: false, error });
const invalid = (fieldErrors: Record<string, string>): GuideActionResult => ({ ok: false, error: "validation", fieldErrors });
const uuid = (id: string) => z.uuid().safeParse(id).success;
function invalidate(pageId: string) { revalidateGuides(); revalidatePath("/admin/guides"); revalidatePath(`/admin/guides/${pageId}`); }
async function mediaErrors(input: object) {
  const refs = guideMediaReferences(input);
  return guideMediaErrors(input, await loadMedia(refs.map(r => r.id)));
}
async function treeErrors(page: GuidePageEdit) {
  const errors = guideTreeErrors(page, await listGuideCityOptions());
  if (page.status === "published") {
    for (const [key, value] of Object.entries(await mediaErrors(page))) errors[key] = value;
    for (const section of page.sections) {
      for (const [key, value] of Object.entries(await mediaErrors(section))) errors[`sections.${section.id}.${key}`] = value;
      for (const place of section.places) for (const [key, value] of Object.entries(await mediaErrors(place))) errors[`sections.${section.id}.places.${place.id}.${key}`] = value;
    }
  }
  return errors;
}
export async function saveGuidePage(raw: unknown): Promise<GuideActionResult> {
  const staff = await requireStaff(["admin", "editor"]);
  const parsed = guidePageMutation.safeParse(raw);
  if (!parsed.success) return invalid(guideFieldErrors(parsed.error.issues));
  const input = parsed.data;
  try {
    const bundle = await getGuideForEdit(input.id);
    if (!bundle && !input.create) return fail("not_found");
    if (bundle?.integrity === "invalid") return fail("invalid_stored_content");
    const base: GuidePageEdit = bundle?.data ?? {
      id: input.id, city_id: "", template: "landing", status: "draft", position: 0,
      hero_media_id: null, og_image_media_id: null, title: "", intro: null, meta_title: null,
      meta_description: null, slug: "", slugs: {}, sections: [],
    };
    const effectiveSlugs = !bundle ? { en: input.slugs?.en, pt: input.slugs?.en, es: input.slugs?.en, fr: input.slugs?.en, ...input.slugs } : { ...base.slugs, ...input.slugs };
    const page: GuidePageEdit = { ...base, ...input.changes, ...input.source, slugs: effectiveSlugs, slug: effectiveSlugs.en ?? base.slug };
    const columns = pageColumns.safeParse({ city_id: page.city_id, template: page.template, status: page.status, position: page.position, hero_media_id: page.hero_media_id, og_image_media_id: page.og_image_media_id });
    const source = pageSource.safeParse({ title: page.title, intro: page.intro, meta_title: page.meta_title, meta_description: page.meta_description });
    if (!columns.success) return invalid(guideFieldErrors(columns.error.issues));
    if (!source.success) return invalid(guideFieldErrors(source.error.issues));
    if (!page.slugs.en) return invalid({ "slugs.en": "Enter an English slug." });
    for (const [locale, value] of Object.entries(page.slugs)) {
      if (!value) continue;
      const owner = await resolveSlug(GUIDE_PAGE, locale as "en" | "pt" | "es" | "fr", value);
      if (owner && owner !== input.id) return fail("slug_conflict");
    }
    const errors = { ...await mediaErrors(page), ...await treeErrors(page) };
    if (Object.keys(errors).length) return invalid(errors);
    const steps: GuideWriteStep[] = [
      { name: "page", run: () => bundle ? db.update(guide_page).set({ ...input.changes, slug: page.slug, updated_at: new Date() }).where(eq(guide_page.id, input.id)) : db.insert(guide_page).values({ id: input.id, ...columns.data, slug: page.slug }) },
      { name: "slugs", run: () => setSlugs(GUIDE_PAGE, input.id, page.slugs) },
      { name: "source", run: () => setSourceContent(GUIDE_PAGE, input.id, input.source, { updatedBy: staff.userId }) },
    ];
    return runGuideWrite(input.id, steps, () => invalidate(input.id));
  } catch (error) { console.error("[guides:action]", error); return fail("server"); }
}
export async function saveGuideSection(pageId: string, raw: unknown): Promise<GuideActionResult> {
  const staff = await requireStaff(["admin", "editor"]);
  const parsed = guideSectionMutation.safeParse(raw);
  if (!parsed.success) return invalid(guideFieldErrors(parsed.error.issues));
  if (!uuid(pageId)) return invalid({ pageId: "Invalid guide ID." });
  const input = parsed.data;
  try {
    const bundle = await getGuideForEdit(pageId);
    if (!bundle) return fail("not_found");
    if (bundle.integrity === "invalid") return fail("invalid_stored_content");
    const [owned] = await db.select().from(guide_section).where(eq(guide_section.id, input.id)).limit(1);
    if (owned && owned.guide_page_id !== pageId) return fail("ownership");
    if (!owned && !input.create) return fail("not_found");
    const previous = bundle.data.sections.find(s => s.id === input.id);
    const section: GuideSectionEdit = {
      ...(previous ?? { id: input.id, guide_page_id: pageId, layout: "standard", position: bundle.data.sections.length, header_media_id: null, cta_url: null, presentation: { version: 1, enabled: false }, title: "", body: null, local_tip: null, cta_label: null, places: [] }),
      ...input.changes, ...input.source,
    };
    const page = { ...bundle.data, sections: previous ? bundle.data.sections.map(s => s.id === input.id ? section : s) : [...bundle.data.sections, section] };
    const errors = { ...guideSectionErrors(section), ...await mediaErrors(section), ...await treeErrors(page) };
    if (Object.keys(errors).length) return invalid(errors);
    return runGuideWrite(input.id, [
      { name: "section", run: () => owned ? db.update(guide_section).set({ ...input.changes, updated_at: new Date() }).where(eq(guide_section.id, input.id)) : db.insert(guide_section).values({ id: input.id, guide_page_id: pageId, layout: "standard", position: section.position, header_media_id: section.header_media_id, cta_url: section.cta_url, presentation: section.presentation }) },
      { name: "source", run: () => setSourceContent(GUIDE_SECTION, input.id, input.source, { updatedBy: staff.userId }) },
    ], () => invalidate(pageId));
  } catch (error) { console.error("[guides:action]", error); return fail("server"); }
}
export async function saveGuidePlace(pageId: string, sectionId: string, raw: unknown): Promise<GuideActionResult> {
  const staff = await requireStaff(["admin", "editor"]);
  const parsed = guidePlaceMutation.safeParse(raw);
  if (!parsed.success) return invalid(guideFieldErrors(parsed.error.issues));
  if (!uuid(pageId) || !uuid(sectionId)) return invalid({ sectionId: "Invalid parent ID." });
  const input = parsed.data;
  try {
    const bundle = await getGuideForEdit(pageId);
    if (!bundle) return fail("not_found");
    if (bundle.integrity === "invalid") return fail("invalid_stored_content");
    const parent = bundle.data.sections.find(s => s.id === sectionId);
    if (!parent) return fail("ownership");
    const [owned] = await db.select().from(guide_place).where(eq(guide_place.id, input.id)).limit(1);
    if (owned && owned.guide_section_id !== sectionId) return fail("ownership");
    if (!owned && !input.create) return fail("not_found");
    const previous = parent.places.find(p => p.id === input.id);
    const place: GuidePlaceEdit = {
      ...(previous ?? { id: input.id, guide_section_id: sectionId, position: parent.places.length, name: "", description: null, category: null, address: null, phone: null, price_tier: null, opening_hours: null, latitude: null, longitude: null, website_url: null, booking_url: null, media_id: null }),
      ...input.changes, ...input.source,
    };
    const page = { ...bundle.data, sections: bundle.data.sections.map(s => s.id !== sectionId ? s : { ...s, places: previous ? s.places.map(p => p.id === input.id ? place : p) : [...s.places, place] }) };
    const errors = { ...guidePlaceErrors(place), ...await mediaErrors(place), ...await treeErrors(page) };
    if (Object.keys(errors).length) return invalid(errors);
    const id = place.id;
    const columns = placeColumns.parse(Object.fromEntries(Object.keys(placeColumns.shape).map(key => [key, place[key as keyof GuidePlaceEdit]])));
    return runGuideWrite(input.id, [
      { name: "place", run: () => owned ? db.update(guide_place).set({ ...input.changes, updated_at: new Date() }).where(eq(guide_place.id, input.id)) : db.insert(guide_place).values({ id, guide_section_id: sectionId, ...columns }) },
      { name: "source", run: () => setSourceContent(GUIDE_PLACE, input.id, input.source, { updatedBy: staff.userId }) },
    ], () => invalidate(pageId));
  } catch (error) { console.error("[guides:action]", error); return fail("server"); }
}
async function reorder(pageId: string, sectionId: string | null, orderedIds: string[]): Promise<GuideActionResult> {
  await requireStaff(["admin", "editor"]);
  if (!uuid(pageId) || sectionId !== null && !uuid(sectionId) || !z.array(z.uuid()).safeParse(orderedIds).success) return invalid({ order: "Invalid ordered IDs." });
  try {
    const bundle = await getGuideForEdit(pageId);
    if (!bundle) return fail("not_found");
    if (bundle.integrity === "invalid") return fail("invalid_stored_content");
    const parent = sectionId ? bundle.data.sections.find(s => s.id === sectionId) : null;
    if (sectionId && !parent) return fail("ownership");
    const ids = (parent ? parent.places : bundle.data.sections).map(s => s.id);
    if (!isExactGuideOrder(ids, orderedIds)) return invalid({ order: "Order must contain every saved child exactly once." });
    const errors = await treeErrors(bundle.data);
    if (Object.keys(errors).length) return invalid(errors);
    return runGuideWrite(pageId, orderedIds.map((id, position) => ({ name: `order:${id}`, run: () => parent ? db.update(guide_place).set({ position, updated_at: new Date() }).where(eq(guide_place.id, id)) : db.update(guide_section).set({ position, updated_at: new Date() }).where(eq(guide_section.id, id)) })), () => invalidate(pageId));
  } catch (error) { console.error("[guides:action]", error); return fail("server"); }
}
export async function reorderGuideSections(pageId: string, orderedIds: string[]) { return reorder(pageId, null, orderedIds); }
export async function reorderGuidePlaces(pageId: string, sectionId: string, orderedIds: string[]) { return reorder(pageId, sectionId, orderedIds); }
export async function deleteGuidePlace(pageId: string, sectionId: string, id: string): Promise<GuideActionResult> {
  await requireStaff(["admin", "editor"]);
  if (![pageId, sectionId, id].every(uuid)) return invalid({ id: "Invalid ID." });
  try {
    const bundle = await getGuideForEdit(pageId);
    if (!bundle) return fail("not_found");
    if (bundle.integrity === "invalid") return fail("invalid_stored_content");
    const parent = bundle.data.sections.find(s => s.id === sectionId);
    if (!parent?.places.some(p => p.id === id)) return fail("ownership");
    const page = { ...bundle.data, sections: bundle.data.sections.map(s => s.id === sectionId ? { ...s, places: s.places.filter(p => p.id !== id) } : s) };
    const errors = await treeErrors(page);
    if (Object.keys(errors).length) return invalid(errors);
    return runGuideWrite(id, [{ name: "place-translations", run: () => deleteContent(GUIDE_PLACE, id) }, { name: "place", run: () => db.delete(guide_place).where(eq(guide_place.id, id)) }], () => invalidate(pageId));
  } catch (error) { console.error("[guides:action]", error); return fail("server"); }
}
export async function deleteGuideSection(pageId: string, id: string): Promise<GuideActionResult> {
  await requireStaff(["admin", "editor"]);
  if (![pageId, id].every(uuid)) return invalid({ id: "Invalid ID." });
  try {
    const bundle = await getGuideForEdit(pageId);
    if (!bundle) return fail("not_found");
    if (bundle.integrity === "invalid") return fail("invalid_stored_content");
    const section = bundle.data.sections.find(s => s.id === id);
    if (!section) return fail("ownership");
    const errors = await treeErrors({ ...bundle.data, sections: bundle.data.sections.filter(s => s.id !== id) });
    if (Object.keys(errors).length) return invalid(errors);
    return runGuideWrite(id, [
      ...section.places.map(p => ({ name: `place-translations:${p.id}`, run: () => deleteContent(GUIDE_PLACE, p.id) })),
      { name: "section-translations", run: () => deleteContent(GUIDE_SECTION, id) },
      { name: "section", run: () => db.delete(guide_section).where(eq(guide_section.id, id)) },
    ], () => invalidate(pageId));
  } catch (error) { console.error("[guides:action]", error); return fail("server"); }
}
