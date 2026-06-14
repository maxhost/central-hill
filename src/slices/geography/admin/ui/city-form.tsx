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
  TextArea,
  TextInput,
} from "@slices/backoffice/contract";
import { deleteCity, saveCity } from "../actions";
import type { CityEditData } from "../queries";

/**
 * City create/edit form (S12) — one client island for `/admin/cities/new` and
 * `/admin/cities/[id]`. The city (slug, hero, name/intro) is edited together with its
 * neighbourhoods (each slug + name), added/removed/reordered inline. Source [T] text
 * is authored in English; slugs are written identically across the four locales.
 */

type Status = "draft" | "published" | "archived";
const STATUSES: Status[] = ["draft", "published", "archived"];

interface NeighbourhoodState {
  id?: string;
  slug: string;
  name: string;
}

interface FormState {
  slug: string;
  position: string;
  status: Status;
  country: string;
  hero_media_id: string;
  name: string;
  intro: string;
  neighbourhoods: NeighbourhoodState[];
}

function initialState(data: CityEditData | null): FormState {
  return {
    slug: data?.slug ?? "",
    position: String(data?.position ?? 0),
    status: data?.status ?? "draft",
    country: data?.country ?? "PT",
    hero_media_id: data?.hero_media_id ?? "",
    name: data?.name ?? "",
    intro: data?.intro ?? "",
    neighbourhoods:
      data?.neighbourhoods.map((n) => ({ id: n.id, slug: n.slug, name: n.name })) ?? [],
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
    slug: s.slug.trim(),
    position: intOr(s.position, 0),
    status: s.status,
    country: s.country.trim().toUpperCase(),
    hero_media_id: s.hero_media_id || null,
    name: s.name.trim(),
    intro: orNull(s.intro),
    neighbourhoods: s.neighbourhoods.map((n) => ({
      id: n.id,
      slug: n.slug.trim(),
      name: n.name.trim(),
    })),
  };
}

export function CityForm({
  initial,
  previews,
}: {
  initial: CityEditData | null;
  previews: Record<string, AdminMediaPreview>;
}) {
  const t = useTranslations("geography");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>(() => initialState(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const err = (key: string) => errors[key];

  function updateNb(index: number, patch: Partial<NeighbourhoodState>) {
    setState((prev) => ({
      ...prev,
      neighbourhoods: prev.neighbourhoods.map((n, i) => (i === index ? { ...n, ...patch } : n)),
    }));
  }
  function addNb() {
    setState((prev) => ({ ...prev, neighbourhoods: [...prev.neighbourhoods, { slug: "", name: "" }] }));
  }
  function removeNb(index: number) {
    setState((prev) => ({
      ...prev,
      neighbourhoods: prev.neighbourhoods.filter((_, i) => i !== index),
    }));
  }
  function moveNb(index: number, dir: -1 | 1) {
    setState((prev) => {
      const next = [...prev.neighbourhoods];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return { ...prev, neighbourhoods: next };
    });
  }

  function onSubmit() {
    setBanner(null);
    setErrors({});
    start(async () => {
      const result = await saveCity(buildPayload(state, initial?.id));
      if (result.ok) {
        if (!initial) {
          router.push(`/admin/cities/${result.id}`);
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
      const result = await deleteCity(initial.id);
      if (result.ok) router.push("/admin/cities");
      else setBanner(tb("actions.saveError"));
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={initial ? state.name || t("admin.editTitle") : t("admin.newTitle")}
        description={t("admin.formSubtitle")}
        actions={
          <Link href="/admin/cities" className="text-sm text-ink-soft hover:text-ink">
            ← {t("admin.backToList")}
          </Link>
        }
      />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">{banner}</p>
      ) : null}

      <AdminCard title={t("admin.sections.identity")}>
        <div className="space-y-4">
          <Field label={t("admin.fields.name")} required error={err("name")}>
            <TextInput value={state.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <FieldGrid>
            <Field label={t("admin.fields.slug")} required hint={t("admin.fields.slugHint")} error={err("slug")}>
              <TextInput value={state.slug} onChange={(e) => set("slug", e.target.value)} />
            </Field>
            <Field label={t("admin.fields.country")} error={err("country")}>
              <TextInput value={state.country} onChange={(e) => set("country", e.target.value)} />
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
          <Field label={t("admin.fields.intro")} hint={t("admin.fields.introHint")} error={err("intro")}>
            <TextArea rows={4} value={state.intro} onChange={(e) => set("intro", e.target.value)} />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.sections.hero")}>
        <Field label={t("admin.fields.hero")} hint={t("admin.fields.heroHint")}>
          <MediaField
            value={state.hero_media_id || null}
            preview={previews[state.hero_media_id] ?? null}
            onChange={(id) => set("hero_media_id", id ?? "")}
          />
        </Field>
      </AdminCard>

      <AdminCard title={t("admin.sections.neighbourhoods")}>
        {state.neighbourhoods.length === 0 ? (
          <p className="text-sm text-ink-soft">{t("admin.noNeighbourhoods")}</p>
        ) : (
          <div className="space-y-4">
            {state.neighbourhoods.map((nb, i) => (
              <div key={nb.id ?? `new-${i}`} className="space-y-3 rounded-md border border-line p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    {t("admin.neighbourhoodLabel", { n: i + 1 })}
                  </span>
                  <div className="flex items-center gap-1">
                    <AdminButton variant="ghost" onClick={() => moveNb(i, -1)} disabled={pending || i === 0}>
                      {tb("media.moveUp")}
                    </AdminButton>
                    <AdminButton
                      variant="ghost"
                      onClick={() => moveNb(i, 1)}
                      disabled={pending || i === state.neighbourhoods.length - 1}
                    >
                      {tb("media.moveDown")}
                    </AdminButton>
                    <AdminButton variant="danger" onClick={() => removeNb(i)} disabled={pending}>
                      {tb("actions.delete")}
                    </AdminButton>
                  </div>
                </div>
                <FieldGrid>
                  <Field label={t("admin.fields.nbName")} required error={err(`neighbourhoods.${i}.name`)}>
                    <TextInput value={nb.name} onChange={(e) => updateNb(i, { name: e.target.value })} />
                  </Field>
                  <Field label={t("admin.fields.nbSlug")} required error={err(`neighbourhoods.${i}.slug`)}>
                    <TextInput value={nb.slug} onChange={(e) => updateNb(i, { slug: e.target.value })} />
                  </Field>
                </FieldGrid>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4">
          <AdminButton variant="ghost" onClick={addNb} disabled={pending}>
            {t("admin.addNeighbourhood")}
          </AdminButton>
        </div>
      </AdminCard>

      <FormActions>
        {initial ? (
          <AdminButton variant="danger" onClick={onDelete} disabled={pending}>
            {tb("actions.delete")}
          </AdminButton>
        ) : null}
        <AdminButton variant="ghost" onClick={() => router.push("/admin/cities")} disabled={pending}>
          {tb("actions.cancel")}
        </AdminButton>
        <AdminButton variant="primary" onClick={onSubmit} disabled={pending}>
          {pending ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
