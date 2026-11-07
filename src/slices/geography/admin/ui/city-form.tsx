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
  type AdminMediaPreview,
  MediaField,
  Select,
  TextArea,
  TextInput,
  useMediaQueue,
} from "@slices/backoffice/contract";
import { deleteCity, saveCity } from "../actions";
import type { CityEditData } from "../queries";
import { GEOGRAPHY_NAME_LOCALES } from "../../reference-name-types";
import {
  adoptNeighbourhoodIds,
  cityFormValues,
  cityNamePayload,
  nameFormTranslations,
  type CityFormValues,
  type NeighbourhoodFormValues,
} from "./name-locale-payload";

/**
 * City create/edit form (S12) — one client island for `/admin/cities/new` and
 * `/admin/cities/[id]`. The city (slug, hero, name/intro) is edited together with its
 * neighbourhoods, added/removed/reordered inline. Each name has four inputs;
 * identity, slug, media and the existing English intro remain shared.
 */

type Status = "draft" | "published" | "archived";
const STATUSES: Status[] = ["draft", "published", "archived"];

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
  const fieldPrefix = useId();
  const saveLock = useRef(false);
  const [saving, setSaving] = useState(false);
  const queue = useMediaQueue();
  // A pick still being reserved isn't in the form's value yet — Save waits for it.
  const preparing = queue.isPreparing;
  const busy = preparing || saving || pending;
  const [state, setState] = useState<CityFormValues>(() =>
    cityFormValues(initial),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const set = <K extends keyof CityFormValues>(
    key: K,
    value: CityFormValues[K],
  ) => setState((prev) => ({ ...prev, [key]: value }));
  const err = (key: string) => errors[key];

  function updateNb(index: number, patch: Partial<NeighbourhoodFormValues>) {
    setState((prev) => ({
      ...prev,
      neighbourhoods: prev.neighbourhoods.map((n, i) =>
        i === index ? { ...n, ...patch } : n,
      ),
    }));
  }
  function addNb() {
    const clientKey = crypto.randomUUID();
    setState((prev) => ({
      ...prev,
      neighbourhoods: [
        ...prev.neighbourhoods,
        {
          clientKey,
          slug: "",
          name: "",
          translations: nameFormTranslations(),
        },
      ],
    }));
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
    if (busy || saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    setBanner(null);
    setErrors({});
    void (async () => {
      // Uploads run OUTSIDE the transition on purpose: `startTransition` marks every
      // update in its scope as low priority, so the queue's progress modal would not
      // paint until the transition it lives in had already finished (ADR 0030).
      try {
        if (!(await queue.flush())) {
          saveLock.current = false;
          setSaving(false);
          return;
        }
        start(async () => {
          try {
            const result = await saveCity(cityNamePayload(state, initial?.id));
            if (result.ok) {
              setState((previous) =>
                adoptNeighbourhoodIds(previous, result.neighbourhoodIds),
              );
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
          } catch {
            setBanner(tb("actions.saveError"));
          } finally {
            saveLock.current = false;
            setSaving(false);
          }
        });
      } catch {
        saveLock.current = false;
        setSaving(false);
        setBanner(tb("actions.saveError"));
      }
    })();
  }

  function onDelete() {
    if (!initial || busy || saveLock.current) return;
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
        title={
          initial ? state.name || t("admin.editTitle") : t("admin.newTitle")
        }
        description={t("admin.formSubtitle")}
        actions={
          <Link
            href="/admin/cities"
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

      <AdminCard title={t("admin.sections.identity")}>
        <fieldset disabled={busy} className="min-w-0 space-y-4">
          {GEOGRAPHY_NAME_LOCALES.map((locale) => {
            const field = locale === "en" ? "name" : `translations.${locale}`;
            return (
              <Field
                key={locale}
                label={t("admin.nameLocales.name", {
                  locale: locale.toUpperCase(),
                })}
                htmlFor={`${fieldPrefix}-name-${locale}`}
                required={locale === "en"}
                hint={
                  locale === "en"
                    ? undefined
                    : t("admin.nameLocales.fallbackHint")
                }
                error={err(field)}
              >
                <TextInput
                  id={`${fieldPrefix}-name-${locale}`}
                  maxLength={120}
                  value={
                    locale === "en" ? state.name : state.translations[locale]
                  }
                  aria-invalid={Boolean(err(field))}
                  onChange={(event) =>
                    locale === "en"
                      ? set("name", event.target.value)
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
          <FieldGrid>
            <Field
              label={t("admin.fields.slug")}
              htmlFor={`${fieldPrefix}-slug`}
              required
              hint={t("admin.fields.slugHint")}
              error={err("slug")}
            >
              <TextInput
                id={`${fieldPrefix}-slug`}
                aria-invalid={Boolean(err("slug"))}
                value={state.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
            </Field>
            <Field
              label={t("admin.fields.country")}
              htmlFor={`${fieldPrefix}-country`}
              error={err("country")}
            >
              <TextInput
                id={`${fieldPrefix}-country`}
                aria-invalid={Boolean(err("country"))}
                value={state.country}
                onChange={(e) => set("country", e.target.value)}
              />
            </Field>
            <Field
              label={t("admin.fields.status")}
              htmlFor={`${fieldPrefix}-status`}
              error={err("status")}
            >
              <Select
                id={`${fieldPrefix}-status`}
                aria-invalid={Boolean(err("status"))}
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
              htmlFor={`${fieldPrefix}-position`}
              hint={t("admin.fields.positionHint")}
              error={err("position")}
            >
              <TextInput
                id={`${fieldPrefix}-position`}
                aria-invalid={Boolean(err("position"))}
                type="number"
                value={state.position}
                onChange={(e) => set("position", e.target.value)}
              />
            </Field>
          </FieldGrid>
          <Field
            label={t("admin.fields.intro")}
            htmlFor={`${fieldPrefix}-intro`}
            hint={t("admin.fields.introHint")}
            error={err("intro")}
          >
            <TextArea
              id={`${fieldPrefix}-intro`}
              aria-invalid={Boolean(err("intro"))}
              rows={4}
              value={state.intro}
              onChange={(e) => set("intro", e.target.value)}
            />
          </Field>
        </fieldset>
      </AdminCard>

      <AdminCard title={t("admin.sections.hero")}>
        <fieldset disabled={busy} className="min-w-0">
          <Field
            label={t("admin.fields.hero")}
            hint={t("admin.fields.heroHint")}
          >
            <MediaField
              value={state.hero_media_id || null}
              preview={previews[state.hero_media_id] ?? null}
              onChange={(id) => set("hero_media_id", id ?? "")}
            />
          </Field>
        </fieldset>
      </AdminCard>

      <AdminCard title={t("admin.sections.neighbourhoods")}>
        <fieldset disabled={busy} className="min-w-0">
          {state.neighbourhoods.length === 0 ? (
            <p className="text-sm text-ink-soft">
              {t("admin.noNeighbourhoods")}
            </p>
          ) : (
            <div className="space-y-4">
              {state.neighbourhoods.map((nb, i) => (
                <div
                  key={nb.clientKey}
                  className="space-y-3 rounded-md border border-line p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      {t("admin.neighbourhoodLabel", { n: i + 1 })}
                    </span>
                    <div className="flex items-center gap-1">
                      <AdminButton
                        variant="ghost"
                        onClick={() => moveNb(i, -1)}
                        disabled={busy || i === 0}
                      >
                        {tb("media.moveUp")}
                      </AdminButton>
                      <AdminButton
                        variant="ghost"
                        onClick={() => moveNb(i, 1)}
                        disabled={busy || i === state.neighbourhoods.length - 1}
                      >
                        {tb("media.moveDown")}
                      </AdminButton>
                      <AdminButton
                        variant="danger"
                        onClick={() => removeNb(i)}
                        disabled={busy}
                      >
                        {tb("actions.delete")}
                      </AdminButton>
                    </div>
                  </div>
                  {GEOGRAPHY_NAME_LOCALES.map((locale) => {
                    const field = `neighbourhoods.${i}.${locale === "en" ? "name" : `translations.${locale}`}`;
                    const id = `${fieldPrefix}-${nb.clientKey}-name-${locale}`;
                    return (
                      <Field
                        key={locale}
                        label={t("admin.nameLocales.neighbourhoodName", {
                          locale: locale.toUpperCase(),
                        })}
                        htmlFor={id}
                        required={locale === "en"}
                        hint={
                          locale === "en"
                            ? undefined
                            : t("admin.nameLocales.fallbackHint")
                        }
                        error={err(field)}
                      >
                        <TextInput
                          id={id}
                          maxLength={120}
                          value={
                            locale === "en" ? nb.name : nb.translations[locale]
                          }
                          aria-invalid={Boolean(err(field))}
                          onChange={(event) =>
                            updateNb(
                              i,
                              locale === "en"
                                ? { name: event.target.value }
                                : {
                                    translations: {
                                      ...nb.translations,
                                      [locale]: event.target.value,
                                    },
                                  },
                            )
                          }
                        />
                      </Field>
                    );
                  })}
                  <FieldGrid>
                    <Field
                      label={t("admin.fields.nbSlug")}
                      htmlFor={`${fieldPrefix}-${nb.clientKey}-slug`}
                      required
                      error={err(`neighbourhoods.${i}.slug`)}
                    >
                      <TextInput
                        id={`${fieldPrefix}-${nb.clientKey}-slug`}
                        aria-invalid={Boolean(err(`neighbourhoods.${i}.slug`))}
                        value={nb.slug}
                        onChange={(e) => updateNb(i, { slug: e.target.value })}
                      />
                    </Field>
                  </FieldGrid>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <AdminButton variant="ghost" onClick={addNb} disabled={busy}>
              {t("admin.addNeighbourhood")}
            </AdminButton>
          </div>
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
          onClick={() => router.push("/admin/cities")}
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
          {pending || saving ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
