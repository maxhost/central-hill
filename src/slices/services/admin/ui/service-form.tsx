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
  type AdminMediaPreview,
  MediaField,
  MediaGalleryField,
  Select,
  TextArea,
  TextInput,
} from "@slices/backoffice/contract";
import { deleteService, saveService } from "../actions";
import type { ServiceEditData } from "../queries";

/**
 * Service create/edit form (S12) — one client island for `/admin/services/new` and
 * `/admin/services/[id]`. Posts through `saveService`; the category selector is fed
 * from this slice's admin queries. Source [T] text is authored in English; the
 * booking CTA fields are gated by `booking_type`.
 */

type Status = "draft" | "published" | "archived";
type BookingType = "enquiry" | "external" | "none";

const STATUSES: Status[] = ["draft", "published", "archived"];
const BOOKING_TYPES: BookingType[] = ["none", "enquiry", "external"];

interface FormState {
  slug: string;
  status: Status;
  position: string;
  category_id: string;
  cover_media_id: string;
  og_image_media_id: string;
  price_from: string;
  booking_type: BookingType;
  cta_url: string;
  cta_label: string;
  duration_label: string;
  name: string;
  excerpt: string;
  body: string;
  meta_title: string;
  meta_description: string;
  gallery: string[];
}

function initialState(data: ServiceEditData | null, defaultCategoryId: string): FormState {
  return {
    slug: data?.slug ?? "",
    status: data?.status ?? "draft",
    position: String(data?.position ?? 0),
    category_id: data?.category_id ?? defaultCategoryId,
    cover_media_id: data?.cover_media_id ?? "",
    og_image_media_id: data?.og_image_media_id ?? "",
    price_from: data?.price_from != null ? String(data.price_from) : "",
    booking_type: data?.booking_type ?? "none",
    cta_url: data?.cta_url ?? "",
    cta_label: data?.cta_label ?? "",
    duration_label: data?.duration_label ?? "",
    name: data?.name ?? "",
    excerpt: data?.excerpt ?? "",
    body: data?.body ?? "",
    meta_title: data?.meta_title ?? "",
    meta_description: data?.meta_description ?? "",
    gallery: data?.gallery ?? [],
  };
}

function buildPayload(s: FormState, id: string | undefined) {
  const orNull = (v: string) => (v.trim() === "" ? null : v.trim());
  const intOr = (v: string, fallback: number) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  };
  const intOrNull = (v: string) => {
    if (v.trim() === "") return null;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };
  return {
    id,
    slug: s.slug.trim(),
    status: s.status,
    position: intOr(s.position, 0),
    category_id: s.category_id,
    cover_media_id: s.cover_media_id || null,
    og_image_media_id: orNull(s.og_image_media_id),
    price_from: intOrNull(s.price_from),
    booking_type: s.booking_type,
    cta_url: orNull(s.cta_url),
    cta_label: orNull(s.cta_label),
    duration_label: orNull(s.duration_label),
    name: s.name.trim(),
    excerpt: s.excerpt.trim(),
    body: s.body.trim(),
    meta_title: orNull(s.meta_title),
    meta_description: orNull(s.meta_description),
    gallery: s.gallery,
  };
}

