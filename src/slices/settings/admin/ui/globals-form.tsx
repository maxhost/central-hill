"use client";

import { useState, useTransition } from "react";
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
  TextArea,
  TextInput,
} from "@slices/backoffice/contract";
import { saveGlobals } from "../actions";
import type { GlobalsEditData, StatForm } from "../queries";

/**
 * Company-globals editor (S12) — the site-wide singleton. Posts through `saveGlobals`;
 * the [T] stat labels + office-hours label are authored in English. The Avantio widget
 * config is edited as JSON (parsed on submit).
 */

type StatKey = "bookings" | "years" | "guests" | "revenue" | "buildings" | "apartments";
const STAT_KEYS: StatKey[] = ["bookings", "years", "guests", "revenue", "buildings", "apartments"];
type SocialKey = "instagram" | "facebook" | "linkedin" | "youtube" | "tiktok";
const SOCIAL_KEYS: SocialKey[] = ["instagram", "facebook", "linkedin", "youtube", "tiktok"];

export function GlobalsForm({
  initial,
  previews: initialPreviews,
}: {
  initial: GlobalsEditData;
  previews: Record<string, AdminMediaPreview>;
}) {
  const t = useTranslations("settings");
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState<GlobalsEditData>(initial);
  const [previews, setPreviews] = useState(initialPreviews);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const set = <K extends keyof GlobalsEditData>(key: K, value: GlobalsEditData[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const setStat = (key: StatKey, patch: Partial<StatForm>) =>
    setState((prev) => ({ ...prev, stats: { ...prev.stats, [key]: { ...prev.stats[key], ...patch } } }));
  const setSocial = (key: SocialKey, value: string) =>
    setState((prev) => ({ ...prev, social: { ...prev.social, [key]: value } }));
  const err = (key: string) => errors[key];

  function onSubmit() {
    setBanner(null);
    const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

    let widgetConfig: Record<string, unknown>;
    try {
      const parsed = JSON.parse(state.avantio_widget_config.trim() || "{}");
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
      widgetConfig = parsed as Record<string, unknown>;
    } catch {
      setErrors({ avantio_widget_config: t("admin.errors.invalidJson") });
      setBanner(tb("actions.saveError"));
      return;
    }
    setErrors({});

    const payload = {
      email: state.email.trim(),
      phone: state.phone.trim(),
      whatsapp: orNull(state.whatsapp),
      social: Object.fromEntries(SOCIAL_KEYS.map((k) => [k, orNull(state.social[k])])),
      stats: Object.fromEntries(
        STAT_KEYS.map((k) => [k, { value: state.stats[k].value.trim(), label: state.stats[k].label.trim() }]),
      ),
      office_address: state.office_address.trim(),
      office_hours: orNull(state.office_hours),
      office_hours_label: orNull(state.office_hours_label),
      currency: "EUR" as const,
      default_og_image_media_id: state.default_og_image_media_id || null,
      avantio_account_id: state.avantio_account_id.trim(),
      avantio_widget_config: widgetConfig,
      show_building_location: state.show_building_location,
      show_building_count: state.show_building_count,
    };

    start(async () => {
      const result = await saveGlobals(payload);
      if (result.ok) {
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

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.globals.title")} description={t("admin.globals.subtitle")} />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">{banner}</p>
      ) : null}

      <AdminCard title={t("admin.globals.sections.contact")}>
        <FieldGrid>
          <Field label={t("admin.globals.fields.email")} required error={err("email")}>
            <TextInput value={state.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label={t("admin.globals.fields.phone")} required error={err("phone")}>
            <TextInput value={state.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label={t("admin.globals.fields.whatsapp")} error={err("whatsapp")}>
            <TextInput value={state.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </Field>
        </FieldGrid>
      </AdminCard>

      <AdminCard title={t("admin.globals.sections.social")}>
        <FieldGrid>
          {SOCIAL_KEYS.map((k) => (
            <Field key={k} label={t(`admin.globals.social.${k}`)} error={err(`social.${k}`)}>
              <TextInput value={state.social[k]} onChange={(e) => setSocial(k, e.target.value)} />
            </Field>
          ))}
        </FieldGrid>
      </AdminCard>

      <AdminCard title={t("admin.globals.sections.stats")}>
        <div className="space-y-4">
          {STAT_KEYS.map((k) => (
            <FieldGrid key={k}>
              <Field label={t(`admin.globals.stats.${k}`)} error={err(`stats.${k}.value`)}>
                <TextInput
                  value={state.stats[k].value}
                  onChange={(e) => setStat(k, { value: e.target.value })}
                  placeholder={t("admin.globals.fields.statValue")}
                />
              </Field>
              <Field label={t("admin.globals.fields.statLabel")} error={err(`stats.${k}.label`)}>
                <TextInput value={state.stats[k].label} onChange={(e) => setStat(k, { label: e.target.value })} />
              </Field>
            </FieldGrid>
          ))}
        </div>
      </AdminCard>

      <AdminCard title={t("admin.globals.sections.office")}>
        <div className="space-y-4">
          <Field label={t("admin.globals.fields.officeAddress")} required error={err("office_address")}>
            <TextInput value={state.office_address} onChange={(e) => set("office_address", e.target.value)} />
          </Field>
          <FieldGrid>
            <Field label={t("admin.globals.fields.officeHours")} error={err("office_hours")}>
              <TextInput value={state.office_hours} onChange={(e) => set("office_hours", e.target.value)} />
            </Field>
            <Field label={t("admin.globals.fields.officeHoursLabel")} error={err("office_hours_label")}>
              <TextInput
                value={state.office_hours_label}
                onChange={(e) => set("office_hours_label", e.target.value)}
              />
            </Field>
          </FieldGrid>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.globals.sections.brand")}>
        <Field label={t("admin.globals.fields.ogImage")} hint={t("admin.globals.fields.ogImageHint")}>
          <MediaField
            value={state.default_og_image_media_id || null}
            preview={previews[state.default_og_image_media_id] ?? null}
            onChange={(id, preview) => {
              set("default_og_image_media_id", id ?? "");
              if (preview) setPreviews((prev) => ({ ...prev, [preview.id]: preview }));
            }}
          />
        </Field>
      </AdminCard>

      <AdminCard title={t("admin.globals.sections.avantio")}>
        <div className="space-y-4">
          <Field label={t("admin.globals.fields.avantioAccount")} required error={err("avantio_account_id")}>
            <TextInput
              value={state.avantio_account_id}
              onChange={(e) => set("avantio_account_id", e.target.value)}
            />
          </Field>
          <Field
            label={t("admin.globals.fields.avantioConfig")}
            hint={t("admin.globals.fields.avantioConfigHint")}
            error={err("avantio_widget_config")}
          >
            <TextArea
              rows={5}
              className="font-mono text-xs"
              value={state.avantio_widget_config}
              onChange={(e) => set("avantio_widget_config", e.target.value)}
            />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.globals.sections.buildings")}>
        <div className="space-y-3">
          <Checkbox
            label={t("admin.globals.fields.showBuildingLocation")}
            checked={state.show_building_location}
            onChange={(e) => set("show_building_location", e.target.checked)}
          />
          <Checkbox
            label={t("admin.globals.fields.showBuildingCount")}
            checked={state.show_building_count}
            onChange={(e) => set("show_building_count", e.target.checked)}
          />
        </div>
      </AdminCard>

      <FormActions>
        <AdminButton variant="primary" onClick={onSubmit} disabled={pending}>
          {pending ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
