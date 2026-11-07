"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ZodError } from "zod";
import { isIconName } from "@core/ui/icons/names";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Locale } from "@core/db/columns";
import {
  AdminButton,
  AdminCard,
  AdminPageHeader,
  IconField,
  FieldGrid,
  FormActions,
  type AdminMediaPreview,
  MediaField,
  MediaGalleryField,
  Select,
  TextArea,
  TextInput,
  useMediaQueue,
} from "@slices/backoffice/contract";
import { deleteService } from "../actions";
import {
  saveServiceLocaleDraft,
  publishServiceLocaleDraft,
  setServiceVisibility,
} from "../locale-actions";
import {
  discardSection,
  guardMessageKey,
  BOOKING_TYPES,
  type FormState,
  type BookingType,
  setSectionChoice,
} from "../form-model";
import {
  SERVICE_EDITOR_LOCALES,
  type ServiceEditorialModel,
  type ServiceCategoryOption,
  type ServiceEditorialResult,
} from "../../editorial-types";
import {
  createServiceWorkspace,
  changeServiceForm,
  applyServiceModel,
  applyServiceVisibilityModel,
  serviceAnyFormDirty,
  serviceLocaleFormDirty,
  serviceFormEnvelope,
  serviceFormSharedContent,
  serviceLocalTextDirty,
  servicePublicationNeedsSave,
} from "../locale-form-state";
import { DetailEditor } from "./detail-editor";
import { ServiceField as Field } from "./service-section-controls";
import { ServiceCopyEditor } from "./service-copy-editor";
import {
  SERVICE_ICON_SLOTS,
  SERVICE_PRICE_DISPLAYS,
  type ServiceSectionKey,
  type ServicePriceDisplay,
} from "../../presentation";

