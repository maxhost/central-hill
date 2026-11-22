import type { FeedbackGroup } from "@slices/backoffice/contract-client";
import { checkBlogEnvelope } from "../../server/post-locale-validation";
import type { BlogPostEnvelopeV1 } from "../editorial-contract";
import type { PostWorkspace } from "./post-editor-state";
const labels: Record<string, string> = {
  title: "Title",
  excerpt: "Excerpt",
  body: "Article body",
  category_id: "Category — managed in EN",
  author_id: "Author — managed in EN",
  cover_media_id: "Cover image — managed in EN",
  og_image_media_id: "Social image — managed in EN",
  slug: "URL slug",
  published_at: "Publication date",
  reading_minutes: "Reading time",
  is_featured: "Featured",
  related_ids: "Related articles",
  cta_label: "Button label",
  cta_url: "Button URL",
  meta_title: "SEO title",
  meta_description: "SEO description",
  text: "Text",
  items: "List items",
  media_id: "Image",
  label: "Button label",
  url: "Button URL",
  inline: "Formatted text",
  inline_items: "Formatted list",
  _source: "Shared source — managed in EN",
  _form: "Article",
};
export function postFeedbackLabel(raw: string) {
  const path = raw.replace(/^(?:payload\.)?content\./, "").split(".");
  if (path[0] === "body") {
    const contentPath = path.slice(1);
    return {
      section: "Article body",
      label: contentPath.length
        ? contentPath
            .map((part, index) =>
              /^\d+$/.test(part)
                ? `${index === 0 ? "Block" : "Item"} ${Number(part) + 1}`
                : part === "body"
                  ? "Text"
                  : (labels[part] ?? "Content"),
            )
            .join(" → ")
        : "Content",
    };
  }
  const button = ["cta_label", "cta_url"].includes(path[0]!);
  const seo = ["meta_title", "meta_description", "og_image_media_id"].includes(
    path[0]!,
  );
  const leafLabels: Record<string, string> = {
    cta_label: "Label",
    cta_url: "URL",
    meta_title: "Title",
    meta_description: "Description",
  };
  return {
    section: button ? "Button" : seo ? "SEO" : "Article details",
    label: path
      .map((part) =>
        /^\d+$/.test(part)
          ? `Item ${Number(part) + 1}`
          : (leafLabels[part] ?? labels[part] ?? "Content"),
      )
      .join(" → "),
  };
}
export function postFeedbackGroups(states: PostWorkspace): FeedbackGroup[] {
  return (["en", "es", "pt", "fr"] as const).map((locale) => ({
    locale,
    notice: states[locale].notice,
    issues: Object.entries(states[locale].errors).map(([path, message]) => ({
      path,
      message,
      ...postFeedbackLabel(path),
      ...(locale !== "en" &&
      [
        "category_id",
        "author_id",
        "cover_media_id",
        "og_image_media_id",
        "related_ids",
        "_source",
      ].includes(path.replace(/^(?:payload\.)?content\./, ""))
        ? { sourceLocale: "en" as const }
        : {}),
    })),
    ...(states[locale].uncertain
      ? { uncertain: true, notice: states[locale].notice }
      : {}),
  }));
}
export function retainPostErrors(
  errors: Record<string, string>,
  envelope: BlogPostEnvelopeV1,
  previous?: BlogPostEnvelopeV1,
  confirmedSave = false,
) {
  const current = checkBlogEnvelope(envelope, true).errors;
  const valueAt = (value: unknown, path: string): unknown =>
    path
      .split(".")
      .reduce<unknown>(
        (v, k) =>
          v && typeof v === "object"
            ? (v as Record<string, unknown>)[k]
            : undefined,
        value,
      );
  return Object.fromEntries(
    Object.entries(errors).flatMap(([path, message]) => {
      const key = path.replace(/^(?:payload\.)?content\./, "");
      if (Object.hasOwn(current, key)) return [[path, current[key]!]];
      if (confirmedSave) return [];
      const changed =
        previous &&
        JSON.stringify(valueAt(previous.content, key)) !==
          JSON.stringify(valueAt(envelope.content, key));
      if (!changed) return [[path, message]];
      return /uploaded|available|exist|shared|reference|source|Save to check/i.test(
        message,
      )
        ? [[path, "Selection changed. Save to check it again."]]
        : [];
    }),
  );
}
export function postMediaPath(
  envelope: BlogPostEnvelopeV1,
  id: string,
): string | null {
  const c = envelope.content;
  if (c.cover_media_id === id) return "cover_media_id";
  if (c.og_image_media_id === id) return "og_image_media_id";
  const block = c.body.findIndex(
    (block) => block.type === "image" && block.media_id === id,
  );
  return block >= 0 ? `body.${block}.media_id` : null;
}
