"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { isIconName } from "@core/ui/icons/names";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
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

import { deleteService, saveService } from "../actions";
import {
  initialState,
  buildPayload,
  discardSection,
  guardMessageKey,
  STATUSES,
  BOOKING_TYPES,
  type FormState,
  type Status,
  type BookingType,
  setSectionChoice,
} from "../form-model";
import type { ServiceEditData } from "../queries";
import { DetailEditor } from "./detail-editor";
import { ServiceField as Field } from "./service-section-controls";
import { ServiceCopyEditor } from "./service-copy-editor";
import {
  SERVICE_ICON_SLOTS,
  SERVICE_PRICE_DISPLAYS,
  type ServiceSectionKey,
  type ServicePriceDisplay,
} from "../../presentation";
import { serviceSaveInput, servicePresentationErrors } from "../validation";

/**
 * Service create/edit form (S12) — one client island for `/admin/services/new` and
 * `/admin/services/[id]`. Posts through `saveService`; the category selector is fed
 * from this slice's admin queries. Source [T] text is authored in English; the
 * booking CTA fields are gated by `booking_type`.
 */

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
  const tp = useTranslations("services.admin.presentation");
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const queue = useMediaQueue();
  // A pick still being reserved isn't in the form's value yet — Save waits for it.
  const preparing = queue.isPreparing;
  const [state, setState] = useState<FormState>(() =>
    initialState(initial, categories[0]?.id ?? ""),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(() =>
    initialState(initial, categories[0]?.id ?? ""),
  );
  const [uploading, setUploading] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const bypass = useRef(false);
  const dirty =
    JSON.stringify(state) !== JSON.stringify(saved) ||
    queue.hasPending ||
    preparing;
  const corrupt =
    initial?.integrity.detail === "invalid" ||
    initial?.integrity.presentation === "invalid";
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty && !bypass.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const canLeave = () => !dirty || window.confirm(tp("unsaved"));
  const goBack = () => {
    if (canLeave()) router.push("/admin/services");
  };
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
    const localized = Object.fromEntries(
      Object.entries(next).map(([path, message]) => [
        path,
        guardMessageKey(path, message)
          ? tp(guardMessageKey(path, message)!)
          : message,
      ]),
    );
    setErrors(localized);
    setBanner(tp("saveError"));
  }
  const [banner, setBanner] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const err = (key: string) => errors[key];

  useEffect(() => {
    const first = Object.entries(errors)[0];
    if (first) focusError(...first);
  }, [errors]);

  function onSubmit() {
    if (preparing || pending || uploading || corrupt) return;
    setBanner(null);
    let payload: ReturnType<typeof buildPayload>;
    try {
      payload = buildPayload(state, initial?.id);
    } catch {
      reportErrors({ price_from: tp("invalidEuros") });
      return;
    }
    const parsed = serviceSaveInput.safeParse(payload);
    if (!parsed.success) {
      reportErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ]),
        ),
      );
      return;
    }
    const preflight = servicePresentationErrors(
      parsed.data,
      state.presentation,
    );
    if (Object.keys(preflight).length) {
      reportErrors(preflight);
      return;
    }
    setErrors({});
    setUploading(true);
    void (async () => {
      try {
        if (!(await queue.flush())) {
          setBanner(tp("saveError"));
          setUploading(false);
          return;
        }
        start(async () => {
          try {
            const result = await saveService(payload);
            if (result.ok) {
              setSaved(structuredClone(state));
              setBanner(tb("actions.saved"));
              if (!initial) {
                bypass.current = true;
                router.push(`/admin/services/${result.id}`);
              } else router.refresh();
            } else if (result.error === "validation")
              reportErrors(result.fieldErrors);
            else if (result.error === "slug_conflict")
              reportErrors({ slug: t("admin.errors.slugConflict") });
            else
              setBanner(
                result.error === "invalid_stored_content"
                  ? tp("integrity")
                  : result.error === "unsupported_actor_id"
                    ? tp("actor")
                    : tp("saveError"),
              );
          } catch {
            setBanner(tp("saveError"));
          } finally {
            setUploading(false);
          }
        });
      } catch {
        setBanner(tp("saveError"));
        setUploading(false);
      }
    })();
  }

  function onDelete() {
    if (!initial) return;
    if (!window.confirm(tb("actions.confirmDelete"))) return;
    start(async () => {
      const result = await deleteService(initial.id);
      if (result.ok) {
        bypass.current = true;
        router.push("/admin/services");
      } else setBanner(tb("actions.saveError"));
    });
  }

  const detailProps = {
    value: state.detail,
    onChange: (detail: FormState["detail"]) => set("detail", detail),
    errors,
    previews,
    presentation: state.presentation,
    onSectionChoice: (key: ServiceSectionKey, choice: boolean | undefined) =>
      set("presentation", setSectionChoice(state.presentation, key, choice)),
    onDiscard: (key: ServiceSectionKey) => {
      const next = discardSection(state, saved, key);
      const retained = new Set([
        next.cover_media_id,
        next.og_image_media_id,
        ...next.gallery,
        ...next.detail.itinerary.map((step) => step.media_id),
      ]);
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
          initial ? state.name || t("admin.editTitle") : t("admin.newTitle")
        }
        description={t("admin.formSubtitle")}
        actions={
          <Link
            href="/admin/services"
            onClick={(event) => {
              if (!canLeave()) event.preventDefault();
            }}
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

      {corrupt ? (
        <p
          role="alert"
          className="rounded-md border border-line px-4 py-3 text-sm text-red-700"
        >
          {tp("integrity")}
        </p>
      ) : null}
      <p className="text-sm text-ink-soft">{tp("source")}</p>
      {initial?.status === "published" ? (
        <Link
          href={`/${locale}/services/${initial.slug}`}
          onClick={(event) => {
            if (!canLeave()) event.preventDefault();
          }}
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
        disabled={pending || uploading || corrupt}
        className="space-y-6"
      >
        <AdminCard title={t("admin.sections.status")}>
          <FieldGrid>
            <Field label={t("admin.fields.status")}>
              <Select
                data-service-path="status"
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
                value={state.category_id}
                onChange={(e) => set("category_id", e.target.value)}
              >
                <option value="">{t("admin.fields.choose")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
            <p className="text-sm text-ink-soft">{t("admin.fields.mosaicHint")}</p>
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
        </AdminCard>
        <ServiceCopyEditor
          data-service-path="copy"
          value={state.copy}
          onChange={(copy) => set("copy", copy)}
          errors={errors}
        />
      </fieldset>
      <FormActions>
        {initial ? (
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
          disabled={pending || uploading || preparing || corrupt}
        >
          {pending || uploading ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
