"use client";

import { rawOwnerMediaAlts } from "@core/media/owner-alt";
import { useState, useTransition } from "react";
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
  IconField,
  MediaField,
  OwnerMediaAltFields,
  TextInput,
  useMediaQueue,
} from "@slices/backoffice/contract";
import { EDITABLE_SITE_ICON_KEYS, SITE_ICON_DEFAULTS, type EditableSiteIconKey } from "../../site-icons";
import { HOURS_LABEL_LOCALES, HOURS_LABEL_MAX, OFFICE_HOURS_DEFAULT_LABELS } from "../../hours-label-types";
import { WEBSITE_LOCALES } from "../../website-locale-types";
import { NAVIGATION_CTA_LOCALES, type NavigationCta, type NavigationCtasByLocale } from "../../navigation-cta-types";
import { saveGlobals } from "../actions";
import type { GlobalsEditData } from "../queries";

/** Company settings: shared contact/office details, localized labels and global icon defaults. */

/** Site icons, grouped as the form shows them (ADR 0034 amendment 2). */
const SITE_ICON_GROUPS: {
  key: "general" | "detail" | "specs" | "services" | "guides";
  icons: EditableSiteIconKey[];
}[] = [
  { key: "general", icons: ["account", "contact", "language", "location", "reading_time", "search"] },
  {
    key: "detail",
    icons: [
      "table_of_contents",
      "published_date",
      "list_bullet",
      "callout_tip",
      "callout_info",
      "callout_warning",
      "callout_note",
    ],
  },
  { key: "specs", icons: ["spec_bedrooms", "spec_beds", "spec_guests", "spec_size"] },
  {
    key: "services",
    icons: [
      "service_included",
      "service_badge",
      "service_note",
      "service_photos",
      "know_included",
      "know_cancellation",
      "know_practical",
    ],
  },
  {
    key: "guides",
    icons: [
      "guide_landing",
      "guide_eat",
      "guide_beaches",
      "guide_events",
      "guide_secrets",
      "guide_families",
      "guide_groups",
      "guide_travellers",
      "guide_custom",
    ],
  },
];

type SocialKey = "instagram" | "facebook" | "linkedin" | "youtube" | "tiktok";
const SOCIAL_KEYS: SocialKey[] = [
  "instagram",
  "facebook",
  "linkedin",
  "youtube",
  "tiktok",
];

