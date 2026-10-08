/**
 * Registry of the editable fixed pages (ADR 0012): the five marketing pages plus `blog` and
 * `guides`, which hold the copy those sections show outside their posts/guides. Maps each `page_content.key`
 * to its fixed Zod schema, and derives the translatable leaf paths the translation
 * pipeline must extract per page.
 */
import { z } from "zod";
import { translatablePaths } from "@core/validation/primitives";
import { homeSchema } from "./home";
import { ownersSchema } from "./owners";
import { realEstateSchema } from "./real-estate";
import { aboutSchema } from "./about";
import { guestSchema } from "./guest";
import { blogSchema } from "./blog";
import { guidesSchema } from "./guides";

/** `page_content.key` enum — one row per key. */
export const pageKey = z.enum(["home", "owners", "real_estate", "about", "guest", "blog", "guides"]);
export type PageKey = z.infer<typeof pageKey>;

/** key → the fixed schema that validates that page's `data` jsonb. */
export const pageSchemas = {
  home: homeSchema,
  owners: ownersSchema,
  real_estate: realEstateSchema,
  about: aboutSchema,
  guest: guestSchema,
  blog: blogSchema,
  guides: guidesSchema,
} as const satisfies Record<PageKey, z.ZodType>;

/** key → translatable leaf paths (with `[]` array wildcards) for the pipeline. */
export const translatablePathsByPage: Record<PageKey, string[]> = {
  home: translatablePaths(homeSchema),
  owners: translatablePaths(ownersSchema),
  real_estate: translatablePaths(realEstateSchema),
  about: translatablePaths(aboutSchema),
  guest: translatablePaths(guestSchema),
  blog: translatablePaths(blogSchema),
  guides: translatablePaths(guidesSchema),
};

export {
  homeSchema,
  ownersSchema,
  realEstateSchema,
  aboutSchema,
  guestSchema,
  blogSchema,
  guidesSchema,
};
export type { HomeContent } from "./home";
export type { OwnersContent } from "./owners";
export type { RealEstateContent } from "./real-estate";
export type { AboutContent } from "./about";
export type { GuestContent } from "./guest";
export type { BlogContent } from "./blog";
export type { GuidesContent } from "./guides";
