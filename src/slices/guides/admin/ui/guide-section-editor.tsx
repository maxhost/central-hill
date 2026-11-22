"use client";
import { useTranslations } from "next-intl";
import {
  Field,
  Checkbox,
  AdminButton,
  MediaField,
  type AdminMediaPreview,
} from "@slices/backoffice/contract";
import type { GuideSectionEdit, GuidePlaceEdit } from "../model";
import { GUIDE_MODULE_KEYS, parseGuidePresentation } from "../../presentation";
import { GuidePlaceEditor, GuideTextField } from "./guide-place-editor";
import { fieldError } from "./editor-model";
export function GuideSectionEditor({
  section,
  previews,
  errors,
  dirty,
  hasPendingChildren,
  persisted,
  disabled,
  canOrder,
  first,
  last,
  placeState,
  onChange,
  onPreview,
  onDelete,
  onMove,
  onAddPlace,
  onDeletePlace,
  onMovePlace,
}: {
  section: GuideSectionEdit;
  previews: Record<string, AdminMediaPreview>;
  errors: Record<string, string>;
  dirty: boolean;
  hasPendingChildren: boolean;
  persisted: boolean;
  disabled: boolean;
  canOrder: boolean;
  first: boolean;
  last: boolean;
  placeState: (place: GuidePlaceEdit) => {
    dirty: boolean;
    persisted: boolean;
    errors: Record<string, string>;
  };
  onChange: (section: GuideSectionEdit) => void;
  onPreview: (preview: AdminMediaPreview | null) => void;
  onDelete: () => void;
  onMove: (offset: number) => void;
  onAddPlace: () => void;
  onDeletePlace: (id: string) => void;
  onMovePlace: (id: string, offset: number) => void;
}) {
  const editorial = useTranslations("guides.editorial");
  const t = useTranslations("guides.admin"),
    presentation = parseGuidePresentation(section.presentation);
  const update = <K extends keyof GuideSectionEdit>(
    key: K,
    value: GuideSectionEdit[K],
  ) => onChange({ ...section, [key]: value });
  const placesRequired =
    presentation?.enabled !== false && presentation?.modules?.places === true;
  const placesDescription =
    [
      placesRequired ? `${section.id}-places-required` : null,
      fieldError(errors, "places") ? `${section.id}-places-error` : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  const photos =
    Number(Boolean(section.header_media_id)) +
    section.places.filter((p) => p.media_id).length;
  return (
    <details
      id={`entity-${section.id}`}
      open={
        !persisted ||
        dirty ||
        hasPendingChildren ||
        Object.keys(errors).length > 0
      }
      className="rounded-lg border border-line bg-surface p-4 sm:p-5"
    >
      <summary className="cursor-pointer py-1 text-sm font-semibold text-ink">
        <span>{section.title || editorial("newSection")}</span>
        <span className="ml-3 text-xs font-normal text-ink-soft">
          {t("sectionSummary", { places: section.places.length, photos })}
        </span>
        {dirty || hasPendingChildren ? (
          <span className="ml-3 text-xs text-accent-deep">{t("pending")}</span>
        ) : null}
      </summary>
      <fieldset disabled={disabled} className="mt-5 min-w-0 space-y-5">
        <GuideTextField
          entityId={section.id}
          name="title"
          required={presentation?.enabled !== false}
          value={section.title}
          errors={errors}
          maxLength={200}
          onChange={(v) => update("title", v)}
        />
        <Checkbox
          label={t("sectionEnabled")}
          checked={presentation?.enabled !== false}
          onChange={(e) =>
            update("presentation", {
              ...(presentation ?? { version: 1 }),
              enabled: e.target.checked,
            })
          }
        />
        <p className="text-xs text-ink-soft">{t("moduleInherited")}</p>
        <p className="text-xs text-ink-soft">{editorial("sharedHint")}</p>
        <div
          id={`${section.id}-presentation`}
          role="group"
          aria-label="Section content"
          aria-describedby={
            errors.presentation ? `${section.id}-presentation-error` : undefined
          }
          className={`space-y-4 ${errors.presentation ? "rounded-md border border-red-600 p-3" : ""}`}
        >
          {errors.presentation ? (
            <p
              id={`${section.id}-presentation-error`}
              role="alert"
              className="text-sm text-red-700"
            >
              {errors.presentation}
            </p>
          ) : null}
          <h3 className="text-sm font-semibold">
            {t("modules")}{" "}
            {presentation?.enabled !== false ? (
              <span aria-hidden="true" className="text-red-700">
                *
              </span>
            ) : null}
          </h3>
          {GUIDE_MODULE_KEYS.map((key) => (
            <div key={key} className="space-y-3 border-t border-line pt-4">
              <div id={`${section.id}-${key}-module`}>
                <Checkbox
                  aria-invalid={Boolean(fieldError(errors, key))}
                  label={t(`labels.${key}`)}
                  checked={presentation?.modules?.[key] !== false}
                  onChange={(e) =>
                    update("presentation", {
                      ...(presentation ?? { version: 1 }),
                      modules: {
                        ...presentation?.modules,
                        [key]: e.target.checked,
                      },
                    })
                  }
                />
              </div>
              {fieldError(errors, key) ? (
                <p
                  id={`${section.id}-${key}-error`}
                  role="alert"
                  className="text-sm text-red-700"
                >
                  {fieldError(errors, key)}
                </p>
              ) : null}
              {presentation?.modules?.[key] !== false ? (
                <div className="space-y-4 pl-1">
                  {key === "body" || key === "local_tip" ? (
                    <GuideTextField
                      entityId={section.id}
                      name={key}
                      required={
                        presentation?.enabled !== false &&
                        presentation?.modules?.[key] === true
                      }
                      value={section[key]}
                      errors={errors}
                      maxLength={key === "body" ? 4000 : 600}
                      multiline
                      onChange={(v) => update(key, v || null)}
                    />
                  ) : null}
                  {key === "image" ? (
                    <Field
                      htmlFor={`${section.id}-header_media_id`}
                      errorPath={`${section.id}.header_media_id`}
                      required={
                        presentation?.enabled !== false &&
                        presentation?.modules?.image === true
                      }
                      label={t("labels.header_media_id")}
                      error={fieldError(errors, "header_media_id")}
                      hint={t("photoHint")}
                    >
                      <MediaField
                        value={section.header_media_id}
                        preview={
                          section.header_media_id
                            ? previews[section.header_media_id]
                            : null
                        }
                        onChange={(id, preview) => {
                          onPreview(preview);
                          update("header_media_id", id);
                        }}
                      />
                    </Field>
                  ) : null}
                  {key === "cta" ? (
                    <>
                      <GuideTextField
                        entityId={section.id}
                        name="cta_label"
                        required={
                          presentation?.enabled !== false &&
                          (presentation?.modules?.cta === true ||
                            Boolean(section.cta_url) ||
                            Boolean(section.cta_label?.trim()))
                        }
                        value={section.cta_label}
                        errors={errors}
                        maxLength={80}
                        onChange={(v) => update("cta_label", v || null)}
                      />
                      <GuideTextField
                        entityId={section.id}
                        name="cta_url"
                        required={
                          presentation?.enabled !== false &&
                          (presentation?.modules?.cta === true ||
                            Boolean(section.cta_url) ||
                            Boolean(section.cta_label?.trim()))
                        }
                        value={section.cta_url}
                        errors={errors}
                        type="url"
                        maxLength={2000}
                        onChange={(v) => update("cta_url", v || null)}
                      />
                    </>
                  ) : null}
                  {key === "places" ? (
                    <div
                      role="group"
                      aria-labelledby={`${section.id}-places-heading`}
                      aria-describedby={placesDescription}
                      className={
                        fieldError(errors, "places")
                          ? "space-y-4 rounded-md border border-red-600 p-3"
                          : "space-y-4"
                      }
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <h4
                          id={`${section.id}-places-heading`}
                          className="text-sm font-medium"
                        >
                          {t("places")}
                          {placesRequired ? (
                            <span
                              aria-hidden="true"
                              className="ml-0.5 text-accent-deep"
                            >
                              *
                            </span>
                          ) : null}
                        </h4>
                        <AdminButton
                          id={`${section.id}-places`}
                          aria-describedby={placesDescription}
                          className={
                            fieldError(errors, "places")
                              ? "border-red-600 text-red-700"
                              : undefined
                          }
                          onClick={onAddPlace}
                        >
                          {t("addPlace")}
                        </AdminButton>
                      </div>
                      {placesRequired ? (
                        <p
                          id={`${section.id}-places-required`}
                          className="text-xs text-ink-soft"
                        >
                          Keep at least one place while this module is switched
                          on.
                        </p>
                      ) : null}
                      {!section.places.length ? (
                        <p className="text-sm text-ink-soft">
                          {t("emptyPlaces")}
                        </p>
                      ) : null}
                      {section.places.map((place, index) => (
                        <GuidePlaceEditor
                          key={place.id}
                          place={place}
                          previews={previews}
                          onPreview={onPreview}
                          {...placeState(place)}
                          disabled={disabled}
                          canOrder={canOrder}
                          first={index === 0}
                          last={index === section.places.length - 1}
                          onChange={(next) =>
                            update(
                              "places",
                              section.places.map((p) =>
                                p.id === next.id ? next : p,
                              ),
                            )
                          }
                          onDelete={() => onDeletePlace(place.id)}
                          onMove={(offset) => onMovePlace(place.id, offset)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <AdminButton disabled={!canOrder || first} onClick={() => onMove(-1)}>
            {t("moveUp")}
          </AdminButton>
          <AdminButton disabled={!canOrder || last} onClick={() => onMove(1)}>
            {t("moveDown")}
          </AdminButton>
          <AdminButton variant="danger" onClick={onDelete}>
            {t("deleteSection")}
          </AdminButton>
        </div>
      </fieldset>
    </details>
  );
}
