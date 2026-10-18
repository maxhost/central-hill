"use client";
import { useTranslations } from "next-intl";
import type { GuidePlaceEdit } from "../model";
import {
  Field,
  TextInput,
  TextArea,
  Select,
  FieldGrid,
  AdminButton,
  MediaField,
  type AdminMediaPreview,
} from "@slices/backoffice/contract";
import { fieldError } from "./editor-model";

export function GuideTextField({
  entityId,
  name,
  value,
  onChange,
  errors,
  maxLength,
  multiline = false,
  required = false,
  type = "text",
}: {
  entityId: string;
  name: string;
  value: string | number | null;
  onChange: (value: string) => void;
  errors: Record<string, string>;
  maxLength?: number;
  multiline?: boolean;
  required?: boolean;
  type?: string;
}) {
  const t = useTranslations("guides.admin"),
    id = `${entityId}-${name}`,
    error = fieldError(errors, name);
  const props = {
    id,
    value: value ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    maxLength,
    required,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
  };
  return (
    <Field label={t(`labels.${name}`)} htmlFor={id} required={required}>
      {multiline ? (
        <TextArea {...props} />
      ) : (
        <TextInput
          {...props}
          type={type}
          step={
            type === "number" ? (name === "position" ? 1 : "any") : undefined
          }
        />
      )}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </Field>
  );
}
export function GuidePlaceEditor({
  place,
  previews,
  errors,
  dirty,
  persisted,
  disabled,
  canOrder,
  first,
  last,
  onChange,
  onPreview,
  onSave,
  onDelete,
  onMove,
}: {
  place: GuidePlaceEdit;
  previews: Record<string, AdminMediaPreview>;
  errors: Record<string, string>;
  dirty: boolean;
  persisted: boolean;
  disabled: boolean;
  canOrder: boolean;
  first: boolean;
  last: boolean;
  onChange: (next: GuidePlaceEdit) => void;
  onPreview: (preview: AdminMediaPreview | null) => void;
  onSave: () => void;
  onDelete: () => void;
  onMove: (offset: number) => void;
}) {
  const t = useTranslations("guides.admin");
  const update = <K extends keyof GuidePlaceEdit>(
    key: K,
    value: GuidePlaceEdit[K],
  ) => onChange({ ...place, [key]: value });
  const text = (
    name:
      | "name"
      | "description"
      | "category"
      | "address"
      | "phone"
      | "opening_hours"
      | "website_url"
      | "booking_url",
    maxLength: number,
    multiline = false,
  ) => (
    <GuideTextField
      entityId={place.id}
      name={name}
      value={place[name]}
      errors={errors}
      maxLength={maxLength}
      multiline={multiline}
      required={name === "name"}
      type={name.endsWith("_url") ? "url" : "text"}
      onChange={(v) => update(name, name === "name" ? v : v || null)}
    />
  );
  return (
    <details
      id={`entity-${place.id}`}
      open={dirty || Object.keys(errors).length > 0}
      className="border-t border-line py-4"
    >
      <summary className="cursor-pointer py-2 text-sm font-semibold text-ink">
        {place.name || t("addPlace")}{" "}
        {dirty ? (
          <span className="ml-2 text-xs text-accent-deep">{t("pending")}</span>
        ) : null}
      </summary>
      <fieldset disabled={disabled} className="mt-4 min-w-0 space-y-4">
        <FieldGrid>
          {text("name", 160)}
          {text("category", 80)}
        </FieldGrid>
        {text("description", 1200, true)}
        <FieldGrid>
          {text("address", 240)}
          {text("phone", 40)}
          <Field
            label={t("labels.price_tier")}
            htmlFor={`${place.id}-price_tier`}
            error={fieldError(errors, "price_tier")}
          >
            <Select
              id={`${place.id}-price_tier`}
              value={place.price_tier ?? ""}
              onChange={(e) =>
                update(
                  "price_tier",
                  (e.target.value || null) as GuidePlaceEdit["price_tier"],
                )
              }
            >
              <option value="">{t("optional")}</option>
              <option value="budget">€</option>
              <option value="mid">€€</option>
              <option value="premium">€€€</option>
            </Select>
          </Field>
          {text("opening_hours", 400, true)}
          {text("website_url", 2000)}
          {text("booking_url", 2000)}
          {(["latitude", "longitude"] as const).map((name) => (
            <GuideTextField
              key={name}
              entityId={place.id}
              name={name}
              value={place[name]}
              errors={errors}
              type="number"
              onChange={(v) => update(name, v === "" ? null : Number(v))}
            />
          ))}
        </FieldGrid>
        <Field
          label={t("labels.media_id")}
          error={fieldError(errors, "media_id")}
          hint={t("photoHint")}
        >
          <MediaField
            value={place.media_id}
            preview={place.media_id ? previews[place.media_id] : null}
            onChange={(id, preview) => {
              onPreview(preview);
              update("media_id", id);
            }}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <AdminButton variant="primary" disabled={!dirty} onClick={onSave}>
            {t("savePlace")}
          </AdminButton>
          <AdminButton
            disabled={!canOrder || first}
            onClick={() => onMove(-1)}
            aria-label={`${t("moveUp")}: ${place.name}`}
          >
            {t("moveUp")}
          </AdminButton>
          <AdminButton
            disabled={!canOrder || last}
            onClick={() => onMove(1)}
            aria-label={`${t("moveDown")}: ${place.name}`}
          >
            {t("moveDown")}
          </AdminButton>
          <AdminButton variant="danger" onClick={onDelete}>
            {t("deletePlace")}
          </AdminButton>
          {persisted ? (
            <a
              className="text-sm text-accent-deep underline underline-offset-4"
              href={`/admin/translations/guide_place/${place.id}`}
            >
              {t("translations")}
            </a>
          ) : null}
        </div>
      </fieldset>
    </details>
  );
}
