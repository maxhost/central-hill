"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AdminButton,
  AdminCard,
  AdminPageHeader,
  Checkbox,
  Field,
  FieldGrid,
  FormActions,
  type AdminMediaPreview,
  MediaField,
  MediaGalleryField,
  Select,
  TextArea,
  TextInput,
} from "@slices/backoffice/contract";
import { deleteBuilding, saveBuilding } from "../actions";
import type { AmenityOption, BuildingEditData, LocationOptions } from "../queries";

/**
 * Building create/edit form (S12) — the single client island for both
 * `/admin/buildings/new` and `/admin/buildings/[id]`. Holds the whole form state,
 * posts it through `saveBuilding` (which validates + persists content/slug/relations),
 * and surfaces per-field errors it returns. Media uses the shared picker islands;
 * source [T] text is authored here in English.
 */

type Status = "draft" | "published" | "archived";

interface FormState {
  slug: string;
  status: Status;
  position: string;
  is_new: boolean;
  is_featured: boolean;
  city_id: string;
  neighbourhood_id: string;
  street_address: string;
  latitude: string;
  longitude: string;
  cover_media_id: string;
  og_image_media_id: string;
  avantio_id: string;
  avantio_url: string;
  booking_enabled: boolean;
  name: string;
  headline: string;
  teaser: string;
  description_intro: string;
  description_neighbourhood: string;
  meta_title: string;
  meta_description: string;
  gallery: string[];
  amenity_ids: string[];
  faq: { id?: string; question: string; answer: string }[];
}

const STATUSES: Status[] = ["draft", "published", "archived"];

function initialState(data: BuildingEditData | null): FormState {
  return {
    slug: data?.slug ?? "",
    status: data?.status ?? "draft",
    position: String(data?.position ?? 0),
    is_new: data?.is_new ?? false,
    is_featured: data?.is_featured ?? false,
    city_id: data?.city_id ?? "",
    neighbourhood_id: data?.neighbourhood_id ?? "",
    street_address: data?.street_address ?? "",
    latitude: data?.latitude != null ? String(data.latitude) : "",
    longitude: data?.longitude != null ? String(data.longitude) : "",
    cover_media_id: data?.cover_media_id ?? "",
    og_image_media_id: data?.og_image_media_id ?? "",
    avantio_id: data?.avantio_id ?? "",
    avantio_url: data?.avantio_url ?? "",
    booking_enabled: data?.booking_enabled ?? false,
    name: data?.name ?? "",
    headline: data?.headline ?? "",
    teaser: data?.teaser ?? "",
    description_intro: data?.description_intro ?? "",
    description_neighbourhood: data?.description_neighbourhood ?? "",
    meta_title: data?.meta_title ?? "",
    meta_description: data?.meta_description ?? "",
    gallery: data?.gallery ?? [],
    amenity_ids: data?.amenity_ids ?? [],
    faq: data?.faq.map((f) => ({ id: f.id, question: f.question, answer: f.answer })) ?? [],
  };
}

function buildPayload(s: FormState, id: string | undefined) {
  const orNull = (v: string) => (v.trim() === "" ? null : v.trim());
  const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));
  return {
    id,
    slug: s.slug.trim(),
    status: s.status,
    position: Number.parseInt(s.position, 10) || 0,
    is_new: s.is_new,
    is_featured: s.is_featured,
    city_id: s.city_id,
    neighbourhood_id: orNull(s.neighbourhood_id),
    street_address: s.street_address.trim(),
    latitude: numOrNull(s.latitude),
    longitude: numOrNull(s.longitude),
    cover_media_id: s.cover_media_id || null,
    og_image_media_id: orNull(s.og_image_media_id),
    avantio_id: orNull(s.avantio_id),
    avantio_url: orNull(s.avantio_url),
    booking_enabled: s.booking_enabled,
    name: s.name.trim(),
    headline: s.headline.trim(),
    teaser: s.teaser.trim(),
    description_intro: s.description_intro.trim(),
    description_neighbourhood: orNull(s.description_neighbourhood),
    meta_title: orNull(s.meta_title),
    meta_description: orNull(s.meta_description),
    gallery: s.gallery,
    amenity_ids: s.amenity_ids,
    faq: s.faq.map((f) => ({ id: f.id, question: f.question.trim(), answer: f.answer.trim() })),
  };
}

