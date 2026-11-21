/**
 * Registry of the editable fixed pages (ADR 0012): the five marketing pages plus `blog` and
 * `guides`, which hold the copy those sections show outside their posts/guides, and `buildings` (the
 * listing page, spec buildings-admin-editor). Maps each `page_content.key`
 * to its fixed Zod schema, and derives the translatable leaf paths the translation
 * pipeline must extract per page.
 */
import { z } from "zod";
import { legalPageDraftSchema } from "../legal-page-content";
import { translatablePaths } from "@core/validation/primitives";
import { homeSchema } from "./home";
import { ownersSchema } from "./owners";
import { realEstateSchema } from "./real-estate";
import { aboutSchema } from "./about";
import { guestSchema } from "./guest";
import { blogSchema } from "./blog";
import { guidesSchema } from "./guides";
import { servicesSchema } from "./services";
import { buildingsSchema } from "./buildings";

/** `page_content.key` enum — one row per key. */
export const pageKey = z.enum(["home", "owners", "real_estate", "about", "guest", "blog", "guides", "buildings", "services", "privacy_policy", "cookies_policy", "complaints_book"]);
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
  buildings: buildingsSchema,
  services: servicesSchema,
  privacy_policy: legalPageDraftSchema,
  cookies_policy: legalPageDraftSchema,
  complaints_book: legalPageDraftSchema,
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
  buildings: translatablePaths(buildingsSchema),
  services: translatablePaths(servicesSchema),
  privacy_policy: ["title", "body", "seo.meta_title", "seo.meta_description"],
  cookies_policy: ["title", "body", "seo.meta_title", "seo.meta_description"],
  complaints_book: ["title", "body", "seo.meta_title", "seo.meta_description"],
};

export {
  homeSchema,
  ownersSchema,
  realEstateSchema,
  aboutSchema,
  guestSchema,
  blogSchema,
  guidesSchema,
  buildingsSchema,
  servicesSchema,
};
export type { HomeContent } from "./home";
export type { OwnersContent } from "./owners";
export type { RealEstateContent } from "./real-estate";
export type { AboutContent } from "./about";
export type { GuestContent } from "./guest";
export type { BlogContent } from "./blog";
export type { GuidesContent } from "./guides";
export type { BuildingsContent } from "./buildings";

export type { ServicesContent } from "./services";
