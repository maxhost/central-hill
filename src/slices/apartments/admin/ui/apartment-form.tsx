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
} from "@slices/backoffice/contract";
import { deleteApartment, saveApartment } from "../actions";
import type { ApartmentEditData } from "../queries";

/**
 * Apartment create/edit form (S12) — one client island for `/admin/apartments/new`
 * and `/admin/apartments/[id]`. Posts through `saveApartment`; building selector is
 * fed from the buildings contract. Source [T] text authored in English.
 *
 * Simplified to the fields a building's apartment CARD shows (no standalone unit page):
 * building · name · badge · bedrooms / guests / beds · cover (optional → placeholder) ·
 * Avantio link. The slug is auto-generated from the name server-side. The remaining DB
 * columns (bathrooms, size, floor, gallery, description, OG, SEO) stay nullable but are
 * no longer authored here.
 */

type Status = "draft" | "published" | "archived";

interface FormState {
  status: Status;
  position: string;
  building_id: string;
  name: string;
  badge: string;
  bedrooms: string;
  max_guests: string;
  beds_count: string;
  cover_media_id: string;
  avantio_id: string;
  avantio_url: string;
}

const STATUSES: Status[] = ["draft", "published", "archived"];

function initialState(data: ApartmentEditData | null, defaultBuildingId: string): FormState {
  return {
    status: data?.status ?? "draft",
    position: String(data?.position ?? 0),
    building_id: data?.building_id ?? defaultBuildingId,
    name: data?.name ?? "",
    badge: data?.badge ?? "",
    bedrooms: String(data?.bedrooms ?? 0),
    max_guests: String(data?.max_guests ?? 1),
    beds_count: String(data?.beds_count ?? 0),
    cover_media_id: data?.cover_media_id ?? "",
    avantio_id: data?.avantio_id ?? "",
    avantio_url: data?.avantio_url ?? "",
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
    status: s.status,
    position: intOr(s.position, 0),
    building_id: s.building_id,
    name: s.name.trim(),
    badge: orNull(s.badge),
    bedrooms: intOr(s.bedrooms, 0),
    max_guests: intOr(s.max_guests, 1),
    beds_count: intOr(s.beds_count, 0),
    cover_media_id: s.cover_media_id || null,
    avantio_id: orNull(s.avantio_id),
    avantio_url: orNull(s.avantio_url),
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
  const toast = useToast();
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>(() =>
    initialState(initial, buildings[0]?.id ?? ""),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const err = (key: string) => errors[key];

  function onSubmit() {
    setErrors({});
    start(async () => {
      const result = await saveApartment(buildPayload(state, initial?.id));
      if (result.ok) {
        toast.success(tb("actions.saved"));
        if (!initial) {
          router.push(`/admin/apartments/${result.id}`);
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
  }

  function onDelete() {
    if (!initial) return;
    if (!window.confirm(tb("actions.confirmDelete"))) return;
    start(async () => {
      const result = await deleteApartment(initial.id);
      if (result.ok) {
        toast.success(tb("actions.deleted"));
        router.push("/admin/apartments");
      } else {
        toast.error(tb("actions.deleteError"));
      }
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
          <Field label={t("admin.fields.maxGuests")} required error={err("max_guests")}>
            <TextInput type="number" value={state.max_guests} onChange={(e) => set("max_guests", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.bedsCount")} error={err("beds_count")}>
            <TextInput type="number" value={state.beds_count} onChange={(e) => set("beds_count", e.target.value)} />
          </Field>
        </FieldGrid>
      </AdminCard>

      <AdminCard title={t("admin.sections.media")}>
        <Field label={t("admin.fields.cover")} hint={t("admin.fields.coverHint")} error={err("cover_media_id")}>
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
            <TextInput value={state.avantio_id} onChange={(e) => set("avantio_id", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.avantioUrl")} hint={t("admin.fields.avantioUrlHint")} error={err("avantio_url")}>
            <TextInput value={state.avantio_url} onChange={(e) => set("avantio_url", e.target.value)} />
          </Field>
        </FieldGrid>
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
