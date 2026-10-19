import { translatablePaths } from "@core/validation/primitives";
import type { Locale } from "@core/db/columns";
import { guidesSchema, type GuidesContent } from "./schemas/guides";
import { applyDefaults, describe } from "./admin/form-model";
import type { PageEditorialDescriptor } from "./editorial-adapter-types";
import type { GuideAsideCta, GuidesPage } from "./contract";
import {
  editorialTextPaths,
  editorialTranslationField,
} from "./editorial-identities";

export const guidesDescriptor: PageEditorialDescriptor = {
  key: "guides",
  title: "Guides",
  publicPath: "/guides",
  rootNode: describe(guidesSchema),
  textPatterns: translatablePaths(guidesSchema),
  listPaths: [],
  maxLocalMedia: 4,
  externalSections: [],
  sectionPreviews: { guide_aside: "shared_aside" },
  collapseWhenFalse: [{ section: "city_filter", path: "city_filter.enabled" }],
  mediaSlots: [
    { path: "hero.video_media_id", kind: "video" },
    { path: "hero.poster_media_id", kind: "image" },
    { path: "guide_aside.image_media_id", kind: "image" },
  ],
};

/** Empty overrides remain empty; an omitted legacy enabled flag always means true. */
export function normalizeGuides(content: GuidesContent): GuidesContent {
  const result = applyDefaults(
    guidesDescriptor.rootNode,
    content,
  ) as GuidesContent;
  result.city_filter!.enabled = content.city_filter?.enabled ?? true;
  return result;
}
export const guidesTextPaths = (content: GuidesContent) =>
  editorialTextPaths(content, guidesDescriptor);
export const guidesTranslationField = (content: GuidesContent, path: string) =>
  editorialTranslationField(content, path, guidesDescriptor);

/** The same resolved editorial payload supplies a detail aside and its private surface. */
export function guidesAsideCta(
  page: GuidesPage,
  locale: Locale,
): GuideAsideCta {
  const aside = page.content.guide_aside;
  return {
    eyebrow: aside.eyebrow || undefined,
    title: aside.title,
    body: aside.body || undefined,
    image: page.media[aside.image_media_id ?? ""] ?? null,
    cta: { label: aside.cta_label, href: `/${locale}/buildings` },
  };
}