export function BuildingForm({
  initial,
  previews,
  amenities,
  locations,
}: {
  initial: BuildingEditData | null;
  previews: Record<string, AdminMediaPreview>;
  amenities: AmenityOption[];
  locations: LocationOptions;
}) {
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

  const neighbourhoods = useMemo(
    () => locations.neighbourhoods.filter((n) => n.cityId === state.city_id),
    [locations.neighbourhoods, state.city_id],
  );

  const amenityGroups = useMemo(() => {
    const groups = new Map<string, AmenityOption[]>();
    for (const a of amenities) {
      const key = a.group ?? "";
      const list = groups.get(key) ?? [];
      list.push(a);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [amenities]);

  function onCityChange(cityId: string) {
    setState((prev) => {
      const stillValid = locations.neighbourhoods.some(
        (n) => n.id === prev.neighbourhood_id && n.cityId === cityId,
      );
      return { ...prev, city_id: cityId, neighbourhood_id: stillValid ? prev.neighbourhood_id : "" };
    });
  }

  function toggleAmenity(id: string) {
    setState((prev) => ({
      ...prev,
      amenity_ids: prev.amenity_ids.includes(id)
        ? prev.amenity_ids.filter((x) => x !== id)
        : [...prev.amenity_ids, id],
    }));
  }

  function setFaq(index: number, patch: Partial<{ question: string; answer: string }>) {
    setState((prev) => {
      const faq = [...prev.faq];
      faq[index] = { ...faq[index]!, ...patch };
      return { ...prev, faq };
    });
  }

  function addFaq() {
    setState((prev) => ({ ...prev, faq: [...prev.faq, { question: "", answer: "" }] }));
  }

  function removeFaq(index: number) {
    setState((prev) => ({ ...prev, faq: prev.faq.filter((_, i) => i !== index) }));
  }

  function moveFaq(index: number, delta: number) {
    setState((prev) => {
      const faq = [...prev.faq];
      const target = index + delta;
      if (target < 0 || target >= faq.length) return prev;
      [faq[index], faq[target]] = [faq[target]!, faq[index]!];
      return { ...prev, faq };
    });
  }

  function onSubmit() {
    setBanner(null);
    setErrors({});
    start(async () => {
      const result = await saveBuilding(buildPayload(state, initial?.id));
      if (result.ok) {
        if (!initial) {
          router.push(`/admin/buildings/${result.id}`);
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
      } else {
        setBanner(tb("actions.saveError"));
      }
    });
  }

  function onDelete() {
    if (!initial) return;
    if (!window.confirm(tb("actions.confirmDelete"))) return;
    start(async () => {
      const result = await deleteBuilding(initial.id);
      if (result.ok) router.push("/admin/buildings");
      else setBanner(tb("actions.saveError"));
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={initial ? state.name || t("admin.editTitle") : t("admin.newTitle")}
        description={t("admin.formSubtitle")}
        actions={
          <Link href="/admin/buildings" className="text-sm text-ink-soft hover:text-ink">
            ← {t("admin.backToList")}
          </Link>
        }
      />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">{banner}</p>
      ) : null}

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
        <div className="mt-4 flex flex-wrap gap-6">
          <Checkbox
            label={t("admin.fields.isFeatured")}
            checked={state.is_featured}
            onChange={(e) => set("is_featured", e.target.checked)}
          />
          <Checkbox
            label={t("admin.fields.isNew")}
            checked={state.is_new}
            onChange={(e) => set("is_new", e.target.checked)}
          />
        </div>
      </AdminCard>

      <AdminCard title={t("admin.sections.identity")}>
        <div className="space-y-4">
          <Field label={t("admin.fields.name")} required error={err("name")}>
            <TextInput value={state.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field
            label={t("admin.fields.slug")}
            required
            hint={t("admin.fields.slugHint")}
            error={err("slug")}
          >
            <TextInput value={state.slug} onChange={(e) => set("slug", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.headline")} required error={err("headline")}>
            <TextInput value={state.headline} onChange={(e) => set("headline", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.teaser")} required error={err("teaser")}>
            <TextArea value={state.teaser} onChange={(e) => set("teaser", e.target.value)} />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.sections.location")}>
        <FieldGrid>
          <Field label={t("admin.fields.city")} required error={err("city_id")}>
            <Select value={state.city_id} onChange={(e) => onCityChange(e.target.value)}>
              <option value="">{t("admin.fields.choose")}</option>
              {locations.cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("admin.fields.neighbourhood")}>
            <Select
              value={state.neighbourhood_id}
              onChange={(e) => set("neighbourhood_id", e.target.value)}
              disabled={!state.city_id}
            >
              <option value="">{t("admin.fields.none")}</option>
              {neighbourhoods.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </Select>
          </Field>
        </FieldGrid>
        <div className="mt-4">
          <Field label={t("admin.fields.streetAddress")} required error={err("street_address")}>
            <TextInput
              value={state.street_address}
              onChange={(e) => set("street_address", e.target.value)}
            />
          </Field>
        </div>
        <FieldGrid className="mt-4">
          <Field label={t("admin.fields.latitude")} error={err("latitude")}>
            <TextInput
              type="number"
              step="any"
              value={state.latitude}
              onChange={(e) => set("latitude", e.target.value)}
            />
          </Field>
          <Field label={t("admin.fields.longitude")} error={err("longitude")}>
            <TextInput
              type="number"
              step="any"
              value={state.longitude}
              onChange={(e) => set("longitude", e.target.value)}
            />
          </Field>
        </FieldGrid>
      </AdminCard>

      <AdminCard title={t("admin.sections.media")}>
        <div className="space-y-5">
          <Field label={t("admin.fields.cover")} hint={t("admin.fields.coverHint")} error={err("cover_media_id")}>
            <MediaField
              value={state.cover_media_id || null}
              preview={previews[state.cover_media_id] ?? null}
              onChange={(id) => set("cover_media_id", id ?? "")}
            />
          </Field>
          <Field label={t("admin.fields.ogImage")} hint={t("admin.fields.ogImageHint")}>
            <MediaField
              value={state.og_image_media_id || null}
              preview={previews[state.og_image_media_id] ?? null}
              onChange={(id) => set("og_image_media_id", id ?? "")}
            />
          </Field>
          <Field label={t("admin.fields.gallery")}>
            <MediaGalleryField
              value={state.gallery}
              previews={previews}
              onChange={(ids) => set("gallery", ids)}
            />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.sections.descriptions")}>
        <div className="space-y-4">
          <Field label={t("admin.fields.descriptionIntro")} required error={err("description_intro")}>
            <TextArea
              rows={5}
              value={state.description_intro}
              onChange={(e) => set("description_intro", e.target.value)}
            />
          </Field>
          <Field label={t("admin.fields.descriptionNeighbourhood")}>
            <TextArea
              rows={5}
              value={state.description_neighbourhood}
              onChange={(e) => set("description_neighbourhood", e.target.value)}
            />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.sections.amenities")}>
        {amenities.length === 0 ? (
          <p className="text-sm text-ink-soft">{t("admin.noAmenities")}</p>
        ) : (
          <div className="space-y-4">
            {amenityGroups.map(([group, items]) => (
              <div key={group}>
                {group ? (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    {group}
                  </p>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((a) => (
                    <Checkbox
                      key={a.id}
                      label={a.label}
                      checked={state.amenity_ids.includes(a.id)}
                      onChange={() => toggleAmenity(a.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard title={t("admin.sections.faq")}>
        <div className="space-y-4">
          {state.faq.map((item, index) => (
            <div key={index} className="rounded-md border border-line p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <AdminButton onClick={() => moveFaq(index, -1)} disabled={index === 0}>
                    ↑
                  </AdminButton>
                  <AdminButton
                    onClick={() => moveFaq(index, 1)}
                    disabled={index === state.faq.length - 1}
                  >
                    ↓
                  </AdminButton>
                  <AdminButton variant="danger" onClick={() => removeFaq(index)}>
                    {tb("actions.delete")}
                  </AdminButton>
                </div>
              </div>
              <div className="space-y-3">
                <Field label={t("admin.fields.question")} error={err(`faq.${index}.question`)}>
                  <TextInput
                    value={item.question}
                    onChange={(e) => setFaq(index, { question: e.target.value })}
                  />
                </Field>
                <Field label={t("admin.fields.answer")} error={err(`faq.${index}.answer`)}>
                  <TextArea
                    value={item.answer}
                    onChange={(e) => setFaq(index, { answer: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          ))}
          <AdminButton onClick={addFaq}>+ {t("admin.addFaq")}</AdminButton>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.sections.booking")}>
        <div className="mb-4">
          <Checkbox
            label={t("admin.fields.bookingEnabled")}
            checked={state.booking_enabled}
            onChange={(e) => set("booking_enabled", e.target.checked)}
          />
          <p className="mt-1 text-xs text-ink-soft">{t("admin.fields.bookingEnabledHint")}</p>
        </div>
        <FieldGrid>
          <Field label={t("admin.fields.avantioId")} error={err("avantio_id")}>
            <TextInput value={state.avantio_id} onChange={(e) => set("avantio_id", e.target.value)} />
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

      <AdminCard title={t("admin.sections.seo")}>
        <div className="space-y-4">
          <Field label={t("admin.fields.metaTitle")} error={err("meta_title")}>
            <TextInput value={state.meta_title} onChange={(e) => set("meta_title", e.target.value)} />
          </Field>
          <Field label={t("admin.fields.metaDescription")} error={err("meta_description")}>
            <TextArea
              value={state.meta_description}
              onChange={(e) => set("meta_description", e.target.value)}
            />
          </Field>
        </div>
      </AdminCard>

      <FormActions>
        {initial ? (
          <AdminButton variant="danger" onClick={onDelete} disabled={pending}>
            {tb("actions.delete")}
          </AdminButton>
        ) : null}
        <AdminButton variant="ghost" onClick={() => router.push("/admin/buildings")} disabled={pending}>
          {tb("actions.cancel")}
        </AdminButton>
        <AdminButton variant="primary" onClick={onSubmit} disabled={pending}>
          {pending ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
