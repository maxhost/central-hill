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
  type AdminMediaPreview,
  MediaField,
  OwnerMediaAltFields,
  Select,
  TextArea,
  TextInput,
  useMediaQueue,
} from "@slices/backoffice/contract";
import { deleteAuthor, saveAuthor } from "../actions";
import type { AuthorEditData } from "../queries";

import { BLOG_REFERENCE_LOCALES } from "../../reference-locale-types";
import {
  authorFormValues,
  authorLocalePayload,
  type AuthorFormValues,
} from "./reference-locale-payload";

/** Single author identity with manual name/bio fields for every Blog locale. */
type FormState = AuthorFormValues;
type Status = FormState["status"];
const STATUSES: Status[] = ["draft", "published", "archived"];

export function AuthorForm({
  initial,
  previews,
}: {
  initial: AuthorEditData | null;
  previews: Record<string, AdminMediaPreview>;
}) {
  const t = useTranslations("blog");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [flushing, setFlushing] = useState(false);
  const fieldPrefix = useId();
  const queue = useMediaQueue();
  // A pick still being reserved isn't in the form's value yet — Save waits for it.
  const preparing = queue.isPreparing;
  const busy = pending || preparing || flushing;
  const [state, setState] = useState<FormState>(() =>
    authorFormValues(initial),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const err = (key: string) => errors[key];

  function onSubmit() {
    if (busy) return;
    setBanner(null);
    setErrors({});
    void (async () => {
      // Uploads run OUTSIDE the transition on purpose: `startTransition` marks every
      // update in its scope as low priority, so the queue's progress modal would not
      // paint until the transition it lives in had already finished (ADR 0030).
      setFlushing(true);
      try {
        if (!(await queue.flush())) return;
      } finally {
        setFlushing(false);
      }
      start(async () => {
        const result = await saveAuthor(
          authorLocalePayload(state, initial?.id),
        );
        if (result.ok) {
          if (!initial) {
            router.push(`/admin/authors/${result.id}`);
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
    })();
  }

  function onDelete() {
    if (!initial || busy) return;
    if (!window.confirm(tb("actions.confirmDelete"))) return;
    start(async () => {
      const result = await deleteAuthor(initial.id);
      if (result.ok) {
        router.push("/admin/authors");
        return;
      }
      setBanner(
        result.error === "in_use"
          ? t("admin.author.inUse")
          : tb("actions.saveError"),
      );
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={
          initial
            ? state.name || t("admin.author.editTitle")
            : t("admin.author.newTitle")
        }
        description={t("admin.author.formSubtitle")}
        actions={
          <Link
            href="/admin/authors"
            className="text-sm text-ink-soft hover:text-ink"
          >
            ← {t("admin.author.backToList")}
          </Link>
        }
      />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">
          {banner}
        </p>
      ) : null}

      <AdminCard title={t("admin.author.sections.details")}>
        <fieldset disabled={busy} className="min-w-0 space-y-5">
          {BLOG_REFERENCE_LOCALES.map((locale) => {
            const nameField =
              locale === "en" ? "name" : `translations.${locale}.name`;
            const bioField =
              locale === "en" ? "bio" : `translations.${locale}.bio`;
            const values = locale === "en" ? state : state.translations[locale];
            const change = (field: "name" | "bio", value: string) => {
              if (locale === "en") set(field, value);
              else
                setState((previous) => ({
                  ...previous,
                  translations: {
                    ...previous.translations,
                    [locale]: {
                      ...previous.translations[locale],
                      [field]: value,
                    },
                  },
                }));
            };
            return (
              <div key={locale} className="space-y-4">
                <Field
                  label={t("admin.referenceLocales.name", {
                    locale: locale.toUpperCase(),
                  })}
                  htmlFor={`${fieldPrefix}-name-${locale}`}
                  required={locale === "en"}
                  error={err(nameField)}
                  hint={
                    locale === "en"
                      ? undefined
                      : t("admin.referenceLocales.fallbackHint")
                  }
                >
                  <TextInput
                    id={`${fieldPrefix}-name-${locale}`}
                    maxLength={120}
                    value={values.name}
                    aria-invalid={Boolean(err(nameField))}
                    onChange={(event) => change("name", event.target.value)}
                  />
                </Field>
                <Field
                  label={t("admin.referenceLocales.bio", {
                    locale: locale.toUpperCase(),
                  })}
                  htmlFor={`${fieldPrefix}-bio-${locale}`}
                  error={err(bioField)}
                  hint={
                    locale === "en"
                      ? undefined
                      : t("admin.referenceLocales.fallbackHint")
                  }
                >
                  <TextArea
                    id={`${fieldPrefix}-bio-${locale}`}
                    rows={4}
                    maxLength={1000}
                    value={values.bio}
                    aria-invalid={Boolean(err(bioField))}
                    onChange={(event) => change("bio", event.target.value)}
                  />
                </Field>
              </div>
            );
          })}
          <FieldGrid>
            <Field
              label={t("admin.author.fields.slug")}
              htmlFor={`${fieldPrefix}-slug`}
              required
              error={err("slug")}
            >
              <TextInput
                id={`${fieldPrefix}-slug`}
                value={state.slug}
                aria-invalid={Boolean(err("slug"))}
                onChange={(event) => set("slug", event.target.value)}
              />
            </Field>
            <Field
              label={t("admin.author.fields.status")}
              htmlFor={`${fieldPrefix}-status`}
            >
              <Select
                id={`${fieldPrefix}-status`}
                value={state.status}
                onChange={(event) =>
                  set("status", event.target.value as Status)
                }
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`admin.status.${status}`)}
                  </option>
                ))}
              </Select>
            </Field>
          </FieldGrid>
        </fieldset>
      </AdminCard>

      <AdminCard title={t("admin.author.sections.avatar")}>
        <fieldset disabled={busy} className="min-w-0">
          <Field label={t("admin.author.fields.avatar")}>
            <MediaField
              value={state.avatar_media_id || null}
              preview={previews[state.avatar_media_id] ?? null}
              onChange={(id) => setState(previous => ({ ...previous,
                avatar_media_id: id ?? "",
                avatar_alts: id === initial?.avatar_media_id ? initial?.avatar_alts ?? { en: "", es: "", pt: "", fr: "" } : { en: "", es: "", pt: "", fr: "" },
              }))}
            />
          </Field>
          <OwnerMediaAltFields mediaId={state.avatar_media_id || null} value={state.avatar_alts} onChange={value => set("avatar_alts", value)} disabled={busy} />
        </fieldset>
      </AdminCard>

      <FormActions>
        {initial ? (
          <AdminButton variant="danger" onClick={onDelete} disabled={busy}>
            {tb("actions.delete")}
          </AdminButton>
        ) : null}
        <AdminButton
          variant="ghost"
          onClick={() => router.push("/admin/authors")}
          disabled={busy}
        >
          {tb("actions.cancel")}
        </AdminButton>
        {preparing ? (
          <p role="status" className="text-xs text-ink-soft">
            {tb("media.waitForMedia")}
          </p>
        ) : null}
        <AdminButton variant="primary" onClick={onSubmit} disabled={busy}>
          {pending ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
