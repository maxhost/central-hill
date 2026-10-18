import type { AdminMediaPreview } from "@slices/backoffice/contract";
import type { GuideTemplate, GuideLayout, GuidePriceTier } from "../contract";
import type { GuideSectionPresentation } from "../presentation";

export type GuideStatus = "draft" | "published" | "archived";
export type GuideLocale = "en" | "pt" | "es" | "fr";
export interface GuideCityOption { id: string; name: string; slug: string; status: GuideStatus }
export interface GuidePageColumns {
  city_id: string; template: GuideTemplate; status: GuideStatus; position: number;
  hero_media_id: string | null; og_image_media_id: string | null;
}
export interface GuidePageSource {
  title: string; intro: string | null; meta_title: string | null; meta_description: string | null;
}
export interface GuideSectionColumns {
  position: number; header_media_id: string | null; cta_url: string | null;
  presentation: GuideSectionPresentation | null;
}
export interface GuideSectionSource { title: string; body: string | null; local_tip: string | null; cta_label: string | null }
export interface GuidePlaceColumns {
  position: number; category: string | null; address: string | null; phone: string | null;
  price_tier: GuidePriceTier | null; opening_hours: string | null;
  latitude: number | null; longitude: number | null; website_url: string | null;
  booking_url: string | null; media_id: string | null;
}
export interface GuidePlaceSource { name: string; description: string | null }
export interface GuidePlaceEdit extends GuidePlaceColumns, GuidePlaceSource { id: string; guide_section_id: string }
export interface GuideSectionEdit extends Omit<GuideSectionColumns, "presentation">, GuideSectionSource {
  id: string; guide_page_id: string; layout: GuideLayout; presentation: unknown; places: GuidePlaceEdit[];
}
export interface GuidePageEdit extends GuidePageColumns, GuidePageSource {
  id: string; slug: string; slugs: Partial<Record<GuideLocale, string>>; sections: GuideSectionEdit[];
}
export interface GuideEditBundle {
  data: GuidePageEdit; previews: Record<string, AdminMediaPreview>;
  cities: GuideCityOption[]; publishedUrl: string | null; integrity: "valid" | "invalid";
}
export interface GuideAdminListItem {
  id: string; title: string; city: string; city_id: string; template: GuideTemplate;
  status: GuideStatus; position: number; sections: number; places: number; publishedUrl: string | null;
}
export interface GuideMutation<C, S> { id: string; create?: boolean; changes: Partial<C>; source: Partial<S> }
export type GuidePageMutation = GuideMutation<GuidePageColumns, GuidePageSource> & { slugs?: Partial<Record<GuideLocale, string>> };
export type GuideSectionMutation = GuideMutation<GuideSectionColumns, GuideSectionSource>;
export type GuidePlaceMutation = GuideMutation<GuidePlaceColumns, GuidePlaceSource>;
export type GuideActionResult =
  | { ok: true; id: string }
  | { ok: false; error: "validation" | "not_found" | "ownership" | "slug_conflict" | "invalid_stored_content" | "server"; fieldErrors?: Record<string, string> }
  | { ok: false; error: "partial_write"; entityIds: string[]; completedSteps: string[]; failedStep: string; reloadRequired: true };
export interface GuideWriteStep { name: string; run: () => Promise<unknown> }
/** Statements are sequential. Even the first failed request may have persisted remotely. */
export async function runGuideWrite(id: string, steps: GuideWriteStep[], invalidate: () => void): Promise<GuideActionResult> {
  const completedSteps: string[] = [];
  let failedStep = "invalidate";
  try {
    for (const step of steps) { failedStep = step.name; await step.run(); completedSteps.push(step.name); }
    invalidate();
    return { ok: true, id };
  } catch {
    try { invalidate(); } catch { /* Preserve the original write outcome. */ }
    return { ok: false, error: "partial_write", entityIds: [id], completedSteps, failedStep, reloadRequired: true };
  }
}
