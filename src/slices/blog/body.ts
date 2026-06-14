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

export const headingBlock = z.object({
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  number: z.string().max(12).optional(), // optional section number e.g. "01"
  text: z.string().min(1).max(300),
});

export const paragraphBlock = z.object({
  type: z.literal("paragraph"),
  text: z.string().min(1).max(4000),
});

export const listBlock = z.object({
  type: z.literal("list"),
  ordered: z.boolean(),
  items: z.array(z.string().min(1).max(1000)).min(1).max(50),
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
  attribution: z.string().max(160).optional(),
});

export const calloutBlock = z.object({
  type: z.literal("callout"),
  variant: z.enum(["info", "tip", "warning", "note"]),
  body: z.string().min(1).max(2000),
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
export const postBody = z.array(bodyBlock);
export type PostBody = z.infer<typeof postBody>;