/** Existing conditional Service form, with independent localized work and common assets. */
export function ServiceForm({
  initial,
  newServiceId,
  previews: initialPreviews = {},
  categories,
}: {
  initial: ServiceEditorialModel | null;
  newServiceId?: string;
  previews?: Record<string, AdminMediaPreview>;
  categories: ServiceCategoryOption[];
}) {
  const t = useTranslations("services");
  const tb = useTranslations("backoffice");
  const tp = useTranslations("services.admin.presentation");
  const te = useTranslations("services.editorial");
  const tv = useTranslations("propertyEditor");
  const router = useRouter();
  const fieldPrefix = useId();
  const [serviceId] = useState(initial?.id ?? newServiceId ?? "");
  const [workspace, setWorkspace] = useState(() =>
    createServiceWorkspace(initial, categories[0]?.id ?? ""),
  );
  const [locale, setLocale] = useState<Locale>("en");
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [operation, setOperation] = useState<"save" | "publish" | null>(null);
  const queue = useMediaQueue();
  const preparing = queue.isPreparing;
  const busy = pending || uploading || preparing;
  const persisted = Boolean(workspace.model);
  const own = workspace.locales[locale];
  const state = own.working;
  const saved = own.saved;
  const errors = own.errors;
  const banner = own.notice;
  const model = workspace.model?.locales[locale];
  const previews = { ...initialPreviews, ...workspace.model?.previews };
  const dirty = serviceLocaleFormDirty(workspace, locale);
  const publicationNeedsSave = servicePublicationNeedsSave(workspace, locale);
  const anyDirty =
    serviceAnyFormDirty(workspace) || queue.hasPending || preparing;
  const root = useRef<HTMLDivElement>(null);
  const bypass = useRef(false);
  const lock = useRef(false);
  const currentUrl = useRef("");
  const editableIcons = locale === "en";
  const setErrors = (next: Record<string, string>) =>
    setWorkspace((previous) => ({
      ...previous,
      locales: {
        ...previous.locales,
        [locale]: { ...previous.locales[locale], errors: next },
      },
    }));
  const setBanner = (next: string | null) =>
    setWorkspace((previous) => ({
      ...previous,
      locales: {
        ...previous.locales,
        [locale]: { ...previous.locales[locale], notice: next ?? "" },
      },
    }));
  const setState = (next: FormState) =>
    setWorkspace((previous) => changeServiceForm(previous, locale, next));
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setWorkspace((previous) =>
      changeServiceForm(previous, locale, {
        ...previous.locales[locale].working,
        [key]: value,
      }),
    );
  const err = (key: string) => errors[key];
  const canLeave = () => !anyDirty || window.confirm(tp("unsaved"));
  const goBack = () => {
    if (!busy && canLeave()) {
      bypass.current = true;
      router.push("/admin/services");
    }
  };

  useEffect(() => {
    currentUrl.current = window.location.href;
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if ((anyDirty || busy) && !bypass.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const intercept = (event: MouseEvent) => {
      if (
        bypass.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const href = new URL(link.href, window.location.href);
      if (
        href.href === window.location.href ||
        (href.pathname === window.location.pathname &&
          href.search === window.location.search &&
          href.hash)
      )
        return;
      if (!anyDirty && !busy) return;
      if (busy || !window.confirm(tp("unsaved"))) {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else bypass.current = true;
    };
    const back = () => {
      if (bypass.current || (!anyDirty && !busy)) return;
      const target = window.location.href;
      if (target === currentUrl.current) return;
      window.history.pushState(window.history.state, "", currentUrl.current);
      if (!busy && window.confirm(tp("unsaved"))) {
        bypass.current = true;
        window.location.assign(target);
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", intercept, true);
    window.addEventListener("popstate", back);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", intercept, true);
      window.removeEventListener("popstate", back);
    };
  }, [anyDirty, busy, tp]);

  function focusError(path: string, message: string) {
    requestAnimationFrame(() => {
      const section = path.startsWith("detail.")
        ? path.split(".")[1]
        : undefined;
      const sectionKeys: Record<string, string> = {
        highlights: "included",
        option_groups: "options",
        notes: "good_to_know",
      };
      const scope = section
        ? (root.current?.querySelector<HTMLElement>(
            `[data-service-section="${sectionKeys[section] ?? section}"]`,
          ) ?? root.current)
        : root.current;
      const fields = Array.from(
        scope?.querySelectorAll<HTMLElement>(
          "[data-service-field], [data-service-error-message]",
        ) ?? [],
      );
      const direct = root.current?.querySelector<HTMLElement>(
        `[data-service-path="${path}"]`,
      );
      const field =
        fields.find((node) => node.dataset.serviceErrorMessage === message) ??
        fields.find((node) => node.dataset.serviceError === "true");
      const directControl = direct?.matches("input,textarea,select,button")
        ? direct
        : direct?.querySelector<HTMLElement>("input,textarea,select,button");
      const control =
        directControl ??
        field?.querySelector<HTMLElement>("input, textarea, select, button") ??
        scope?.querySelector<HTMLElement>('[aria-invalid="true"]');
      const target = control ?? field ?? scope;
      if (target) {
        target.closest("details")?.setAttribute("open", "");
        target.scrollIntoView({ block: "center" });
        if (!control) target.tabIndex = -1;
        target.focus();
      }
    });
  }
  function reportErrors(next: Record<string, string>) {
    setErrors(
      Object.fromEntries(
        Object.entries(next).map(([path, message]) => [
          path,
          guardMessageKey(path, message)
            ? tp(guardMessageKey(path, message)!)
            : message,
        ]),
      ),
    );
    setBanner(tp("saveError"));
  }
  useEffect(() => {
    const first = Object.entries(errors)[0];
    if (first && !busy) focusError(...first);
  }, [errors, busy]);
  function receive(result: ServiceEditorialResult, action: "save" | "publish") {
    if (result.ok) {
      setWorkspace((previous) =>
        applyServiceModel(
          previous,
          locale,
          result.model,
          action === "publish" ? te("publishedNotice") : tb("actions.saved"),
        ),
      );
      if (!persisted) {
        const path = `/admin/services/${result.model.id}`;
        window.history.replaceState(window.history.state, "", path);
        currentUrl.current = window.location.href;
      }
    } else if (result.error === "validation") reportErrors(result.fieldErrors);
    else if (result.error === "slug_conflict")
      reportErrors({ slug: t("admin.errors.slugConflict") });
    else if (result.error === "conflict")
      setWorkspace((previous) => ({
        ...previous,
        locales: {
          ...previous.locales,
          [locale]: {
            ...previous.locales[locale],
            conflict: true,
            notice: te("conflict"),
          },
        },
      }));
    else
      setBanner(
        result.error === "legacy_invalid"
          ? tp("integrity")
          : result.error === "no_draft"
            ? te("noDraft")
            : tp("saveError"),
      );
  }
  function onSubmit() {
    if (busy || lock.current || own.conflict) return;
    setBanner(null);
    let payload: ReturnType<typeof serviceFormEnvelope>;
    try {
      payload = serviceFormEnvelope(workspace, locale);
    } catch (error) {
      if (error instanceof ZodError)
        reportErrors(
          Object.fromEntries(
            error.issues.map((issue) => [
              `detail.${issue.path.join(".")}`,
              issue.message,
            ]),
          ),
        );
      else reportErrors({ price_from: tp("invalidEuros") });
      return;
    }
    lock.current = true;
    setErrors({});
    setUploading(true);
    setOperation("save");
    start(async () => {
      try {
        if (!(await queue.flush())) {
          setBanner(tp("saveError"));
          return;
        }
        receive(
          await saveServiceLocaleDraft({
            serviceId,
            locale,
            expectedRevision: model?.revision ?? 0,
            templateRevision: model
              ? model.templateRevision
              : locale === "en"
                ? null
                : 0,
            expectedSharedRevision: workspace.model?.shared.revision ?? 0,
            payload,
            shared: serviceFormSharedContent(workspace, locale),
            ...(!persisted ? { slug: workspace.slug } : {}),
          }),
          "save",
        );
      } catch {
        setBanner(tp("saveError"));
      } finally {
        lock.current = false;
        setUploading(false);
        setOperation(null);
      }
    });
  }

  function onPublish() {
    if (
      busy ||
      lock.current ||
      dirty ||
      publicationNeedsSave ||
      !model?.draft ||
      own.conflict
    )
      return;
    lock.current = true;
    setOperation("publish");
    start(async () => {
      try {
        receive(
          await publishServiceLocaleDraft({
            serviceId,
            locale,
            expectedRevision: model.revision,
          }),
          "publish",
        );
      } catch {
        setBanner(tp("saveError"));
      } finally {
        lock.current = false;
        setOperation(null);
      }
    });
  }
  function onDelete() {
    if (!persisted || busy || !window.confirm(tb("actions.confirmDelete")))
      return;
    start(async () => {
      const result = await deleteService(serviceId);
      if (result.ok) {
        bypass.current = true;
        router.push("/admin/services");
      } else setBanner(tb("actions.saveError"));
    });
  }
  function onVisibility() {
    if (!persisted || busy || lock.current) return;
    const archived = workspace.model?.status !== "archived";
    if (archived && !window.confirm(tv("archiveConfirm"))) return;
    lock.current = true;
    start(async () => {
      try {
        const result = await setServiceVisibility({ serviceId, archived });
        if (result.ok)
          setWorkspace((previous) =>
            applyServiceVisibilityModel(previous, result.model),
          );
        else if (result.error === "validation")
          reportErrors(result.fieldErrors);
        else setBanner(tp("saveError"));
      } catch {
        setBanner(tp("saveError"));
      } finally {
        lock.current = false;
      }
    });
  }
  function selectLocale(next: Locale) {
    if (!busy && (persisted || next === "en")) setLocale(next);
  }
  const detailProps = {
    value: state.detail,
    onChange: (detail: FormState["detail"]) => set("detail", detail),
    errors,
    previews,
    editableIcons,
    presentation: state.presentation,
    onSectionChoice: (key: ServiceSectionKey, choice: boolean | undefined) =>
      set("presentation", setSectionChoice(state.presentation, key, choice)),
    onDiscard: (key: ServiceSectionKey) => {
      const next = discardSection(state, saved, key);
      const retained = new Set(
        SERVICE_EDITOR_LOCALES.flatMap((key) => {
          const form = key === locale ? next : workspace.locales[key].working;
          return [
            form.cover_media_id,
            form.og_image_media_id,
            ...form.gallery,
            ...form.detail.itinerary.map((step) => step.media_id),
          ];
        }),
      );
      for (const step of state.detail.itinerary)
        if (step.media_id && !retained.has(step.media_id))
          queue.dequeue(step.media_id);
      setState(next);
    },
    copy: state.copy,
    onCopyChange: (copy: FormState["copy"]) => set("copy", copy),
  };
  const iconLabels = {
    service_photos: t("detail.showAllPhotos"),
    service_badge: t("admin.detail.fields.badges"),
    service_included: t("admin.detail.sections.included"),
    service_note: t("detail.noPayment"),
    know_included: t("detail.knowIncluded"),
    know_cancellation: t("detail.knowCancellation"),
    know_practical: t("detail.knowPractical"),
  };
  return (
    <div ref={root} className="space-y-6">
      <AdminPageHeader
        title={
          persisted ? state.name || t("admin.editTitle") : t("admin.newTitle")
        }
        description={t("admin.formSubtitle")}
        actions={
          <Link
            href="/admin/services"
            className="text-sm text-ink-soft hover:text-ink"
          >
            ← {t("admin.backToList")}
          </Link>
        }
      />

      {banner ? (
        <p
          role="status"
          className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink"
        >
          {banner}
        </p>
      ) : null}

      <div className="space-y-3 border-b border-line bg-bg py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label={tb("pageEditor.contentLanguage")}
            className="flex gap-1 rounded-md border border-line bg-surface p-1"
          >
            {SERVICE_EDITOR_LOCALES.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`${fieldPrefix}-tab-${key}`}
                aria-controls={`${fieldPrefix}-panel-${key}`}
                aria-selected={locale === key}
                tabIndex={locale === key ? 0 : -1}
                disabled={busy || (!persisted && key !== "en")}
                onClick={() => selectLocale(key)}
                onKeyDown={(event) => {
                  if (
                    busy ||
                    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      event.key,
                    )
                  )
                    return;
                  event.preventDefault();
                  const available = persisted
                    ? SERVICE_EDITOR_LOCALES
                    : (["en"] as const);
                  const index = available.findIndex((item) => item === key);
                  const next =
                    event.key === "Home"
                      ? available[0]
                      : event.key === "End"
                        ? available[available.length - 1]
                        : available[
                            (index +
                              (event.key === "ArrowRight" ? 1 : -1) +
                              available.length) %
                              available.length
                          ];
                  if (next) {
                    selectLocale(next);
                    document
                      .getElementById(`${fieldPrefix}-tab-${next}`)
                      ?.focus();
                  }
                }}
                className={`min-h-9 rounded px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${locale === key ? "bg-accent/10 text-accent-deep" : "text-ink-soft"}`}
              >
                {key.toUpperCase()}
                {key === "en" ? (
                  <span className="ml-1 text-[10px] font-normal">
                    {tb("pageEditor.source")}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <p
            role="status"
            className={`text-xs ${dirty ? "text-accent-deep" : "text-ink-soft"}`}
          >
            {te(
              dirty || publicationNeedsSave
                ? "unsaved"
                : model?.draft
                  ? "draft"
                  : model?.published
                    ? "published"
                    : "unpublished",
            )}
          </p>
        </div>
        <p className="text-sm text-ink-soft">{te("sharedHint")}</p>
        {!persisted ? (
          <p className="text-sm text-ink-soft">{te("firstSave")}</p>
        ) : null}
        {locale !== "en" ? (
          <p className="text-sm text-ink-soft">
            <strong>
              {te(
                own.mode === "custom" || serviceLocalTextDirty(own)
                  ? "customized"
                  : "usesEnglish",
              )}
            </strong>{" "}
            ·{" "}
            {te(
              own.mode === "custom" || serviceLocalTextDirty(own)
                ? "customHint"
                : "inheritHint",
            )}
          </p>
        ) : null}
        {own.conflict ? (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-ink">
              {te("conflict")}
            </p>
            <AdminButton
              onClick={() => {
                if (canLeave()) {
                  bypass.current = true;
                  window.location.reload();
                }
              }}
              disabled={busy}
            >
              {te("reload")}
            </AdminButton>
          </div>
        ) : null}
      </div>
      {workspace.model?.status === "published" && model?.published ? (
        <Link
          href={`/${locale}/services/${workspace.model?.slugByLocale[locale] ?? workspace.model?.slugByLocale.en ?? ""}`}
          className="inline-block text-sm underline underline-offset-4"
        >
          {tp("published")}
        </Link>
      ) : null}
      {Object.keys(errors).length ? (
        <div
          role="alert"
          className="space-y-2 rounded-md border border-line p-4"
        >
          <p className="text-sm font-semibold">{tp("saveError")}</p>
          <ul className="space-y-2">
            {Object.entries(errors).map(([path, message]) => (
              <li key={path}>
                <button
                  type="button"
                  onClick={() => focusError(path, message)}
                  className="text-left text-sm underline underline-offset-4"
                >
                  {message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <fieldset
        role="tabpanel"
        id={`${fieldPrefix}-panel-${locale}`}
        aria-labelledby={`${fieldPrefix}-tab-${locale}`}
        disabled={pending || uploading || own.conflict}
        className="space-y-6"
      >
        <AdminCard title={t("admin.sections.status")}>
          <FieldGrid>
            <Field label={t("admin.fields.status")}>
              <p className="min-h-11 py-3 text-sm text-ink">
                {t(`admin.status.${workspace.model?.status ?? "draft"}`)}
              </p>
            </Field>
            <Field
              label={t("admin.fields.position")}
              hint={t("admin.fields.positionHint")}
            >
              <TextInput
                type="number"
                data-service-path="position"
                value={state.position}
                onChange={(e) => set("position", e.target.value)}
              />
            </Field>
          </FieldGrid>
        </AdminCard>

        <AdminCard title={t("admin.sections.identity")}>
          <div className="space-y-4">
            <Field
              label={t("admin.fields.category")}
              required
              error={err("category_id")}
            >
              <Select
                data-service-path="category_id"
                disabled={!editableIcons}
                value={state.category_id}
                onChange={(e) => set("category_id", e.target.value)}
              >
                <option value="">{t("admin.fields.choose")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.names?.[locale] ?? c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("admin.fields.name")} required error={err("name")}>
              <TextInput
                data-service-path="name"
                value={state.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field
              label={t("admin.fields.slug")}
              required
              hint={t("admin.fields.slugHint")}
              error={err("slug")}
            >
              <TextInput
                data-service-path="slug"
                disabled={persisted || locale !== "en"}
                value={state.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
            </Field>
            <Field
              label={t("admin.fields.excerpt")}
              required
              error={err("excerpt")}
            >
              <TextArea
                data-service-path="excerpt"
                value={state.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
              />
            </Field>
            <FieldGrid>
              <Field
                label={t("admin.fields.rating")}
                hint={t("admin.fields.ratingHint")}
                error={err("rating_tenths")}
              >
                <TextInput
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  data-service-path="rating_tenths"
                  value={state.rating}
                  onChange={(e) => set("rating", e.target.value)}
                />
              </Field>
              <Field
                label={t("admin.fields.durationLabel")}
                error={err("duration_label")}
              >
                <TextInput
                  data-service-path="duration_label"
                  value={state.duration_label}
                  onChange={(e) => set("duration_label", e.target.value)}
                />
              </Field>
            </FieldGrid>
          </div>
        </AdminCard>

        <AdminCard title={t("admin.sections.body")}>
          <Field label={t("admin.fields.body")} required error={err("body")}>
            <TextArea
              rows={8}
              data-service-path="body"
              value={state.body}
              onChange={(e) => set("body", e.target.value)}
            />
          </Field>
        </AdminCard>

        <AdminCard title={t("admin.sections.detail")}>
          <DetailEditor mode="general" {...detailProps} />
        </AdminCard>
        <AdminCard title={t("admin.sections.media")}>
          <div className="space-y-5">
            <p className="text-sm text-ink-soft">{tp("mediaAltHint")}</p>
            <p className="text-sm text-ink-soft">
              {t("admin.fields.mosaicHint")}
            </p>
            <ol className="grid gap-2 rounded-md border border-line bg-bg p-4 text-sm text-ink-soft sm:grid-cols-2">
              <li>{t("admin.fields.mosaicPosition1")}</li>
              <li>{t("admin.fields.mosaicPosition2")}</li>
              <li>{t("admin.fields.mosaicPosition3")}</li>
              <li>{t("admin.fields.mosaicPosition4")}</li>
            </ol>
            <Field
              label={t("admin.fields.mosaicCover")}
              required
              error={err("cover_media_id")}
              fieldPath="cover_media_id"
            >
              <MediaField
                key={`cover-${workspace.model?.shared.revision ?? 0}`}
                value={state.cover_media_id || null}
                preview={previews[state.cover_media_id] ?? null}
                onChange={(id) => set("cover_media_id", id ?? "")}
              />
            </Field>
            <Field
              label={t("admin.fields.mosaicGallery")}
              hint={t("admin.fields.mosaicGalleryHint")}
              fieldPath="gallery"
              error={
                Object.entries(errors).find(([path]) =>
                  path.startsWith("gallery"),
                )?.[1]
              }
            >
              <MediaGalleryField
                key={`gallery-${workspace.model?.shared.revision ?? 0}`}
                value={state.gallery}
                previews={previews}
                onChange={(ids) => set("gallery", ids)}
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title={tp("title")}>
          <DetailEditor mode="sections" {...detailProps} />
        </AdminCard>

        <AdminCard title={t("admin.sections.booking")}>
          <div className="space-y-4">
            <Field
              label={tp("priceMode")}
              hint={
                state.presentation?.price_display === undefined
                  ? tp("inherited")
                  : tp("explicit")
              }
            >
              <Select
                value={state.presentation?.price_display ?? "auto"}
                onChange={(event) => {
                  const next = { ...state.presentation, version: 1 as const };
                  if (event.target.value === "auto") delete next.price_display;
                  else
                    next.price_display = event.target
                      .value as ServicePriceDisplay;
                  set(
                    "presentation",
                    Object.keys(next).length === 1 ? null : next,
                  );
                }}
              >
                {SERVICE_PRICE_DISPLAYS.map((mode) => (
                  <option key={mode} value={mode}>
                    {tp(`modes.${mode}`)}
                  </option>
                ))}
              </Select>
            </Field>
            {state.presentation?.price_display !== undefined ? (
              <AdminButton
                onClick={() => {
                  const next = { ...state.presentation, version: 1 as const };
                  delete next.price_display;
                  set(
                    "presentation",
                    Object.keys(next).length === 1 ? null : next,
                  );
                }}
              >
                {tp("reset")}
              </AdminButton>
            ) : null}
            <details
              open={
                !["hidden", "on_request"].includes(
                  state.presentation?.price_display ?? "auto",
                ) || Boolean(err("price_from") || err("price_suffix"))
              }
            >
              <summary className="mb-3 cursor-pointer text-sm font-semibold">
                {tp("euros")}
              </summary>
              <FieldGrid>
                <Field
                  label={tp("euros")}
                  hint={tp("eurosHint")}
                  error={err("price_from")}
                >
                  <TextInput
                    inputMode="decimal"
                    data-service-path="price_from"
                    value={state.price_from}
                    onChange={(e) => set("price_from", e.target.value)}
                  />
                </Field>
                <Field
                  label={t("admin.fields.priceSuffix")}
                  hint={t("admin.fields.priceSuffixHint")}
                  error={err("price_suffix")}
                >
                  <TextInput
                    data-service-path="price_suffix"
                    value={state.price_suffix}
                    onChange={(e) => set("price_suffix", e.target.value)}
                  />
                </Field>
              </FieldGrid>
            </details>
            <FieldGrid>
              <Field label={t("admin.fields.bookingType")}>
                <Select
                  data-service-path="booking_type"
                  value={state.booking_type}
                  onChange={(e) =>
                    set("booking_type", e.target.value as BookingType)
                  }
                >
                  {BOOKING_TYPES.map((b) => (
                    <option key={b} value={b}>
                      {t(`admin.bookingType.${b}`)}
                    </option>
                  ))}
                </Select>
              </Field>
            </FieldGrid>
            {state.booking_type !== "none" ? (
              <FieldGrid>
                <Field
                  label={t("admin.fields.ctaLabel")}
                  error={err("cta_label")}
                >
                  <TextInput
                    data-service-path="cta_label"
                    value={state.cta_label}
                    onChange={(e) => set("cta_label", e.target.value)}
                  />
                </Field>
                {state.booking_type === "external" ? (
                  <Field
                    label={t("admin.fields.ctaUrl")}
                    error={err("cta_url")}
                  >
                    <TextInput
                      type="url"
                      data-service-path="cta_url"
                      value={state.cta_url}
                      onChange={(e) => set("cta_url", e.target.value)}
                    />
                  </Field>
                ) : null}
              </FieldGrid>
            ) : null}
            <DetailEditor mode="booking" {...detailProps} />
          </div>
        </AdminCard>

        <AdminCard title={t("admin.sections.seo")}>
          <div className="space-y-4">
            <Field
              label={t("admin.fields.ogImage")}
              hint={t("admin.fields.ogImageHint")}
              error={err("og_image_media_id")}
              fieldPath="og_image_media_id"
            >
              <MediaField
                key={`og-${workspace.model?.shared.revision ?? 0}`}
                value={state.og_image_media_id || null}
                preview={previews[state.og_image_media_id] ?? null}
                onChange={(id) => set("og_image_media_id", id ?? "")}
              />
            </Field>

            <Field
              label={t("admin.fields.metaTitle")}
              error={err("meta_title")}
            >
              <TextInput
                data-service-path="meta_title"
                value={state.meta_title}
                onChange={(e) => set("meta_title", e.target.value)}
              />
            </Field>
            <Field
              label={t("admin.fields.metaDescription")}
              error={err("meta_description")}
            >
              <TextArea
                data-service-path="meta_description"
                value={state.meta_description}
                onChange={(e) => set("meta_description", e.target.value)}
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title={tp("icons")}>
          <fieldset disabled={!editableIcons}>
            <details>
              <summary className="cursor-pointer text-sm font-semibold">
                {tp("icons")}
              </summary>
              <div className="mt-4 space-y-4">
                {SERVICE_ICON_SLOTS.map((slot) => (
                  <div key={slot} className="space-y-2">
                    <Field
                      label={iconLabels[slot]}
                      error={err(`presentation.icons.${slot}`)}
                    >
                      <IconField
                        value={state.presentation?.icons?.[slot] ?? ""}
                        emptyLabel={tp("globalIcon")}
                        allowEmpty
                        onChange={(value) => {
                          const icons = { ...state.presentation?.icons };
                          if (isIconName(value)) icons[slot] = value;
                          else delete icons[slot];
                          const next = {
                            ...state.presentation,
                            version: 1 as const,
                            icons,
                          };
                          if (!Object.keys(icons).length)
                            delete (next as FormState["presentation"])!.icons;
                          set(
                            "presentation",
                            Object.keys(next).length === 1 ? null : next,
                          );
                        }}
                      />
                    </Field>
                    {state.presentation?.icons?.[slot] ? (
                      <AdminButton
                        onClick={() => {
                          const icons = { ...state.presentation?.icons };
                          delete icons[slot];
                          const next = {
                            ...state.presentation,
                            version: 1 as const,
                            icons,
                          };
                          if (!Object.keys(icons).length)
                            delete (
                              next as NonNullable<FormState["presentation"]>
                            ).icons;
                          set(
                            "presentation",
                            Object.keys(next).length === 1 ? null : next,
                          );
                        }}
                      >
                        {tp("globalIcon")}
                      </AdminButton>
                    ) : null}
                  </div>
                ))}
              </div>
            </details>
          </fieldset>
        </AdminCard>
        <ServiceCopyEditor
          data-service-path="copy"
          value={state.copy}
          onChange={(copy) => set("copy", copy)}
          errors={errors}
        />
      </fieldset>
      <FormActions>
        {persisted ? (
          <AdminButton onClick={onVisibility} disabled={busy}>
            {tv(workspace.model?.status === "archived" ? "restore" : "archive")}
          </AdminButton>
        ) : null}
        {persisted ? (
          <AdminButton
            variant="danger"
            onClick={onDelete}
            disabled={pending || uploading}
          >
            {tb("actions.delete")}
          </AdminButton>
        ) : null}
        <AdminButton
          variant="ghost"
          onClick={goBack}
          disabled={pending || uploading}
        >
          {tb("actions.cancel")}
        </AdminButton>
        {preparing ? (
          <p role="status" className="text-xs text-ink-soft">
            {tb("media.waitForMedia")}
          </p>
        ) : null}
        <AdminButton
          variant="primary"
          onClick={onSubmit}
          disabled={busy || own.conflict}
        >
          {te(operation === "save" ? "saving" : "saveDraft")}
        </AdminButton>
        <AdminButton
          variant="primary"
          onClick={onPublish}
          disabled={
            busy ||
            own.conflict ||
            !persisted ||
            !model?.draft ||
            dirty ||
            publicationNeedsSave
          }
        >
          {te(operation === "publish" ? "publishing" : "publish")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
