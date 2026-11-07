"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AdminButton,
  AdminCard,
  AdminPageHeader,
  Field,
  FieldGrid,
  FormActions,
  TextInput,
} from "@slices/backoffice/contract";
import { deleteBlogCategory, saveBlogCategory } from "../actions";
import type { BlogCategoryEditData } from "../queries";

import { BLOG_REFERENCE_LOCALES } from "../../reference-locale-types";
import {
  categoryFormValues,
  categoryLocalePayload,
  type CategoryFormValues,
} from "./reference-locale-payload";

/** One shared category identity with a manually authored name per Blog locale. */
type FormState = CategoryFormValues;

export function BlogCategoryForm({
  initial,
}: {
  initial: BlogCategoryEditData | null;
}) {
  const t = useTranslations("blog");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const [pending, start] = useTransition();
  const fieldPrefix = useId();
  const [state, setState] = useState<FormState>(() =>
    categoryFormValues(initial),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const err = (key: string) => errors[key];

  function onSubmit() {
    if (pending) return;
    setBanner(null);
    setErrors({});
    start(async () => {
      const result = await saveBlogCategory(
        categoryLocalePayload(state, initial?.id),
      );
      if (result.ok) {
        if (!initial) {
          router.push(`/admin/blog-categories/${result.id}`);
          return;
        }
        setBanner(tb("actions.saved"));
        router.refresh();
        return;
      }
      if (result.error === "validation") {
        setErrors(result.fieldErrors);
        setBanner(tb("actions.saveError"));
      } else {
        setBanner(tb("actions.saveError"));
      }
    });
  }

  function onDelete() {
    if (!initial || pending) return;
    if (!window.confirm(tb("actions.confirmDelete"))) return;
    start(async () => {
      const result = await deleteBlogCategory(initial.id);
      if (result.ok) {
        router.push("/admin/blog-categories");
        return;
      }
      setBanner(
        result.error === "in_use"
          ? t("admin.cat.inUse")
          : tb("actions.saveError"),
      );
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={
          initial
            ? state.name || t("admin.cat.editTitle")
            : t("admin.cat.newTitle")
        }
        description={t("admin.cat.formSubtitle")}
        actions={
          <Link
            href="/admin/blog-categories"
            className="text-sm text-ink-soft hover:text-ink"
          >
            ← {t("admin.cat.backToList")}
          </Link>
        }
      />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">
          {banner}
        </p>
      ) : null}

      <AdminCard title={t("admin.cat.sections.details")}>
        <fieldset disabled={pending} className="min-w-0 space-y-4">
          {BLOG_REFERENCE_LOCALES.map((locale) => {
            const field = locale === "en" ? "name" : `translations.${locale}`;
            return (
              <Field
                key={locale}
                label={t("admin.referenceLocales.name", {
                  locale: locale.toUpperCase(),
                })}
                htmlFor={`${fieldPrefix}-name-${locale}`}
                required={locale === "en"}
                error={err(field)}
                hint={
                  locale === "en"
                    ? undefined
                    : t("admin.referenceLocales.fallbackHint")
                }
              >
                <TextInput
                  id={`${fieldPrefix}-name-${locale}`}
                  maxLength={80}
                  value={
                    locale === "en" ? state.name : state.translations[locale]
                  }
                  aria-invalid={Boolean(err(field))}
                  onChange={(event) =>
                    locale === "en"
                      ? set("name", event.target.value)
                      : setState((previous) => ({
                          ...previous,
                          translations: {
                            ...previous.translations,
                            [locale]: event.target.value,
                          },
                        }))
                  }
                />
              </Field>
            );
          })}
          <FieldGrid>
            <Field
              label={t("admin.cat.fields.slug")}
              htmlFor={`${fieldPrefix}-slug`}
              required
              error={err("slug")}
            >
              <TextInput
                id={`${fieldPrefix}-slug`}
                aria-invalid={Boolean(err("slug"))}
                value={state.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
            </Field>
            <Field
              label={t("admin.cat.fields.color")}
              htmlFor={`${fieldPrefix}-color`}
              hint={t("admin.cat.fields.colorHint")}
              error={err("color")}
            >
              <TextInput
                id={`${fieldPrefix}-color`}
                aria-invalid={Boolean(err("color"))}
                value={state.color}
                onChange={(e) => set("color", e.target.value)}
              />
            </Field>
            <Field
              label={t("admin.cat.fields.position")}
              htmlFor={`${fieldPrefix}-position`}
              hint={t("admin.cat.fields.positionHint")}
            >
              <TextInput
                id={`${fieldPrefix}-position`}
                aria-invalid={Boolean(err("position"))}
                type="number"
                value={state.position}
                onChange={(e) => set("position", e.target.value)}
              />
            </Field>
          </FieldGrid>
        </fieldset>
      </AdminCard>

      <FormActions>
        {initial ? (
          <AdminButton variant="danger" onClick={onDelete} disabled={pending}>
            {tb("actions.delete")}
          </AdminButton>
        ) : null}
        <AdminButton
          variant="ghost"
          onClick={() => router.push("/admin/blog-categories")}
          disabled={pending}
        >
          {tb("actions.cancel")}
        </AdminButton>
        <AdminButton variant="primary" onClick={onSubmit} disabled={pending}>
          {pending ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
