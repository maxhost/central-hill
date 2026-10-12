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
  Select,
  TextInput,
  useToast,
  useMediaQueue,
} from "@slices/backoffice/contract";
import { deleteApartment, saveApartment } from "../actions";
import type { ApartmentEditData } from "../queries";

/**
 * Apartment create/edit form (S12) — one client island for
 * `/admin/buildings/[id]/apartments/new` and `/admin/buildings/[id]/apartments/[aptId]`,
 * rendered inside the building workspace (spec building-detail-admin-editor S2). Posts
 * through `saveApartment`. Source [T] text authored in English.
 *
 * The building is fixed by the route (`buildingId`, D6 — no selector) and the order is
 * changed with ↑ / ↓ in the Apartments tab, so there is no position field either.
 * Fields: status · name · badge · bedrooms / guests / beds / size (m²) · cover
 * (optional → placeholder) · Avantio link. The slug is auto-generated from the name
 * server-side.
 * The remaining DB columns (bathrooms, floor, gallery, description, OG, SEO) stay
 * nullable but are no longer authored here.
 */

type Status = "draft" | "published" | "archived";

interface FormState {
  status: Status;
  name: string;
  badge: string;
  bedrooms: string;
  max_guests: string;
  beds_count: string;
  size_m2: string;
  cover_media_id: string;
  avantio_id: string;
  avantio_url: string;
}

const STATUSES: Status[] = ["draft", "published", "archived"];

function initialState(data: ApartmentEditData | null): FormState {
  return {
    status: data?.status ?? "draft",
    name: data?.name ?? "",
    badge: data?.badge ?? "",
    bedrooms: String(data?.bedrooms ?? 0),
    max_guests: String(data?.max_guests ?? 1),
    beds_count: String(data?.beds_count ?? 0),
    size_m2: data?.size_m2 != null ? String(data.size_m2) : "",
    cover_media_id: data?.cover_media_id ?? "",
    avantio_id: data?.avantio_id ?? "",
    avantio_url: data?.avantio_url ?? "",
  };
}

function buildPayload(s: FormState, id: string | undefined, buildingId: string) {
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
    status: s.status,
    building_id: buildingId,
    name: s.name.trim(),
    badge: orNull(s.badge),
    bedrooms: intOr(s.bedrooms, 0),
    max_guests: intOr(s.max_guests, 1),
    beds_count: intOr(s.beds_count, 0),
    size_m2: intOrNull(s.size_m2),
    cover_media_id: s.cover_media_id || null,
    avantio_id: orNull(s.avantio_id),
    avantio_url: orNull(s.avantio_url),
  };
}

