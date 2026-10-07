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
  IconField,
  TextInput,
} from "@slices/backoffice/contract";
import { deleteAmenity, saveAmenity } from "../actions";
import type { AmenityEditData } from "../queries";
import { type AmenityFormValues, amenityPayload } from "./amenity-payload";

/**
 * Amenity create/edit form at `/admin/amenities/new` and `/admin/amenities/[id]`
 * (mirrors the service-category form). Posts through `saveAmenity`; the [T] `label` is
 * authored in English. A blank icon is allowed: the building page then draws
 * `check-circle`.
 */

type FormState = AmenityFormValues;

function initialState(data: AmenityEditData | null): FormState {
  return {
    slug: data?.slug ?? "",
    icon: data?.icon ?? "",
    group: data?.group ?? "",
    label: data?.label ?? "",
  };
}

export function AmenityForm({ initial }: { initial: AmenityEditData | null }) {
  const t = useTranslations("buildings");
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
      const result = await saveAmenity(amenityPayload(state, initial?.id));
      if (result.ok) {
        if (!initial) {
          router.push(`/admin/amenities/${result.id}`);
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
        setBanner(t("admin.errors.slugConflict"));
      } else {
        setBanner(tb("actions.saveError"));
      }
    });
  }

  function onDelete() {
    if (!initial) return;
    const message =
      initial.buildings > 0
        ? t("admin.amenity.confirmDeleteInUse", { count: initial.buildings })
        : tb("actions.confirmDelete");
    if (!window.confirm(message)) return;
    start(async () => {
      const result = await deleteAmenity(initial.id);
      if (result.ok) {
        router.push("/admin/amenities");
        return;
      }
      setBanner(tb("actions.deleteError"));
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={
          initial
            ? state.label || t("admin.amenity.editTitle")
            : t("admin.amenity.newTitle")
        }
        description={t("admin.amenity.formSubtitle")}
        actions={
          <Link
            href="/admin/amenities"
            className="text-sm text-ink-soft hover:text-ink"
          >
            ← {t("admin.amenity.backToList")}
          </Link>
        }
      />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">
          {banner}
        </p>
      ) : null}

      <AdminCard title={t("admin.amenity.sections.details")}>
        <div className="space-y-4">
          <Field
            label={t("admin.amenity.fields.label")}
            required
            error={err("label")}
          >
            <TextInput
              value={state.label}
              onChange={(e) => set("label", e.target.value)}
            />
          </Field>
          <FieldGrid>
            <Field
              label={t("admin.amenity.fields.slug")}
              required
              hint={t("admin.fields.slugHint")}
              error={err("slug")}
            >
              <TextInput
                value={state.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
            </Field>
            <Field
              label={t("admin.amenity.fields.icon")}
              hint={t("admin.amenity.fields.iconHint")}
              error={err("icon")}
            >
              <IconField
                value={state.icon}
                onChange={(icon) => set("icon", icon)}
                allowEmpty
                emptyLabel={t("admin.amenity.defaultIcon")}
              />
            </Field>
            <Field
              label={t("admin.amenity.fields.group")}
              hint={t("admin.amenity.fields.groupHint")}
              error={err("group")}
            >
              <TextInput
                value={state.group}
                onChange={(e) => set("group", e.target.value)}
              />
            </Field>
          </FieldGrid>
        </div>
      </AdminCard>

      <FormActions>
        {initial ? (
          <AdminButton variant="danger" onClick={onDelete} disabled={pending}>
            {tb("actions.delete")}
          </AdminButton>
        ) : null}
        <AdminButton
          variant="ghost"
          onClick={() => router.push("/admin/amenities")}
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
