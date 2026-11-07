"use client";

import { useId, useRef, useState, useTransition } from "react";
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
  Select,
  TextArea,
  TextInput,
} from "@slices/backoffice/contract";
import { deleteTestimonial, saveTestimonial } from "../actions";
import type { TestimonialEditData } from "../queries";
import {
  TESTIMONIAL_QUOTE_LOCALES,
  type TestimonialQuoteTranslations,
} from "../../quote-locale-types";

/**
 * Testimonial create/edit form (S12) — one client island for
 * `/admin/testimonials/new` and `/admin/testimonials/[id]`. Posts through
 * `saveTestimonial`; four quote inputs share one Save and testimonial identity.
 */

type Status = "draft" | "published" | "archived";
type Audience = "owner" | "guest";

interface FormState {
  audience: Audience;
  rating: string;
  author_name: string;
  author_country: string;
  property_location: string;
  position: string;
  status: Status;
  quote: string;
  translations: TestimonialQuoteTranslations;
}

const STATUSES: Status[] = ["draft", "published", "archived"];
const AUDIENCES: Audience[] = ["owner", "guest"];
const RATINGS = [5, 4, 3, 2, 1];

function initialState(data: TestimonialEditData | null): FormState {
  return {
    audience: data?.audience ?? "guest",
    rating: String(data?.rating ?? 5),
    author_name: data?.author_name ?? "",
    author_country: data?.author_country ?? "",
    property_location: data?.property_location ?? "",
    position: String(data?.position ?? 0),
    status: data?.status ?? "draft",
    quote: data?.quote ?? "",
    translations: {
      es: data?.translations?.es ?? "",
      pt: data?.translations?.pt ?? "",
      fr: data?.translations?.fr ?? "",
    },
  };
}

function buildPayload(s: FormState, id: string | undefined) {
  const orNull = (v: string) => (v.trim() === "" ? null : v.trim());
  const intOr = (v: string, fallback: number) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    id,
    audience: s.audience,
    rating: intOr(s.rating, 5),
    author_name: s.author_name.trim(),
    author_country: s.author_country.trim(),
    property_location: orNull(s.property_location),
    position: intOr(s.position, 0),
    status: s.status,
    quote: s.quote.trim(),
    translations: {
      es: s.translations.es.trim(),
      pt: s.translations.pt.trim(),
      fr: s.translations.fr.trim(),
    },
  };
}

export function TestimonialForm({
  initial,
}: {
  initial: TestimonialEditData | null;
}) {
  const t = useTranslations("testimonials");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const [pending, start] = useTransition();
  const quoteFieldPrefix = useId();
  const actionLock = useRef(false);
  const [state, setState] = useState<FormState>(() => initialState(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const err = (key: string) => errors[key];

  function onSubmit() {
    if (pending || actionLock.current) return;
    actionLock.current = true;
    setBanner(null);
    setErrors({});
    start(async () => {
      try {
        const result = await saveTestimonial(buildPayload(state, initial?.id));
        if (result.ok) {
          if (!initial) {
            router.push(`/admin/testimonials/${result.id}`);
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
      } catch {
        setBanner(tb("actions.saveError"));
      } finally {
        actionLock.current = false;
      }
    });
  }

  function onDelete() {
    if (!initial || pending || actionLock.current) return;
    if (!window.confirm(tb("actions.confirmDelete"))) return;
    actionLock.current = true;
    start(async () => {
      try {
        const result = await deleteTestimonial(initial.id);
        if (result.ok) router.push("/admin/testimonials");
        else setBanner(tb("actions.saveError"));
      } catch {
        setBanner(tb("actions.saveError"));
      } finally {
        actionLock.current = false;
      }
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={
          initial
            ? state.author_name || t("admin.editTitle")
            : t("admin.newTitle")
        }
        description={t("admin.formSubtitle")}
        actions={
          <Link
            href="/admin/testimonials"
            className="text-sm text-ink-soft hover:text-ink"
          >
            ← {t("admin.backToList")}
          </Link>
        }
      />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">
          {banner}
        </p>
      ) : null}

      <AdminCard title={t("admin.sections.classification")}>
        <FieldGrid>
          <Field label={t("admin.fields.audience")}>
            <Select
              disabled={pending}
              value={state.audience}
              onChange={(e) => set("audience", e.target.value as Audience)}
            >
              {AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {t(`admin.audience.${a}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("admin.fields.rating")}>
            <Select
              disabled={pending}
              value={state.rating}
              onChange={(e) => set("rating", e.target.value)}
            >
              {RATINGS.map((r) => (
                <option key={r} value={r}>
                  {"★".repeat(r)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("admin.fields.status")}>
            <Select
              disabled={pending}
              value={state.status}
              onChange={(e) => set("status", e.target.value as Status)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`admin.status.${s}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={t("admin.fields.position")}
            hint={t("admin.fields.positionHint")}
          >
            <TextInput
              disabled={pending}
              type="number"
              value={state.position}
              onChange={(e) => set("position", e.target.value)}
            />
          </Field>
        </FieldGrid>
      </AdminCard>

      <AdminCard title={t("admin.sections.author")}>
        <FieldGrid>
          <Field
            label={t("admin.fields.authorName")}
            required
            error={err("author_name")}
          >
            <TextInput
              disabled={pending}
              value={state.author_name}
              onChange={(e) => set("author_name", e.target.value)}
            />
          </Field>
          <Field
            label={t("admin.fields.authorCountry")}
            required
            error={err("author_country")}
          >
            <TextInput
              disabled={pending}
              value={state.author_country}
              onChange={(e) => set("author_country", e.target.value)}
            />
          </Field>
          <Field
            label={t("admin.fields.propertyLocation")}
            hint={t("admin.fields.propertyLocationHint")}
            error={err("property_location")}
          >
            <TextInput
              disabled={pending}
              value={state.property_location}
              onChange={(e) => set("property_location", e.target.value)}
            />
          </Field>
        </FieldGrid>
      </AdminCard>

      <AdminCard title={t("admin.sections.quote")}>
        <fieldset disabled={pending} className="min-w-0 space-y-4">
          {TESTIMONIAL_QUOTE_LOCALES.map((locale) => {
            const field = locale === "en" ? "quote" : `translations.${locale}`;
            const id = `${quoteFieldPrefix}-quote-${locale}`;
            return (
              <Field
                key={locale}
                label={t("admin.quoteLocales.label", {
                  locale: locale.toUpperCase(),
                })}
                htmlFor={id}
                required={locale === "en"}
                hint={
                  locale === "en"
                    ? undefined
                    : t("admin.quoteLocales.fallbackHint")
                }
                error={err(field)}
              >
                <TextArea
                  id={id}
                  rows={5}
                  maxLength={1000}
                  required={locale === "en"}
                  aria-invalid={Boolean(err(field))}
                  value={
                    locale === "en" ? state.quote : state.translations[locale]
                  }
                  onChange={(event) =>
                    locale === "en"
                      ? set("quote", event.target.value)
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
          onClick={() => router.push("/admin/testimonials")}
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