export function ApartmentForm({
  initial,
  previews,
  buildingId,
}: {
  initial: ApartmentEditData | null;
  previews: Record<string, AdminMediaPreview>;
  /** The workspace's building — fixed for this apartment (D6). */
  buildingId: string;
}) {
  const t = useTranslations("apartments");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const queue = useMediaQueue();
  // A pick still being reserved isn't in the form's value yet — Save waits for it.
  const preparing = queue.isPreparing;
  const [state, setState] = useState<FormState>(() => initialState(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const err = (key: string) => errors[key];
  const listHref = `/admin/buildings/${buildingId}/apartments`;

  function onSubmit() {
    if (preparing) return;
    setErrors({});
    void (async () => {
      // Uploads run OUTSIDE the transition on purpose: `startTransition` marks every
      // update in its scope as low priority, so the queue's progress modal would not
      // paint until the transition it lives in had already finished (ADR 0030).
      if (!(await queue.flush())) return;
      start(async () => {
        const result = await saveApartment(buildPayload(state, initial?.id, buildingId));
        if (result.ok) {
          toast.success(tb("actions.saved"));
          if (!initial) {
            router.push(`${listHref}/${result.id}`);
            return;
          }
          router.refresh();
          return;
        }
        if (result.error === "validation") {
          setErrors(result.fieldErrors);
          toast.error(tb("actions.saveError"));
        } else {
          toast.error(tb("actions.saveError"));
        }
      });
    })();
  }

  function onDelete() {
    if (!initial) return;
    if (!window.confirm(tb("actions.confirmDelete"))) return;
    start(async () => {
      const result = await deleteApartment(initial.id);
      if (result.ok) {
        toast.success(tb("actions.deleted"));
        router.push(listHref);
      } else {
        toast.error(tb("actions.deleteError"));
      }
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={
          initial ? state.name || t("admin.editTitle") : t("admin.newTitle")
        }
        description={t("admin.formSubtitle")}
        actions={
          <Link
            href={listHref}
            className="text-sm text-ink-soft hover:text-ink"
          >
            ← {t("admin.backToApartments")}
          </Link>
        }
      />

      {err("building_id") ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {t("admin.errors.buildingChange")}
        </p>
      ) : null}

      <AdminCard title={t("admin.sections.status")}>
        <FieldGrid>
          <Field label={t("admin.fields.status")}>
            <Select
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
        </FieldGrid>
      </AdminCard>

      <AdminCard title={t("admin.sections.identity")}>
        <div className="space-y-4">
          <Field label={t("admin.fields.name")} required error={err("name")}>
            <TextInput
              value={state.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field
            label={t("admin.fields.badge")}
            hint={t("admin.fields.badgeHint")}
            error={err("badge")}
          >
            <TextInput
              value={state.badge}
              onChange={(e) => set("badge", e.target.value)}
            />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.sections.specs")}>
        <FieldGrid className="lg:grid-cols-4">
          <Field label={t("admin.fields.bedrooms")} error={err("bedrooms")}>
            <TextInput
              type="number"
              value={state.bedrooms}
              onChange={(e) => set("bedrooms", e.target.value)}
            />
          </Field>
          <Field
            label={t("admin.fields.maxGuests")}
            required
            error={err("max_guests")}
          >
            <TextInput
              type="number"
              value={state.max_guests}
              onChange={(e) => set("max_guests", e.target.value)}
            />
          </Field>
          <Field label={t("admin.fields.bedsCount")} error={err("beds_count")}>
            <TextInput
              type="number"
              value={state.beds_count}
              onChange={(e) => set("beds_count", e.target.value)}
            />
          </Field>
          <Field label={t("admin.fields.sizeM2")} error={err("size_m2")}>
            <TextInput
              type="number"
              value={state.size_m2}
              onChange={(e) => set("size_m2", e.target.value)}
            />
          </Field>
        </FieldGrid>
      </AdminCard>

      <AdminCard title={t("admin.sections.media")}>
        <Field
          label={t("admin.fields.cover")}
          hint={t("admin.fields.coverHint")}
          error={err("cover_media_id")}
        >
          <MediaField
            value={state.cover_media_id || null}
            preview={previews[state.cover_media_id] ?? null}
            onChange={(id) => set("cover_media_id", id ?? "")}
          />
        </Field>
      </AdminCard>

      <AdminCard title={t("admin.sections.booking")}>
        <FieldGrid>
          <Field label={t("admin.fields.avantioId")} error={err("avantio_id")}>
            <TextInput
              value={state.avantio_id}
              onChange={(e) => set("avantio_id", e.target.value)}
            />
          </Field>
          <Field
            label={t("admin.fields.avantioUrl")}
            hint={t("admin.fields.avantioUrlHint")}
            error={err("avantio_url")}
          >
            <TextInput
              value={state.avantio_url}
              onChange={(e) => set("avantio_url", e.target.value)}
            />
          </Field>
        </FieldGrid>
      </AdminCard>

      <FormActions>
        {initial ? (
          <AdminButton variant="danger" onClick={onDelete} disabled={pending}>
            {tb("actions.delete")}
          </AdminButton>
        ) : null}
        <AdminButton
          variant="ghost"
          onClick={() => router.push(listHref)}
          disabled={pending}
        >
          {tb("actions.cancel")}
        </AdminButton>
        {preparing ? (
          <p role="status" className="text-xs text-ink-soft">
            {tb("media.waitForMedia")}
          </p>
        ) : null}
        <AdminButton variant="primary" onClick={onSubmit} disabled={pending || preparing}>
          {pending ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
