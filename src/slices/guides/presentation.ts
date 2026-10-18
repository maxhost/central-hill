import { z } from "zod";
import type { GuideSection } from "./contract";

export const GUIDE_MODULE_KEYS = ["body", "image", "local_tip", "places", "cta"] as const;
export type GuideModuleKey = (typeof GUIDE_MODULE_KEYS)[number];
export const guideSectionPresentation = z.strictObject({
  version: z.literal(1),
  enabled: z.boolean().optional(),
  modules: z.strictObject({
    body: z.boolean().optional(), image: z.boolean().optional(),
    local_tip: z.boolean().optional(), places: z.boolean().optional(), cta: z.boolean().optional(),
  }).optional(),
});
export type GuideSectionPresentation = z.infer<typeof guideSectionPresentation>;
/** Invalid legacy data inherits the historical public render; admin blocks destructive saves. */
export function parseGuidePresentation(raw: unknown): GuideSectionPresentation | null {
  const parsed = guideSectionPresentation.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
export function isGuideModuleVisible(raw: unknown, key: GuideModuleKey): boolean {
  const value = parseGuidePresentation(raw);
  return value?.enabled !== false && value?.modules?.[key] !== false;
}
export function isGuideSectionVisible(raw: unknown): boolean {
  return parseGuidePresentation(raw)?.enabled !== false;
}
export function applyGuideSectionPresentation(section: GuideSection, raw: unknown): GuideSection | null {
  if (!isGuideSectionVisible(raw)) return null;
  return {
    ...section,
    body: isGuideModuleVisible(raw, "body") ? section.body : null,
    headerImage: isGuideModuleVisible(raw, "image") ? section.headerImage : null,
    localTip: isGuideModuleVisible(raw, "local_tip") ? section.localTip : null,
    places: isGuideModuleVisible(raw, "places") ? section.places : [],
    cta: isGuideModuleVisible(raw, "cta") ? section.cta : null,
  };
}

/** Translation changes to any tree level refresh the shared Guides cache. */
export function isGuideTranslationEntity(type: string): boolean {
  return type === "guide_page" || type === "guide_section" || type === "guide_place";
}
