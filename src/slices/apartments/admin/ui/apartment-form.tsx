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
import { deleteApartment, saveApartment } from "../actions";
import type { ApartmentEditData } from "../queries";

/**
 * Apartment create/edit form (S12) — one client island for `/admin/apartments/new`
 * and `/admin/apartments/[id]`. Posts through `saveApartment`; building selector is
 * fed from the buildings contract. Source [T] text authored in English.
 */

type Status = "draft" | "published" | "archived";

interface FormState {
  slug: string;
  status: Status;
  position: string;
  building_id: string;
  badge: string;
  bedrooms: string;
  bathrooms: string;
  max_guests: string;
  beds_count: string;
  size_m2: string;
  floor: string;
  cover_media_id: string;
  og_image_media_id: string;
  avantio_id: string;
  avantio_url: string;
  name: string;
  description: string;
  meta_title: string;
  meta_description: string;
  gallery: string[];
}

const STATUSES: Status[] = ["draft", "published", "archived"];

function initialState(data: ApartmentEditData | null, defaultBuildingId: string): FormState {
  return {
    slug: data?.slug ?? "",
    status: data?.status ?? "draft",
    position: String(data?.position ?? 0),
    building_id: data?.building_id ?? defaultBuildingId,
    badge: data?.badge ?? "",
    bedrooms: String(data?.bedrooms ?? 0),
    bathrooms: String(data?.bathrooms ?? 0),
    max_guests: String(data?.max_guests ?? 1),
    beds_count: String(data?.beds_count ?? 0),
    size_m2: data?.size_m2 != null ? String(data.size_m2) : "",
    floor: data?.floor != null ? String(data.floor) : "",
    cover_media_id: data?.cover_media_id ?? "",
    og_image_media_id: data?.og_image_media_id ?? "",
    avantio_id: data?.avantio_id ?? "",
    avantio_url: data?.avantio_url ?? "",
    name: data?.name ?? "",
    description: data?.description ?? "",
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
    building_id: s.building_id,
    badge: orNull(s.badge),
    bedrooms: intOr(s.bedrooms, 0),
    bathrooms: intOr(s.bathrooms, 0),
    max_guests: intOr(s.max_guests, 0),
    beds_count: intOr(s.beds_count, 0),
    size_m2: intOrNull(s.size_m2),
    floor: intOrNull(s.floor),
    cover_media_id: s.cover_media_id || null,
    og_image_media_id: orNull(s.og_image_media_id),
    avantio_id: s.avantio_id.trim(),
    avantio_url: s.avantio_url.trim(),
    name: s.name.trim(),
    description: s.description.trim(),
    meta_title: orNull(s.meta_title),
    meta_description: orNull(s.meta_description),
    gallery: s.gallery,
  };
}

export function ApartmentForm({
  initial,
  previews,
  buildings,
}: {
  initial: ApartmentEditData | null;
  previews: Record<string, AdminMediaPreview>;
  buildings: { id: string; name: string }[];
}) {
  const t = useTranslations("apartments");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>(() =>
    initialState(initial, buildings[0]?.id ?? ""),
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
      const result = await saveApartment(buildPayload(state, initial?.id));
      if (result.ok) {
        if (!initial) {
          router.push(`/admin/apartments/${result.id}`);
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
      const result = await deleteApartment(initial.id);
      if (result.ok) router.push("/admin/apartments");
      else setBanner(tb("actions.saveError"));
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={initial ? state.name || t("admin.editTitle") : t("admin.newTitle")}
        description={t("admin.formSubtitle")}
        actions={
          <Link href="/admin/apartments" className="text-sm text-ink-soft hover:text-ink">
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
          <Field label={t("admin.fields.building")} required error={err("building_id")}>
            <Select value={state.building_id} onChange={(e) => set("building_id", e.target.value)}>
              <option value="">{t("admin.fields.choose")}</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("admin.fields.name")} required error={err("name")}>
            <TextInput value={state.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field
            label={t("admin.fields.slug")}
            required
            hint={t("admin.fields.slugHint")}
            error={err("slug")}
          >
            <TextInput value={state.slug} onChange={(e) => set("slug", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.badge")} hint={t("admin.fields.badgeHint")} error={err("badge")}>
            <TextInput value={state.badge} onChange={(e) => set("badge", e.target.value)} />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.sections.specs")}>
        <FieldGrid className="lg:grid-cols-3">
          <Field label={t("admin.fields.bedrooms")} error={err("bedrooms")}>
            <TextInput type="number" value={state.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.bathrooms")} error={err("bathrooms")}>
            <TextInput type="number" value={state.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.maxGuests")} required error={err("max_guests")}>
            <TextInput type="number" value={state.max_guests} onChange={(e) => set("max_guests", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.bedsCount")} error={err("beds_count")}>
            <TextInput type="number" value={state.beds_count} onChange={(e) => set("beds_count", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.sizeM2")} error={err("size_m2")}>
            <TextInput type="number" value={state.size_m2} onChange={(e) => set("size_m2", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.floor")} error={err("floor")}>
            <TextInput type="number" value={state.floor} onChange={(e) => set("floor", e.target.value)} />
          </Field>
        </FieldGrid>
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

      <AdminCard title={t("admin.sections.description")}>
        <Field label={t("admin.fields.description")} required error={err("description")}>
          <TextArea
            rows={6}
            value={state.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
      </AdminCard>

      <AdminCard title={t("admin.sections.booking")}>
        <FieldGrid>
          <Field label={t("admin.fields.avantioId")} required error={err("avantio_id")}>
            <TextInput value={state.avantio_id} onChange={(e) => set("avantio_id", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.avantioUrl")} required error={err("avantio_url")}>
            <TextInput value={state.avantio_url} onChange={(e) => set("avantio_url", e.target.value)} />
          </Field>
        </FieldGrid>
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
        <AdminButton variant="ghost" onClick={() => router.push("/admin/apartments")} disabled={pending}>
          {tb("actions.cancel")}
        </AdminButton>
        <AdminButton variant="primary" onClick={onSubmit} disabled={pending}>
          {pending ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
