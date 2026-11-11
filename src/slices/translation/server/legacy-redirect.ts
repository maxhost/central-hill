import "server-only";
import { locale as localeSchema, uuid } from "@core/validation/primitives";
import { getBlogEditorialRedirect } from "@slices/blog/contract";
import { getPropertyEditorialRedirect } from "@slices/buildings/contract";
import { getFaqLegacyEditorRedirect } from "@slices/faq/contract";
import { getGeographyLegacyEditorRedirect } from "@slices/geography/contract";
import { getGuideEditorialRedirect } from "@slices/guides/contract";
import { getPageEditorialRedirect } from "@slices/pages/contract";
import { getTestimonialEditorialRedirect } from "@slices/testimonials/contract";

const PAGES = "/admin/pages";

/**
 * Resolve retired review URLs after the route's staff gate. Each slice owns its
 * identity lookup; this compatibility layer never reads or writes generic copy.
 */
export async function getLegacyTranslationRedirect(
  type: string,
  id: string,
  locale?: string,
): Promise<string> {
  if (!uuid.safeParse(id).success) return PAGES;
  const parsedLocale = localeSchema.safeParse(locale);
  const editorLocale = parsedLocale.success ? parsedLocale.data : undefined;

  switch (type) {
    case "company_settings":
    case "nav_item":
      return "/admin/settings";
    case "service":
      return `/admin/services/${id}`;
    case "service_category":
      return `/admin/service-categories/${id}`;
    case "amenity":
      return `/admin/amenities/${id}`;
    case "form_definition":
      return `/admin/forms/${id}`;
    case "page_content":
      return (await getPageEditorialRedirect(type, id)) ?? PAGES;
    case "blog_post":
    case "author":
    case "blog_category":
      return getBlogEditorialRedirect(type, id, editorLocale) ?? PAGES;
    case "building":
    case "apartment":
    case "building_faq":
      return (
        (await getPropertyEditorialRedirect(type, id, editorLocale)) ??
        "/admin/buildings"
      );
    case "guide_page":
    case "guide_section":
    case "guide_place":
      return (
        (await getGuideEditorialRedirect(type, id, editorLocale)) ??
        "/admin/guides"
      );
    case "testimonial":
      return getTestimonialEditorialRedirect(type, id) ?? PAGES;
    case "city":
    case "neighbourhood":
      return (
        (await getGeographyLegacyEditorRedirect(type, id)) ?? "/admin/cities"
      );
    case "faq_item":
      return (await getFaqLegacyEditorRedirect(type, id)) ?? "/admin/faq";
    default:
      // Assets may have several consumers; unknown types get no generic editor.
      return PAGES;
  }
}
