import type { Locale } from "@core/db/columns";
import type { FeedbackGroup } from "@slices/backoffice/contract-client";
import { checkServiceEnvelope } from "../server/locale-validation";
import { buildPayload, type FormState } from "./form-model";
import type { ServiceFormWorkspace } from "./locale-form-state";
const labels: Record<string, string> = {
  name: "Name",
  excerpt: "Excerpt",
  body: "Body",
  slug: "URL slug",
  category_id: "Category",
  cover_media_id: "Cover image",
  og_image_media_id: "Social image",
  price_from: "Starting price",
  price_suffix: "Price suffix",
  rating_tenths: "Rating",
  booking_type: "Booking type",
  cta_label: "Button label",
  cta_url: "External URL",
  duration_label: "Duration",
  meta_title: "SEO title",
  meta_description: "SEO description",
  position: "Position",
  gallery: "Gallery",
  presentation: "Presentation",
  copy: "Display copy",
  enquiry_form_id: "Enquiry form — managed in EN",
  _source: "Shared source — managed in EN",
  _form: "Service",
  facts: "Key facts",
  title: "Title",
  icon: "Icon — managed in EN",
  note: "Note",
  badges: "Badges",
  booking_rows: "Booking details",
  label: "Label",
  value: "Value",
  itinerary: "Itinerary",
  time: "Time",
  text: "Text",
  option_groups: "Options",
  items: "Options",
  name_item: "Option name",
  desc: "Description",
  pricing: "Pricing",
  columns: "Columns",
  rows: "Rows",
  cells: "Cell",
  extras: "Extras",
  price: "Price",
  partners: "Partners",
  url: "Website URL",
  good_to_know: "Good to know",
  included: "Included",
  cancellation: "Cancellation",
  practical: "Practical information",
  highlights: "Highlights",
  notes: "Notes",
  about_title: "About heading",
  included_title: "Included heading",
  price_note: "Price note",
  media_id: "Image",
  footnote: "Footnote",
};
export function serviceFeedbackLabel(raw: string) {
  const path = raw.replace(/^(?:payload\.)?content\./, "").split(".");
  const section =
    path[0] === "detail"
      ? (labels[path[1]!] ?? "Details")
      : [
            "cta_url",
            "cta_label",
            "booking_type",
            "price_from",
            "price_suffix",
          ].includes(path[0]!)
        ? "Booking"
        : ["meta_title", "meta_description", "og_image_media_id"].includes(
              path[0]!,
            )
          ? "SEO"
          : "General";
  const breadcrumb = path
    .filter((p) => p !== "detail")
    .map((p) =>
      /^\d+$/.test(p) ? `Item ${Number(p) + 1}` : (labels[p] ?? "Content"),
    )
    .join(" → ");
  return { section, label: breadcrumb };
}
export function serviceFeedbackGroups(
  workspace: ServiceFormWorkspace,
): FeedbackGroup[] {
  return (["en", "es", "pt", "fr"] as const).map((locale) => ({
    locale,
    notice: workspace.locales[locale].notice,
    issues: Object.entries(workspace.locales[locale].errors).map(
      ([path, message]) => ({ path, message, ...serviceFeedbackLabel(path) }),
    ),
    ...(workspace.locales[locale].uncertain
      ? { uncertain: true, notice: workspace.locales[locale].notice }
      : {}),
  }));
}
export function serviceCurrentErrors(form: FormState): Record<string, string> {
  try {
    const content = buildPayload(form, undefined);
    return checkServiceEnvelope(
      {
        schemaVersion: 1,
        localeMode: "custom",
        content: Object.fromEntries(
          Object.entries(content).filter(
            ([k]) => !["id", "slug", "status"].includes(k),
          ),
        ),
      },
      true,
    ).errors;
  } catch {
    return { price_from: "Enter a valid starting price." };
  }
}
export function retainServiceErrors(
  workspace: ServiceFormWorkspace,
  locale: Locale,
  form: FormState,
  confirmedSave = false,
) {
  const errors = serviceCurrentErrors(form);
  return Object.fromEntries(
    Object.entries(workspace.locales[locale].errors).flatMap(
      ([path, message]) => {
        if (Object.hasOwn(errors, path)) return [[path, errors[path]!]];
        if (confirmedSave) return [];
        const changed =
          JSON.stringify(
            fieldValue(workspace.locales[locale].working, path),
          ) !== JSON.stringify(fieldValue(form, path));
        if (!changed) return [[path, message]];
        return /uploaded|existing|shared|reference|source|Save to check/i.test(
          message,
        )
          ? [[path, "Selection changed. Save to check it again."]]
          : [];
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
export function serviceMediaPath(form: FormState, id: string): string | null {
  if (form.cover_media_id === id) return "cover_media_id";
  if (form.og_image_media_id === id) return "og_image_media_id";
  const gallery = form.gallery.indexOf(id);
  if (gallery >= 0) return `gallery.${gallery}`;
  const step = form.detail.itinerary.findIndex((step) => step.media_id === id);
  return step >= 0 ? `detail.itinerary.${step}.media_id` : null;
}
