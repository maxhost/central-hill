import { z } from "zod";
import { postBody, type PostBody } from "@slices/blog/rich-text-contract";
import { mediaAltsSchema } from "@core/media/alt";
import type { PageEditorialDescriptor } from "./editorial-adapter-types";
import type { PageEnvelope } from "./editorial-types";

export const LEGAL_PAGE_KEYS = ["privacy_policy", "cookies_policy", "complaints_book"] as const;
export type LegalPageKey = (typeof LEGAL_PAGE_KEYS)[number];
export const legalPagePaths: Record<LegalPageKey, string> = {
  privacy_policy: "/privacy-policy", cookies_policy: "/cookies-policy", complaints_book: "/complaints-book",
};
export const legalPageTitles: Record<LegalPageKey, string> = {
  privacy_policy: "Privacy Policy", cookies_policy: "Cookies Policy", complaints_book: "Complaints Book",
};
export function isLegalPageKey(key: string): key is LegalPageKey {
  return (LEGAL_PAGE_KEYS as readonly string[]).includes(key);
}

const textBody = postBody.max(200).superRefine((blocks, context) => {
  blocks.forEach((block, index) => {
    if (!["heading", "paragraph", "list", "divider"].includes(block.type))
      context.addIssue({ code: "custom", path: [index], message: "Use text, headings, lists or dividers." });
  });
});
export const legalPageDraftSchema = z.object({
  title: z.string().max(200),
  body: textBody,
  seo: z.object({ meta_title: z.string().max(70), meta_description: z.string().max(170) }).strict(),
}).strict();
export type LegalPageContent = z.infer<typeof legalPageDraftSchema>;
export const legalPagePublishSchema = legalPageDraftSchema.superRefine((content, context) => {
  if (!content.title.trim()) context.addIssue({ code: "custom", path: ["title"], message: "Enter a page title." });
  if (!content.body.some(block => ("text" in block && block.text.trim()) || (block.type === "list" && block.items.some(item => item.trim()))))
    context.addIssue({ code: "custom", path: ["body"], message: "Enter page content before publishing." });
});
export function defaultLegalPage(key: LegalPageKey): LegalPageContent {
  return { title: legalPageTitles[key], body: [], seo: { meta_title: "", meta_description: "" } };
}
/** The Rich body is one atomic editor binding; its actual shape is validated above. */
export function legalPageDescriptor(key: LegalPageKey): PageEditorialDescriptor {
  return {
    key, title: legalPageTitles[key], publicPath: legalPagePaths[key], localeIndependentContent: true,
    rootNode: { kind: "object", fields: [
      { key: "title", node: { kind: "string", multiline: false, optional: false } },
      { key: "body", node: { kind: "string", multiline: true, optional: false } },
      { key: "seo", node: { kind: "object", fields: [
        { key: "meta_title", node: { kind: "string", multiline: false, optional: false } },
        { key: "meta_description", node: { kind: "string", multiline: true, optional: false } },
      ] } },
    ] },
    textPatterns: ["title", "body", "seo.meta_title", "seo.meta_description"],
    listPaths: [], mediaSlots: [], maxLocalMedia: 1, externalSections: [],
  };
}
const publishedEnvelope = z.object({
  schemaVersion: z.literal(1), content: legalPagePublishSchema,
  ogImageMediaId: z.uuid().nullable(), mediaAlts: mediaAltsSchema.optional(),
}).strict();
/** Complete document fallback only: never merge translated blocks or consult drafts. */
export function pickLegalPageSnapshot(rows: readonly { locale: string; published: unknown }[], locale: string): PageEnvelope<LegalPageKey> | null {
  const english = publishedEnvelope.safeParse(rows.find(row => row.locale === "en")?.published);
  for (const candidate of locale === "en" ? ["en"] : [locale, "en"]) {
    const parsed = publishedEnvelope.safeParse(rows.find(row => row.locale === candidate)?.published);
    if (parsed.success) return {
      ...parsed.data,
      // Shared images follow published EN only; drafts never alter public metadata.
      ogImageMediaId: english.success ? english.data.ogImageMediaId : parsed.data.ogImageMediaId,
    };
  }
  return null;
}
export type { PostBody };
