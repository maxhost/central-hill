import { z } from "zod";
import { locale, slug, uuid } from "@core/validation/primitives";
import { headingBlock, paragraphBlock, listBlock, imageBlock, quoteBlock, calloutBlock, dividerBlock, ctaBlock, postBody } from "../body";
import type { BlogPostEnvelopeV1 } from "../editorial-types";

const safeLink = z.string().max(2048).refine(value => {
  if (!value) return true;
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}, "Use an HTTP or HTTPS URL.");
const draftBlock = z.discriminatedUnion("type", [
  headingBlock.extend({ text: z.string().max(300) }),
  paragraphBlock.extend({ text: z.string().max(4000) }),
  listBlock.extend({ items: z.array(z.string().max(1000)).max(50) }),
  imageBlock.extend({ media_id: uuid.or(z.literal("")) }),
  quoteBlock.extend({ text: z.string().max(1000) }),
  calloutBlock.extend({ body: z.string().max(2000) }),
  dividerBlock,
  ctaBlock.extend({ label: z.string().max(80), url: safeLink }),
]);
export const blogEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  content: z.object({
    title: z.string().max(200), excerpt: z.string().max(400),
    body: z.array(draftBlock).max(200),
    category_id: uuid, author_id: uuid,
    cover_media_id: uuid.nullable(), og_image_media_id: uuid.nullable(),
    published_at: z.string().max(40).nullable().refine(v => !v || !Number.isNaN(Date.parse(v)), "Invalid date."),
    reading_minutes: z.number().int().positive().max(120).nullable(), is_featured: z.boolean(),
    related_ids: z.array(uuid).max(3).refine(v => new Set(v).size === v.length, "Duplicate related article."),
    cta_label: z.string().max(80).nullable(), cta_url: safeLink.nullable(),
    meta_title: z.string().max(70).nullable(), meta_description: z.string().max(200).nullable(),
  }).strict(),
}).strict();
export const saveBlogRequest = z.object({
  postId: uuid, locale, expectedRevision: z.number().int().nonnegative(),
  templateRevision: z.number().int().nonnegative().nullable(),
  payload: z.unknown(), slug: slug.optional(),
}).strict();
export const publishBlogRequest = z.object({ postId: uuid, locale, expectedRevision: z.number().int().nonnegative() }).strict();
export function issuesByField(issues: readonly { path: PropertyKey[]; message: string }[]): Record<string, string> {
  return Object.fromEntries(issues.map(issue => [issue.path.map(String).join(".") || "_source", issue.message]));
}
export function checkBlogEnvelope(raw: unknown, publish = false): { envelope?: BlogPostEnvelopeV1; errors: Record<string, string> } {
  let size: number;
  try { size = new TextEncoder().encode(JSON.stringify(raw)).byteLength; } catch { return { errors: { _source: "Invalid document." } }; }
  if (size > 192 * 1024) return { errors: { _source: "Article is too large." } };
  const parsed = blogEnvelopeSchema.safeParse(raw);
  if (!parsed.success) return { errors: issuesByField(parsed.error.issues) };
  const envelope: BlogPostEnvelopeV1 = parsed.data;
  const errors: Record<string, string> = {};
  if (publish) {
    const c = envelope.content;
    if (!c.title.trim()) errors.title = "Title is required.";
    if (!c.excerpt.trim()) errors.excerpt = "Excerpt is required.";
    if (!c.cover_media_id) errors.cover_media_id = "Cover image is required.";
    if (!c.body.length) errors.body = "Article body is required.";
    const checked = postBody.safeParse(c.body);
    if (!checked.success) Object.assign(errors, Object.fromEntries(checked.error.issues.map(issue => [`body.${issue.path.map(String).join(".")}`, issue.message])));
    if (Boolean(c.cta_label?.trim()) !== Boolean(c.cta_url?.trim())) errors.cta_url = "Provide both the button label and URL, or clear both.";
    for (const [i, block] of c.body.entries()) {
      if ((block.type === "heading" || block.type === "paragraph" || block.type === "quote") && !block.text.trim()) errors[`body.${i}.text`] = "Text is required.";
      if (block.type === "callout" && !block.body.trim()) errors[`body.${i}.body`] = "Text is required.";
      if (block.type === "list" && block.items.some(item => !item.trim())) errors[`body.${i}.items`] = "List items cannot be blank.";
      if (block.type === "cta" && (!block.label.trim() || !block.url.trim())) errors[`body.${i}.url`] = "Button label and URL are required.";
    }
  }
  return { envelope, errors };
}
export const sharedBlogFields = ["category_id", "author_id", "cover_media_id", "og_image_media_id", "published_at", "is_featured", "related_ids"] as const;
export function sharedBlogValuesMatch(candidate: BlogPostEnvelopeV1, template: BlogPostEnvelopeV1): boolean {
  return sharedBlogFields.every(key => JSON.stringify(candidate.content[key]) === JSON.stringify(template.content[key]));
}
export function prepareBlogTarget(template: BlogPostEnvelopeV1, own: BlogPostEnvelopeV1 | null): BlogPostEnvelopeV1 {
  if (!own) return structuredClone(template);
  const content = { ...own.content };
  for (const field of sharedBlogFields) Object.assign(content, { [field]: structuredClone(template.content[field]) });
  return { schemaVersion: 1, content };
}
export function blogMediaIds(envelope: BlogPostEnvelopeV1): string[] {
  return [...new Set([envelope.content.cover_media_id, envelope.content.og_image_media_id,
    ...envelope.content.body.flatMap(block => block.type === "image" ? [block.media_id] : [])].filter((id): id is string => Boolean(id)))];
}