export function ServiceForm({
  initial,
  previews,
  categories,
}: {
  initial: ServiceEditData | null;
  previews: Record<string, AdminMediaPreview>;
  categories: { id: string; name: string }[];
}) {
  const t = useTranslations("services");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>(() =>
    initialState(initial, categories[0]?.id ?? ""),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const err = (key: string) => errors[key];

  function onSubmit() {
    setBanner(null);
    if (!state.cover_media_id) {
      setErrors({ cover_media_id: t("admin.errors.coverRequired") });
      return;
    }
    setErrors({});
    start(async () => {
      const result = await saveService(buildPayload(state, initial?.id));
      if (result.ok) {
        if (!initial) {
          router.push(`/admin/services/${result.id}`);
          return;
        }
        setBanner(tb("actions.saved"));
        router.refresh();
        return;
      }
      if (result.error === "validation") {
        setErrors(result.fieldErrors);
        setBanner(tb("actions.saveError"));
      } else if (result.error === "slug_conflict") {
        setErrors({ slug: t("admin.errors.slugConflict") });
      } else {
        setBanner(tb("actions.saveError"));
      }
    });
  }

  function onDelete() {
    if (!initial) return;
    if (!window.confirm(tb("actions.confirmDelete"))) return;
    start(async () => {
      const result = await deleteService(initial.id);
      if (result.ok) router.push("/admin/services");
      else setBanner(tb("actions.saveError"));
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={initial ? state.name || t("admin.editTitle") : t("admin.newTitle")}
        description={t("admin.formSubtitle")}
        actions={
          <Link href="/admin/services" className="text-sm text-ink-soft hover:text-ink">
            ← {t("admin.backToList")}
          </Link>
        }
      />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">{banner}</p>
      ) : null}

      <AdminCard title={t("admin.sections.status")}>
        <FieldGrid>
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

      <AdminCard title={t("admin.sections.identity")}>
        <div className="space-y-4">
          <Field label={t("admin.fields.category")} required error={err("category_id")}>
            <Select value={state.category_id} onChange={(e) => set("category_id", e.target.value)}>
              <option value="">{t("admin.fields.choose")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("admin.fields.name")} required error={err("name")}>
            <TextInput value={state.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.slug")} required hint={t("admin.fields.slugHint")} error={err("slug")}>
            <TextInput value={state.slug} onChange={(e) => set("slug", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.excerpt")} required error={err("excerpt")}>
            <TextArea value={state.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.sections.media")}>
        <div className="space-y-5">
          <Field label={t("admin.fields.cover")} required error={err("cover_media_id")}>
            <MediaField
              value={state.cover_media_id || null}
              preview={previews[state.cover_media_id] ?? null}
              onChange={(id) => set("cover_media_id", id ?? "")}
            />
          </Field>
          <Field label={t("admin.fields.ogImage")} hint={t("admin.fields.ogImageHint")}>
            <MediaField
              value={state.og_image_media_id || null}
              preview={previews[state.og_image_media_id] ?? null}
              onChange={(id) => set("og_image_media_id", id ?? "")}
            />
          </Field>
          <Field label={t("admin.fields.gallery")}>
            <MediaGalleryField
              value={state.gallery}
              previews={previews}
              onChange={(ids) => set("gallery", ids)}
            />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.sections.body")}>
        <Field label={t("admin.fields.body")} required error={err("body")}>
          <TextArea rows={8} value={state.body} onChange={(e) => set("body", e.target.value)} />
        </Field>
      </AdminCard>

      <AdminCard title={t("admin.sections.booking")}>
        <div className="space-y-4">
          <FieldGrid>
            <Field label={t("admin.fields.priceFrom")} hint={t("admin.fields.priceFromHint")} error={err("price_from")}>
              <TextInput
                type="number"
                value={state.price_from}
                onChange={(e) => set("price_from", e.target.value)}
              />
            </Field>
            <Field label={t("admin.fields.durationLabel")} error={err("duration_label")}>
              <TextInput
                value={state.duration_label}
                onChange={(e) => set("duration_label", e.target.value)}
              />
            </Field>
            <Field label={t("admin.fields.bookingType")}>
              <Select
                value={state.booking_type}
                onChange={(e) => set("booking_type", e.target.value as BookingType)}
              >
                {BOOKING_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {t(`admin.bookingType.${b}`)}
                  </option>
                ))}
              </Select>
            </Field>
          </FieldGrid>
          {state.booking_type === "external" ? (
            <FieldGrid>
              <Field label={t("admin.fields.ctaLabel")} error={err("cta_label")}>
                <TextInput value={state.cta_label} onChange={(e) => set("cta_label", e.target.value)} />
              </Field>
              <Field label={t("admin.fields.ctaUrl")} error={err("cta_url")}>
                <TextInput value={state.cta_url} onChange={(e) => set("cta_url", e.target.value)} />
              </Field>
            </FieldGrid>
          ) : null}
        </div>
      </AdminCard>

      <AdminCard title={t("admin.sections.seo")}>
        <div className="space-y-4">
          <Field label={t("admin.fields.metaTitle")} error={err("meta_title")}>
            <TextInput value={state.meta_title} onChange={(e) => set("meta_title", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.metaDescription")} error={err("meta_description")}>
            <TextArea
              value={state.meta_description}
              onChange={(e) => set("meta_description", e.target.value)}
            />
          </Field>
        </div>
      </AdminCard>

      <FormActions>
        {initial ? (
          <AdminButton variant="danger" onClick={onDelete} disabled={pending}>
            {tb("actions.delete")}
          </AdminButton>
        ) : null}
        <AdminButton variant="ghost" onClick={() => router.push("/admin/services")} disabled={pending}>
          {tb("actions.cancel")}
        </AdminButton>
        <AdminButton variant="primary" onClick={onSubmit} disabled={pending}>
          {pending ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
