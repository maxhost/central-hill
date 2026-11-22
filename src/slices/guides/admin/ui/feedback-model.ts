import type { Locale } from "@core/db/columns";
import type { FeedbackGroup } from "@slices/backoffice/contract-client";
import {
  GUIDE_SHARED_ROOT_KEYS,
  GUIDE_SHARED_PLACE_KEYS,
  type GuideContent,
} from "../../editorial-types";
import { guideTreeErrors } from "../validation";
import {
  guideEnvelopeSchema,
  guideLocaleFieldErrors,
} from "../../server/locale-validation";
import type { GuideFormWorkspace } from "./locale-form-state";

const labels: Record<string, string> = {
  city_id: "City",
  title: "Title",
  slug: "URL slug",
  sections: "Visible sections",
  presentation: "Section content",
  body: "Body",
  header_media_id: "Section image",
  image: "Photo",
  local_tip: "Local tip",
  places: "Places",
  cta: "Button",
  cta_label: "Button label",
  cta_url: "Button URL",
  name: "Place name",
  description: "Description",
  position: "Position",
  hero_media_id: "Hero image",
  og_image_media_id: "Social image",
  meta_title: "SEO title",
  meta_description: "SEO description",
  address: "Address",
  phone: "Phone",
  latitude: "Latitude",
  longitude: "Longitude",
  website_url: "Website URL",
  booking_url: "Booking URL",
  price_tier: "Price tier",
  media_id: "Place image",
  template: "Template",
  layout: "Layout",
  opening_hours: "Opening hours",
  category: "Category",
  _shared: "Shared fields — managed in EN",
  _form: "Guide",
  _source: "Shared source — managed in EN",
};
export function guideFeedbackDestination(
  content: GuideContent,
  rootId: string,
  raw: string,
) {
  const path = raw.replace(/^(payload\.)?content\./, "").split(".");
  let id = rootId,
    section = "Guide";
  if (path[0] === "sections" && path.length > 1) {
    const s =
      content.sections.find((s) => s.id === path[1]) ??
      content.sections[Number(path[1])];
    if (s) {
      section = `Section ${content.sections.indexOf(s) + 1}`;
      id = s.id;
      path.splice(0, 2);
      if (path.at(0) === "places" && path.length > 1) {
        const p =
          s.places.find((p) => p.id === path[1]) ?? s.places[Number(path[1])];
        if (p) {
          section += ` → Place ${s.places.indexOf(p) + 1}`;
          id = p.id;
          path.splice(0, 2);
        }
      }
    }
  }
  const key = path.join(".") || "_form";
  return {
    id,
    name: key,
    label: labels[key] ?? labels[path.at(-1)!] ?? "Guide content",
    section,
  };
}
/** Identify only actual shared dependencies; mixed content groups and locale-owned copy stay local. */
function guideIssueSourceLocale(
  workspace: GuideFormWorkspace,
  locale: Locale,
  path: string,
): Locale | undefined {
  if (locale === "en") return undefined;
  const destination = guideFeedbackDestination(
    workspace.locales[locale].working,
    workspace.id,
    path,
  );
  if (destination.id === workspace.id)
    return (GUIDE_SHARED_ROOT_KEYS as readonly string[]).includes(
      destination.name,
    )
      ? "en"
      : undefined;
  const source = workspace.locales.en.working;
  if (source.sections.some((section) => section.id === destination.id)) {
    return ["header_media_id", "layout", "image"].includes(destination.name) ||
      destination.name.startsWith("presentation.")
      ? "en"
      : undefined;
  }
  if (
    source.sections.some((section) =>
      section.places.some((place) => place.id === destination.id),
    )
  ) {
    return (GUIDE_SHARED_PLACE_KEYS as readonly string[]).includes(
      destination.name,
    ) || destination.name === "recommendation_type"
      ? "en"
      : undefined;
  }
  // A target-only section/place has its real editing control in that language.
  return undefined;
}
export function guideFeedbackGroups(
  workspace: GuideFormWorkspace,
): FeedbackGroup[] {
  return (["en", "es", "pt", "fr"] as const).map((locale) => ({
    locale,
    notice: workspace.locales[locale].notice,
    issues: Object.entries(workspace.locales[locale].errors).map(
      ([path, message]) => ({
        path,
        message,
        ...guideFeedbackDestination(
          workspace.locales[locale].working,
          workspace.id,
          path,
        ),
        ...(guideIssueSourceLocale(workspace, locale, path)
          ? { sourceLocale: guideIssueSourceLocale(workspace, locale, path) }
          : {}),
      }),
    ),
    ...(workspace.locales[locale].uncertain
      ? { uncertain: true, notice: workspace.locales[locale].notice }
      : {}),
  }));
}
export function guideCurrentErrors(
  workspace: GuideFormWorkspace,
  locale: Locale,
  content: GuideContent,
): Record<string, string> {
  const parsed = guideEnvelopeSchema.safeParse({
    schemaVersion: 1,
    localeMode: "custom",
    content,
  });
  const errors = parsed.success
    ? {}
    : guideLocaleFieldErrors(parsed.error.issues);
  return {
    ...errors,
    ...guideTreeErrors(
      {
        ...content,
        id: workspace.id,
        status: "published",
        slug: workspace.slug,
        slugs: { en: workspace.slug },
      },
      workspace.model?.cities ?? [],
    ),
  };
}
/** Revalidate only already-known failures. Visiting a tab never invents validation. */
export function retainGuideErrors(
  workspace: GuideFormWorkspace,
  locale: Locale,
  content: GuideContent,
  confirmedSave = false,
) {
  const current = guideCurrentErrors(workspace, locale, content);
  const previousLocal = guideCurrentErrors(
    workspace,
    locale,
    workspace.locales[locale].working,
  );
  return Object.fromEntries(
    Object.entries(workspace.locales[locale].errors).flatMap(
      ([path, message]) => {
        if (Object.hasOwn(current, path)) return [[path, current[path]!]];
        if (confirmedSave || Object.hasOwn(previousLocal, path)) return [];
        const changed =
          JSON.stringify(
            fieldValue(workspace.locales[locale].working, path),
          ) !== JSON.stringify(fieldValue(content, path));
        if (!changed) return [[path, message]];
        return [[path, "Selection changed. Save to check it again."]];
      },
    ),
  );
}

function fieldValue(value: unknown, path: string): unknown {
  for (const key of path.replace(/^(?:payload\.)?content\./, "").split(".")) {
    if (Array.isArray(value))
      value = value.find((item) => item?.id === key) ?? value[Number(key)];
    else
      value =
        value && typeof value === "object"
          ? (value as Record<string, unknown>)[key]
          : undefined;
  }
  return value;
}
export function guideMediaPath(
  content: GuideContent,
  id: string,
): string | null {
  if (content.hero_media_id === id) return "hero_media_id";
  if (content.og_image_media_id === id) return "og_image_media_id";
  for (const section of content.sections) {
    if (section.header_media_id === id)
      return `sections.${section.id}.header_media_id`;
    for (const place of section.places)
      if (place.media_id === id)
        return `sections.${section.id}.places.${place.id}.media_id`;
  }
  return null;
}
