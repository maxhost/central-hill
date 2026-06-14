/**
 * Registry of the five editable fixed pages (ADR 0012). Maps each `page_content.key`
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

/** `page_content.key` enum — one row per key. */
export const pageKey = z.enum(["home", "owners", "real_estate", "about", "guest"]);
export type PageKey = z.infer<typeof pageKey>;

/** key → the fixed schema that validates that page's `data` jsonb. */
export const pageSchemas = {
  home: homeSchema,
  owners: ownersSchema,
  real_estate: realEstateSchema,
  about: aboutSchema,
  guest: guestSchema,
} as const satisfies Record<PageKey, z.ZodType>;

/** key → translatable leaf paths (with `[]` array wildcards) for the pipeline. */
export const translatablePathsByPage: Record<PageKey, string[]> = {
  home: translatablePaths(homeSchema),
  owners: translatablePaths(ownersSchema),
  real_estate: translatablePaths(realEstateSchema),
  about: translatablePaths(aboutSchema),
  guest: translatablePaths(guestSchema),
};

export {
  homeSchema,
  ownersSchema,
  realEstateSchema,
  aboutSchema,
  guestSchema,
};
export type { HomeContent } from "./home";
export type { OwnersContent } from "./owners";
export type { RealEstateContent } from "./real-estate";
export type { AboutContent } from "./about";
export type { GuestContent } from "./guest";
