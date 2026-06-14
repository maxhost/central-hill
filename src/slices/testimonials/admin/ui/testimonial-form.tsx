"use client";

import { useState, useTransition } from "react";
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

/**
 * Testimonial create/edit form (S12) — one client island for
 * `/admin/testimonials/new` and `/admin/testimonials/[id]`. Posts through
 * `saveTestimonial`; the [T] `quote` is authored in English (source locale).
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
  };
}

export function TestimonialForm({ initial }: { initial: TestimonialEditData | null }) {
  const t = useTranslations("testimonials");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>(() => initialState(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const err = (key: string) => errors[key];

  function onSubmit() {
    setBanner(null);
    setErrors({});
    start(async () => {
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
    });
  }

  function onDelete() {
    if (!initial) return;
    if (!window.confirm(tb("actions.confirmDelete"))) return;
    start(async () => {
      const result = await deleteTestimonial(initial.id);
      if (result.ok) router.push("/admin/testimonials");
      else setBanner(tb("actions.saveError"));
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={initial ? state.author_name || t("admin.editTitle") : t("admin.newTitle")}
        description={t("admin.formSubtitle")}
        actions={
          <Link href="/admin/testimonials" className="text-sm text-ink-soft hover:text-ink">
            ← {t("admin.backToList")}
          </Link>
        }
      />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">{banner}</p>
      ) : null}

      <AdminCard title={t("admin.sections.classification")}>
        <FieldGrid>
          <Field label={t("admin.fields.audience")}>
            <Select value={state.audience} onChange={(e) => set("audience", e.target.value as Audience)}>
              {AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {t(`admin.audience.${a}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("admin.fields.rating")}>
            <Select value={state.rating} onChange={(e) => set("rating", e.target.value)}>
              {RATINGS.map((r) => (
                <option key={r} value={r}>
                  {"★".repeat(r)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("admin.fields.status")}>
            <Select value={state.status} onChange={(e) => set("status", e.target.value as Status)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`admin.status.${s}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("admin.fields.position")} hint={t("admin.fields.positionHint")}>
            <TextInput
              type="number"
              value={state.position}
              onChange={(e) => set("position", e.target.value)}
            />
          </Field>
        </FieldGrid>
      </AdminCard>

      <AdminCard title={t("admin.sections.author")}>
        <FieldGrid>
          <Field label={t("admin.fields.authorName")} required error={err("author_name")}>
            <TextInput value={state.author_name} onChange={(e) => set("author_name", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.authorCountry")} required error={err("author_country")}>
            <TextInput
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
              value={state.property_location}
              onChange={(e) => set("property_location", e.target.value)}
            />
          </Field>
        </FieldGrid>
      </AdminCard>

      <AdminCard title={t("admin.sections.quote")}>
        <Field label={t("admin.fields.quote")} required error={err("quote")}>
          <TextArea rows={5} value={state.quote} onChange={(e) => set("quote", e.target.value)} />
        </Field>
      </AdminCard>

      <FormActions>
        {initial ? (
          <AdminButton variant="danger" onClick={onDelete} disabled={pending}>
            {tb("actions.delete")}
          </AdminButton>
        ) : null}
        <AdminButton variant="ghost" onClick={() => router.push("/admin/testimonials")} disabled={pending}>
          {tb("actions.cancel")}
        </AdminButton>
        <AdminButton variant="primary" onClick={onSubmit} disabled={pending}>
          {pending ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
