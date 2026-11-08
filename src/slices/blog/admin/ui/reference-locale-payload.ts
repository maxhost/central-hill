import type { OwnerMediaAlts } from "@core/media/owner-alt";
import {
  BLOG_REFERENCE_TARGET_LOCALES,
  type AuthorTranslations,
  type BlogCategoryTranslations,
  type BlogReferenceTargetLocale,
} from "../../reference-locale-types";
import type { AuthorEditData, BlogCategoryEditData } from "../queries";
import type { AuthorSaveInput, BlogCategorySaveInput } from "../validation";

export interface AuthorFormValues {
  slug: string;
  status: AuthorEditData["status"];
  avatar_media_id: string;
  avatar_alts: OwnerMediaAlts;
  name: string;
  bio: string;
  translations: Record<
    BlogReferenceTargetLocale,
    { name: string; bio: string }
  >;
}
export interface CategoryFormValues {
  slug: string;
  color: string;
  position: string;
  name: string;
  translations: BlogCategoryTranslations;
}
type AuthorInitial = Omit<AuthorEditData, "translations"> & {
  translations?: Partial<AuthorTranslations>;
};
type CategoryInitial = Omit<BlogCategoryEditData, "translations"> & {
  translations?: Partial<BlogCategoryTranslations>;
};

/** Authored targets stay raw; missing values remain empty for English fallback. */
export function authorFormValues(data: AuthorInitial | null): AuthorFormValues {
  return {
    slug: data?.slug ?? "",
    status: data?.status ?? "draft",
    avatar_media_id: data?.avatar_media_id ?? "",
    avatar_alts: data?.avatar_alts ?? { en: "", es: "", pt: "", fr: "" },
    name: data?.name ?? "",
    bio: data?.bio ?? "",
    translations: Object.fromEntries(
      BLOG_REFERENCE_TARGET_LOCALES.map((locale) => [
        locale,
        {
          name: data?.translations?.[locale]?.name ?? "",
          bio: data?.translations?.[locale]?.bio ?? "",
        },
      ]),
    ) as AuthorFormValues["translations"],
  };
}
export function categoryFormValues(
  data: CategoryInitial | null,
): CategoryFormValues {
  return {
    slug: data?.slug ?? "",
    color: data?.color ?? "#8a8178",
    position: String(data?.position ?? 0),
    name: data?.name ?? "",
    translations: Object.fromEntries(
      BLOG_REFERENCE_TARGET_LOCALES.map((locale) => [
        locale,
        data?.translations?.[locale] ?? "",
      ]),
    ) as BlogCategoryTranslations,
  };
}
const orNull = (value: string) => value.trim() || null;

/** One form Save explicitly authors every target field, including clears. */
export function authorLocalePayload(
  values: AuthorFormValues,
  id?: string,
): AuthorSaveInput {
  return {
    id,
    slug: values.slug.trim(),
    status: values.status,
    avatar_media_id: values.avatar_media_id || null,
    avatar_alts: values.avatar_alts,
    name: values.name.trim(),
    bio: orNull(values.bio),
    translations: Object.fromEntries(
      BLOG_REFERENCE_TARGET_LOCALES.map((locale) => [
        locale,
        {
          name: values.translations[locale].name.trim(),
          bio: orNull(values.translations[locale].bio),
        },
      ]),
    ) as AuthorTranslations,
  };
}
export function categoryLocalePayload(
  values: CategoryFormValues,
  id?: string,
): BlogCategorySaveInput {
  const position = Number.parseInt(values.position, 10);
  return {
    id,
    slug: values.slug.trim(),
    color: values.color.trim(),
    position: Number.isFinite(position) ? position : 0,
    name: values.name.trim(),
    translations: Object.fromEntries(
      BLOG_REFERENCE_TARGET_LOCALES.map((locale) => [
        locale,
        values.translations[locale].trim(),
      ]),
    ) as BlogCategoryTranslations,
  };
}
