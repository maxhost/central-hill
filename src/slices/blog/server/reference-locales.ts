import "server-only";
import {
  deleteTranslation,
  loadContent,
  setSourceContent,
  setTargetTranslation,
  type TranslationRow,
} from "@core/i18n";
import type { Locale } from "@core/db/columns";
import type {
  AuthorSaveInput,
  BlogCategorySaveInput,
} from "../admin/validation";
import {
  BLOG_REFERENCE_LOCALES,
  BLOG_REFERENCE_TARGET_LOCALES,
  type AuthorTranslations,
  type BlogCategoryTranslations,
  type BlogReferenceOption,
} from "../reference-locale-types";

type ReferenceTranslation = Pick<TranslationRow, "locale" | "field" | "value">;

/** Raw authored values, including pending rows; never materialize EN fallbacks. */
export function rawBlogCategoryTranslations(
  rows: readonly ReferenceTranslation[],
): BlogCategoryTranslations {
  return Object.fromEntries(
    BLOG_REFERENCE_TARGET_LOCALES.map((locale) => [
      locale,
      rows.find((row) => row.locale === locale && row.field === "name")
        ?.value ?? "",
    ]),
  ) as BlogCategoryTranslations;
}

export function rawAuthorTranslations(
  rows: readonly ReferenceTranslation[],
): AuthorTranslations {
  return Object.fromEntries(
    BLOG_REFERENCE_TARGET_LOCALES.map((locale) => [
      locale,
      {
        name:
          rows.find((row) => row.locale === locale && row.field === "name")
            ?.value ?? "",
        bio:
          rows.find((row) => row.locale === locale && row.field === "bio")
            ?.value ?? null,
      },
    ]),
  ) as AuthorTranslations;
}

/** Validated, staff-gated callers retain the existing sequential write seam. */
export async function saveBlogCategoryLabels(
  id: string,
  input: Pick<BlogCategorySaveInput, "name" | "translations">,
  updatedBy?: string,
): Promise<void> {
  await setSourceContent(
    "blog_category",
    id,
    { name: input.name },
    { updatedBy },
  );
  if (!input.translations) return;
  for (const locale of BLOG_REFERENCE_TARGET_LOCALES) {
    const value = input.translations[locale].trim();
    if (value)
      await setTargetTranslation("blog_category", id, "name", locale, value, {
        sourceValue: input.name,
        state: "approved",
        updatedBy,
      });
    else await deleteTranslation("blog_category", id, "name", locale);
  }
}

export async function saveAuthorLabels(
  id: string,
  input: Pick<AuthorSaveInput, "name" | "bio" | "translations">,
  updatedBy?: string,
): Promise<void> {
  await setSourceContent(
    "author",
    id,
    { name: input.name, bio: input.bio },
    { updatedBy, preserveTargetsOnClear: true },
  );
  if (!input.translations) return;
  for (const locale of BLOG_REFERENCE_TARGET_LOCALES) {
    const target = input.translations[locale];
    for (const field of ["name", "bio"] as const) {
      const value = target[field]?.trim();
      if (value)
        await setTargetTranslation("author", id, field, locale, value, {
          sourceValue: input[field] ?? "",
          state: "approved",
          updatedBy,
        });
      else await deleteTranslation("author", id, field, locale);
    }
  }
}

/** Approved labels follow the Post's locale; IDs/name retain compatibility. */
export async function loadBlogReferenceOptions(
  type: "author" | "blog_category",
  rows: readonly { id: string; slug: string }[],
): Promise<BlogReferenceOption[]> {
  if (!rows.length) return [];
  const contents = await Promise.all(
    BLOG_REFERENCE_LOCALES.map((locale) =>
      loadContent(
        rows.map((row) => ({ type, id: row.id })),
        locale,
      ),
    ),
  );
  return rows.map((row) => {
    const name = contents[0]!.get(type, row.id, "name")?.trim() || row.slug;
    return {
      id: row.id,
      name,
      labels: Object.fromEntries(
        BLOG_REFERENCE_LOCALES.map((locale, index) => [
          locale,
          contents[index]!.get(type, row.id, "name")?.trim() || name,
        ]),
      ) as Record<Locale, string>,
    };
  });
}
