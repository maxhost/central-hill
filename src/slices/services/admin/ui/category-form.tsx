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
  TextInput,
} from "@slices/backoffice/contract";
import { deleteServiceCategory, saveServiceCategory } from "../actions";
import type { ServiceCategoryEditData } from "../queries";

/**
 * Service-category create/edit form (S12). Posts through `saveServiceCategory`; the
 * [T] `name` is authored in English. The `slug` is a plain column (not the slug table).
 */

interface FormState {
  slug: string;
  icon: string;
  position: string;
  name: string;
}

function initialState(data: ServiceCategoryEditData | null): FormState {
  return {
    slug: data?.slug ?? "",
    icon: data?.icon ?? "",
    position: String(data?.position ?? 0),
    name: data?.name ?? "",
  };
}

function buildPayload(s: FormState, id: string | undefined) {
  const intOr = (v: string, fallback: number) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    id,
    slug: s.slug.trim(),
    icon: s.icon.trim(),
    position: intOr(s.position, 0),
    name: s.name.trim(),
  };
}

export function ServiceCategoryForm({ initial }: { initial: ServiceCategoryEditData | null }) {
  const t = useTranslations("services");
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
      const result = await saveServiceCategory(buildPayload(state, initial?.id));
      if (result.ok) {
        if (!initial) {
          router.push(`/admin/service-categories/${result.id}`);
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
      const result = await deleteServiceCategory(initial.id);
      if (result.ok) {
        router.push("/admin/service-categories");
        return;
      }
      setBanner(result.error === "in_use" ? t("admin.cat.inUse") : tb("actions.saveError"));
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={initial ? state.name || t("admin.cat.editTitle") : t("admin.cat.newTitle")}
        description={t("admin.cat.formSubtitle")}
        actions={
          <Link href="/admin/service-categories" className="text-sm text-ink-soft hover:text-ink">
            ← {t("admin.cat.backToList")}
          </Link>
        }
      />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">{banner}</p>
      ) : null}

      <AdminCard title={t("admin.cat.sections.details")}>
        <div className="space-y-4">
          <Field label={t("admin.cat.fields.name")} required error={err("name")}>
            <TextInput value={state.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <FieldGrid>
            <Field label={t("admin.cat.fields.slug")} required error={err("slug")}>
              <TextInput value={state.slug} onChange={(e) => set("slug", e.target.value)} />
            </Field>
            <Field label={t("admin.cat.fields.icon")} required hint={t("admin.cat.fields.iconHint")} error={err("icon")}>
              <TextInput value={state.icon} onChange={(e) => set("icon", e.target.value)} />
            </Field>
            <Field label={t("admin.cat.fields.position")} hint={t("admin.cat.fields.positionHint")}>
              <TextInput
                type="number"
                value={state.position}
                onChange={(e) => set("position", e.target.value)}
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
          onClick={() => router.push("/admin/service-categories")}
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
