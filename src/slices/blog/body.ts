/**
 * Blog post body — constrained portable-JSON block set (ADR 0013).
 *
 * A closed, versioned set of typed blocks. The editor exposes only these types;
 * the renderer is a typed switch over `type`. No raw HTML/URLs — inline images
 * reference `media_asset.id` and resolve at render. The whole `body` is one
 * translatable field (stored as portable JSON in the translation table), so
 * blocks are NOT enumerated as per-leaf translatable paths.
 * See docs/data-model.md → Slice blog → Body block set.
 */
import { z } from "zod";
import { mediaId, url } from "@core/validation/primitives";

/** Safe links for inline editorial text; no HTML is persisted. */
export function isSafeInlineHref(value: string): boolean {
  if (!value || value !== value.trim() || /[\u0000-\u0020\u007f]/.test(value)) return false;
  if (value.startsWith("#")) return true;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  try { return ["http:", "https:", "mailto:", "tel:"].includes(new URL(value).protocol); }
  catch { return false; }
}
export const inlineTextRun = z.object({
  text: z.string().min(1).max(4000),
  bold: z.boolean().optional(), italic: z.boolean().optional(),
  href: z.string().max(2048).refine(isSafeInlineHref, "Use a safe link.").optional(),
}).strict();
export type InlineTextRun = z.infer<typeof inlineTextRun>;
export const inlineText = z.array(inlineTextRun).max(1000);

export const headingBlock = z.object({
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  number: z.string().max(12).optional(), // optional section number e.g. "01"
  text: z.string().min(1).max(300),
  inline: inlineText.optional(),
});

export const paragraphBlock = z.object({
  type: z.literal("paragraph"),
  text: z.string().min(1).max(4000),
  inline: inlineText.optional(),
});

export const listBlock = z.object({
  type: z.literal("list"),
  ordered: z.boolean(),
  items: z.array(z.string().min(1).max(1000)).min(1).max(50),
  inline_items: z.array(inlineText).max(50).optional(),
});

export const imageBlock = z.object({
  type: z.literal("image"),
  media_id: mediaId,
  caption: z.string().max(300).optional(),
  alt: z.string().max(300).optional(),
});

export const quoteBlock = z.object({
  type: z.literal("quote"),
  text: z.string().min(1).max(1000),
  inline: inlineText.optional(),
  attribution: z.string().max(160).optional(),
});

export const calloutBlock = z.object({
  type: z.literal("callout"),
  variant: z.enum(["info", "tip", "warning", "note"]),
  body: z.string().min(1).max(2000),
  inline: inlineText.optional(),
});

export const dividerBlock = z.object({
  type: z.literal("divider"),
});

export const ctaBlock = z.object({
  type: z.literal("cta"),
  label: z.string().min(1).max(80),
  url,
});

/** A single body block. */
export const bodyBlock = z.discriminatedUnion("type", [
  headingBlock,
  paragraphBlock,
  listBlock,
  imageBlock,
  quoteBlock,
  calloutBlock,
  dividerBlock,
  ctaBlock,
]);
export type BodyBlock = z.infer<typeof bodyBlock>;

/** The ordered body — an array of typed blocks. */
/** Inline text must agree with the canonical plain text fields. */
export function bodyInlineErrors(body: BodyBlock[]): Record<string, string> {
  const errors: Record<string, string> = {};
  body.forEach((block, index) => {
    if (block.type === "list") {
      if (block.inline_items && (block.inline_items.length !== block.items.length ||
        block.inline_items.some((runs, i) => runs.map(run => run.text).join("") !== block.items[i])))
        errors[`body.${index}.inline_items`] = "Formatted list text must match its items.";
    } else if ("inline" in block && block.inline) {
      const text = block.type === "callout" ? block.body : "text" in block ? block.text : "";
      if (block.inline.map(run => run.text).join("") !== text)
        errors[`body.${index}.inline`] = "Formatted text must match its plain text.";
    }
  });
  return errors;
}
export const postBody = z.array(bodyBlock).superRefine((blocks, context) => {
  for (const [path, message] of Object.entries(bodyInlineErrors(blocks)))
    context.addIssue({ code: "custom", path: path.split(".").slice(1).map(part => /^\d+$/.test(part) ? Number(part) : part), message });
});
export type PostBody = z.infer<typeof postBody>;
