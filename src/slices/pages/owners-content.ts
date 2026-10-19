import { translatablePaths } from "@core/validation/primitives";
import { ownersSchema, type OwnersContent } from "./schemas/owners";
import { describe } from "./admin/form-model";
import type { PageEditorialDescriptor } from "./editorial-adapter-types";
import {
  normalizeEditorial,
  editorialIdentityErrors,
  editorialTextPaths,
  editorialTranslationField,
  retireEditorialIds,
} from "./editorial-identities";
export const OWNERS_LIST_PATHS = [
  "stats",
  "why.benefits",
  "services.benefits",
  "plans.tiers",
  "plans.tiers[].features",
  "plans.helpers",
  "journey.steps",
  "dashboard.benefits",
] as const;
/** Pure serializable descriptor, also safe for private renderer bindings. */
export const ownersDescriptor: PageEditorialDescriptor = {
  key: "owners",
  title: "Owners",
  publicPath: "/owners",
  rootNode: describe(ownersSchema),
  textPatterns: translatablePaths(ownersSchema),
  listPaths: [...OWNERS_LIST_PATHS],
  maxLocalMedia: 10,
  externalSections: ["testimonials", "faq"],
  mediaSlots: [
    { path: "hero.image_media_id", kind: "image" },
    { path: "services.image_media_id", kind: "mixed" },
    { path: "dashboard.image_media_id", kind: "mixed" },
    { path: "journey.steps[].image_media_id", kind: "image" },
    { path: "final_cta.image_media_id", kind: "image" },
  ],
};
export const normalizeOwners = (content: OwnersContent): OwnersContent =>
  normalizeEditorial(content, ownersDescriptor);
export const ownersIdentityErrors = (
  content: OwnersContent,
  previous?: OwnersContent,
) => editorialIdentityErrors(content, previous, ownersDescriptor);
export const retireOwnersIds = (
  content: OwnersContent,
  previous: OwnersContent,
): OwnersContent => retireEditorialIds(content, previous, ownersDescriptor);
export const ownersTextPaths = (content: OwnersContent) =>
  editorialTextPaths(content, ownersDescriptor);
export const ownersTranslationField = (content: OwnersContent, path: string) =>
  editorialTranslationField(content, path, ownersDescriptor);
/** Stock Journey photos remain attached to the original row after moving it. */
export function ownersFallbackIndex(
  content: OwnersContent,
  index: number,
): number {
  const id = content._list_ids?.["journey.steps"]?.[index] ?? `legacy_${index}`;
  return id.startsWith("legacy_") ? Number(id.slice(7)) : 0;
}