function emptyNavigationCtas(): NavigationCtasByLocale {
  return Object.fromEntries(NAVIGATION_CTA_LOCALES.map((locale) => [
    locale, { book: { label: "", url: "" }, earn: { label: "" } },
  ])) as NavigationCtasByLocale;
}

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
  const queue = useMediaQueue();
  // A pick still being reserved isn't in the form's value yet — Save waits for it.
  const preparing = queue.isPreparing;
  const [state, setState] = useState<GlobalsEditData>(initial);
  const [previews, setPreviews] = useState(initialPreviews);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const set = <K extends keyof GlobalsEditData>(
    key: K,
    value: GlobalsEditData[K],
  ) => setState((prev) => ({ ...prev, [key]: value }));
  const setSocial = (key: SocialKey, value: string) =>
    setState((prev) => ({ ...prev, social: { ...prev.social, [key]: value } }));
  const setIcon = (key: EditableSiteIconKey, value: string) =>
    setState((prev) => ({ ...prev, site_icons: { ...prev.site_icons, [key]: value } }));
  const setBookCta = (locale: (typeof NAVIGATION_CTA_LOCALES)[number], patch: Partial<NavigationCta>) =>
    setState((previous) => {
      const ctas = previous.navigation_ctas ?? emptyNavigationCtas();
      return {
        ...previous,
        navigation_ctas: { ...ctas, [locale]: { ...ctas[locale], book: { ...ctas[locale].book, ...patch } } },
      };
    });
  const setEarnLabel = (locale: (typeof NAVIGATION_CTA_LOCALES)[number], label: string) =>
    setState((previous) => {
      const ctas = previous.navigation_ctas ?? emptyNavigationCtas();
      return {
        ...previous,
        navigation_ctas: { ...ctas, [locale]: { ...ctas[locale], earn: { label } } },
      };
    });
  const err = (key: string) => errors[key];

  function onSubmit() {
    if (preparing) return;
    setBanner(null);
    const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

    setErrors({});

    const navigationCtas = state.navigation_ctas;
    const payload = {
      navigation_ctas: navigationCtas
        ? Object.fromEntries(NAVIGATION_CTA_LOCALES.map((locale) => [locale, {
            book: {
              label: navigationCtas[locale].book.label.trim(),
              url: navigationCtas[locale].book.url.trim(),
            },
            earn: { label: navigationCtas[locale].earn.label.trim() },
          }]))
        : undefined,
      email: state.email.trim(),
      phone: state.phone.trim(),
      owners_phone: orNull(state.owners_phone ?? ""),
      whatsapp: orNull(state.whatsapp),
      checkin_phone: orNull(state.checkin_phone),
      website_url: orNull(state.website_url),
      website_translations: {
        es: state.website_translations?.es.trim() ?? "",
        pt: state.website_translations?.pt.trim() ?? "",
        fr: state.website_translations?.fr.trim() ?? "",
      },
      social: Object.fromEntries(
        SOCIAL_KEYS.map((k) => [k, orNull(state.social[k])]),
      ),
      office_address: state.office_address.trim(),
      office_hours: orNull(state.office_hours),
      office_hours_label: orNull(state.office_hours_label),
      office_hours_translations: {
        es: state.office_hours_translations?.es.trim() ?? "",
        pt: state.office_hours_translations?.pt.trim() ?? "",
        fr: state.office_hours_translations?.fr.trim() ?? "",
      },
      currency: "EUR" as const,
      default_og_image_media_id: state.default_og_image_media_id || null,
      default_og_alts: state.default_og_alts,
      site_icons: Object.fromEntries(EDITABLE_SITE_ICON_KEYS.map((key) => [key, state.site_icons[key]])),
    };

    void (async () => {
      // Uploads run OUTSIDE the transition on purpose: `startTransition` marks every
      // update in its scope as low priority, so the queue's progress modal would not
      // paint until the transition it lives in had already finished (ADR 0030).
      if (!(await queue.flush())) return;
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
    })();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.globals.title")}
        description={t("admin.globals.subtitle")}
      />

      {banner ? (
        <p className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink">
          {banner}
        </p>
      ) : null}

      <AdminCard title={t("admin.globals.sections.contact")}>
        <FieldGrid>
          <Field
            label={t("admin.globals.fields.email")}
            required
            error={err("email")}
          >
            <TextInput
              value={state.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field
            label={t("admin.globals.fields.phone")}
            required
            error={err("phone")}
          >
            <TextInput
              value={state.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field
            label={t("admin.globals.fields.ownersPhone")}
            htmlFor="owners-phone"
            hint={t("admin.globals.fields.ownersPhoneHint")}
            error={err("owners_phone")}
          >
            <TextInput
              id="owners-phone"
              type="tel"
              autoComplete="tel"
              maxLength={40}
              value={state.owners_phone ?? ""}
              onChange={(e) => set("owners_phone", e.target.value)}
              disabled={pending || preparing}
              aria-invalid={Boolean(err("owners_phone"))}
            />
          </Field>
          <Field
            label={t("admin.globals.fields.whatsapp")}
            error={err("whatsapp")}
          >
            <TextInput
              value={state.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
            />
          </Field>
          <Field
            label={t("admin.globals.fields.checkinPhone")}
            hint={t("admin.globals.fields.checkinPhoneHint")}
            error={err("checkin_phone")}
          >
            <TextInput
              value={state.checkin_phone}
              onChange={(e) => set("checkin_phone", e.target.value)}
            />
          </Field>
          <div className="col-span-full">
            <FieldGrid>
              {WEBSITE_LOCALES.map((locale) => {
                const field = locale === "en" ? "website_url" : `website_translations.${locale}`;
                const id = `website-url-${locale}`;
                return (
                  <Field
                    key={locale}
                    label={t("admin.globals.websiteLocales.label", {
                      locale: locale.toUpperCase(),
                    })}
                    htmlFor={id}
                    hint={t(
                      locale === "en"
                        ? "admin.globals.websiteLocales.sourceHint"
                        : "admin.globals.websiteLocales.fallbackHint",
                    )}
                    error={err(field)}
                  >
                    <TextInput
                      id={id}
                      type="url"
                      maxLength={300}
                      value={
                        locale === "en"
                          ? state.website_url
                          : state.website_translations?.[locale] ?? ""
                      }
                      onChange={(event) => {
                        const value = event.target.value;
                        if (locale === "en") {
                          set("website_url", value);
                          return;
                        }
                        setState((previous) => ({
                          ...previous,
                          website_translations: {
                            es: "",
                            pt: "",
                            fr: "",
                            ...previous.website_translations,
                            [locale]: value,
                          },
                        }));
                      }}
                      placeholder="https://"
                      disabled={pending || preparing}
                      aria-invalid={Boolean(err(field))}
                    />
                  </Field>
                );
              })}
            </FieldGrid>
          </div>
        </FieldGrid>
      </AdminCard>

      <AdminCard title={t("admin.globals.navigationCtas.title")}>
        <div className="space-y-6">
          <p className="text-sm text-ink-soft">{t("admin.globals.navigationCtas.intro")}</p>
          <section className="space-y-4" aria-labelledby="navigation-book-title">
            <h3 id="navigation-book-title" className="text-sm font-semibold text-ink">
              {t("admin.globals.navigationCtas.bookTitle")}
            </h3>
            {NAVIGATION_CTA_LOCALES.map((locale) => {
              const labelField = `navigation_ctas.${locale}.book.label`;
              const urlField = `navigation_ctas.${locale}.book.url`;
              return (
                <FieldGrid key={locale}>
                  <Field
                    label={t("admin.globals.navigationCtas.label", { locale: locale.toUpperCase() })}
                    htmlFor={`navigation-book-label-${locale}`}
                    required={locale === "en"}
                    error={err(labelField)}
                  >
                    <TextInput
                      id={`navigation-book-label-${locale}`}
                      value={state.navigation_ctas?.[locale].book.label ?? ""}
                      onChange={(event) => setBookCta(locale, { label: event.target.value })}
                      maxLength={80}
                      required={locale === "en"}
                      disabled={pending || preparing}
                      aria-invalid={Boolean(err(labelField))}
                    />
                  </Field>
                  <Field
                    label={t("admin.globals.navigationCtas.url", { locale: locale.toUpperCase() })}
                    htmlFor={`navigation-book-url-${locale}`}
                    required={locale === "en"}
                    error={err(urlField)}
                  >
                    <TextInput
                      id={`navigation-book-url-${locale}`}
                      inputMode="url"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={state.navigation_ctas?.[locale].book.url ?? ""}
                      onChange={(event) => setBookCta(locale, { url: event.target.value })}
                      maxLength={300}
                      required={locale === "en"}
                      disabled={pending || preparing}
                      aria-invalid={Boolean(err(urlField))}
                      placeholder="https://"
                    />
                  </Field>
                </FieldGrid>
              );
            })}
            <p className="text-sm text-ink-soft">{t("admin.globals.navigationCtas.fallbackHint")}</p>
          </section>
          <section className="space-y-4" aria-labelledby="navigation-earn-title">
            <h3 id="navigation-earn-title" className="text-sm font-semibold text-ink">
              {t("admin.globals.navigationCtas.earnTitle")}
            </h3>
            <p className="text-sm text-ink-soft">{t("admin.globals.navigationCtas.earnHint")}</p>
            <FieldGrid>
              {NAVIGATION_CTA_LOCALES.map((locale) => {
                const field = `navigation_ctas.${locale}.earn.label`;
                return (
                  <Field
                    key={locale}
                    label={t("admin.globals.navigationCtas.label", { locale: locale.toUpperCase() })}
                    htmlFor={`navigation-earn-label-${locale}`}
                    required={locale === "en"}
                    error={err(field)}
                  >
                    <TextInput
                      id={`navigation-earn-label-${locale}`}
                      value={state.navigation_ctas?.[locale].earn.label ?? ""}
                      onChange={(event) => setEarnLabel(locale, event.target.value)}
                      maxLength={80}
                      required={locale === "en"}
                      disabled={pending || preparing}
                      aria-invalid={Boolean(err(field))}
                    />
                  </Field>
                );
              })}
            </FieldGrid>
          </section>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.globals.sections.social")}>
        <FieldGrid>
          {SOCIAL_KEYS.map((k) => (
            <Field
              key={k}
              label={t(`admin.globals.social.${k}`)}
              error={err(`social.${k}`)}
            >
              <TextInput
                value={state.social[k]}
                onChange={(e) => setSocial(k, e.target.value)}
              />
            </Field>
          ))}
        </FieldGrid>
      </AdminCard>

      <AdminCard title={t("admin.globals.sections.office")}>
        <div className="space-y-4">
          <Field
            label={t("admin.globals.fields.officeAddress")}
            required
            error={err("office_address")}
          >
            <TextInput
              value={state.office_address}
              onChange={(e) => set("office_address", e.target.value)}
            />
          </Field>
          <Field
            label={t("admin.globals.fields.officeHours")}
            error={err("office_hours")}
          >
            <TextInput
              value={state.office_hours}
              onChange={(e) => set("office_hours", e.target.value)}
            />
          </Field>
          <FieldGrid>
            {HOURS_LABEL_LOCALES.map((locale) => {
              const field = locale === "en" ? "office_hours_label" : `office_hours_translations.${locale}`;
              const id = `office-hours-label-${locale}`;
              return (
                <Field
                  key={locale}
                  label={t("admin.globals.hoursLabels.label", { locale: locale.toUpperCase() })}
                  htmlFor={id}
                  hint={t("admin.globals.hoursLabels.hint")}
                  error={err(field)}
                >
                  <TextInput
                    id={id}
                    value={locale === "en" ? state.office_hours_label : state.office_hours_translations?.[locale] ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (locale === "en") {
                        set("office_hours_label", value);
                        return;
                      }
                      setState((previous) => ({
                        ...previous,
                        office_hours_translations: {
                          es: "",
                          pt: "",
                          fr: "",
                          ...previous.office_hours_translations,
                          [locale]: value,
                        },
                      }));
                    }}
                    placeholder={OFFICE_HOURS_DEFAULT_LABELS[locale]}
                    maxLength={HOURS_LABEL_MAX}
                    disabled={pending || preparing}
                    aria-invalid={Boolean(err(field))}
                  />
                </Field>
              );
            })}
          </FieldGrid>
        </div>
      </AdminCard>

      <AdminCard title={t("admin.globals.sections.brand")}>
        <Field
          label={t("admin.globals.fields.ogImage")}
          hint={t("admin.globals.fields.ogImageHint")}
        >
          <MediaField
            value={state.default_og_image_media_id || null}
            preview={previews[state.default_og_image_media_id] ?? null}
            onChange={(id, preview) => {
              setState(previous => ({ ...previous, default_og_image_media_id: id ?? "", default_og_alts: id === initial.default_og_image_media_id ? initial.default_og_alts : rawOwnerMediaAlts([], null) }));
              if (preview)
                setPreviews((prev) => ({ ...prev, [preview.id]: preview }));
            }}
          />
        </Field>
        <OwnerMediaAltFields mediaId={state.default_og_image_media_id || null} value={state.default_og_alts} onChange={value => set("default_og_alts", value)} disabled={pending || preparing} />
      </AdminCard>

      <AdminCard title={t("admin.globals.sections.icons")}>
        <p className="mb-5 text-sm text-ink-soft">{t("admin.globals.icons.intro")}</p>
        <div className="space-y-6">
          {SITE_ICON_GROUPS.map((group) => (
            <div key={group.key}>
              <h3 className="mb-3 text-sm font-semibold text-ink">{t(`admin.globals.icons.groups.${group.key}`)}</h3>
              <FieldGrid>
                {group.icons.map((key) => (
                  <Field
                    key={key}
                    label={t(`admin.globals.icons.fields.${key}`)}
                    hint={t("admin.globals.icons.default", { name: SITE_ICON_DEFAULTS[key] })}
                    error={err(`site_icons.${key}`)}
                  >
                    <IconField value={state.site_icons[key]} onChange={(v) => setIcon(key, v)} />
                  </Field>
                ))}
              </FieldGrid>
            </div>
          ))}
        </div>
      </AdminCard>

      <FormActions>
        {preparing ? (
          <p role="status" className="text-xs text-ink-soft">
            {tb("media.waitForMedia")}
          </p>
        ) : null}
        <AdminButton variant="primary" onClick={onSubmit} disabled={pending || preparing}>
          {pending ? tb("actions.saving") : tb("actions.save")}
        </AdminButton>
      </FormActions>
    </div>
  );
}
