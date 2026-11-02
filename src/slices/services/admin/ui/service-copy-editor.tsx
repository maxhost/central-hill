"use client";

import { useTranslations } from "next-intl";
import { FieldGrid, TextArea, TextInput } from "@slices/backoffice/contract";
import {
  SERVICE_COPY_KEYS,
  SERVICE_HIDDEN_COPY_KEYS,
  serviceCopyLimit,
  type ServiceCopy,
  type ServiceCopyKey,
} from "../../copy";
import { ServiceField } from "./service-section-controls";

const BLOCK_KEYS: ServiceCopyKey[] = [
  "itineraryEyebrow",
  "itineraryTitle",
  "optionsTitle",
  "ratesTitle",
  "partnersTitle",
  "knowTitle",
  "knowIncluded",
  "knowCancellation",
  "knowPractical",
];
export const SECTION_COPY_KEYS: Record<string, ServiceCopyKey[]> = {
  included: [],
  itinerary: ["itineraryEyebrow", "itineraryTitle"],
  options: ["optionsTitle"],
  pricing: ["ratesTitle"],
  partners: ["partnersTitle"],
  good_to_know: [
    "knowTitle",
    "knowIncluded",
    "knowCancellation",
    "knowPractical",
  ],
  extras: [],
};
const GROUPS: [string, ServiceCopyKey[]][] = [
  [
    "admin.sections.identity",
    [
      "guestFavourite",
      "breadcrumbLabel",
      "home",
    ],
  ],
  ["admin.sections.media", ["showAllPhotos", "allPhotos", "close"]],
  [
    "admin.sections.booking",
    [
      "from",
      "onRequest",
      "seePartners",
      "noPayment",
      "requestShort",
      "bookingLabel",
    ],
  ],
  [
    "detail.enquiryInfoTitle",
    [
      "enquiryTitle",
      "enquiryIntro",
      "enquiryInfoTitle",
      "phone",
      "whatsapp",
      "email",
    ],
  ],
  ["detail.relatedTitle", ["relatedTitle"]],
];

export function ServiceCopyFields({
  keys,
  value,
  onChange,
  errors,
}: {
  keys: readonly ServiceCopyKey[];
  value: ServiceCopy;
  onChange: (copy: ServiceCopy) => void;
  errors: Record<string, string>;
}) {
  const t = useTranslations("services");
  const p = useTranslations("services.admin.presentation");
  const visibleKeys = keys.filter((key) => !SERVICE_HIDDEN_COPY_KEYS.includes(key));
  if (!visibleKeys.length) return null;
  return (
    <FieldGrid>
      {visibleKeys.map((key) => {
        const example = t(
          `detail.${key}`,
          key === "enquiryTitle" ? { name: "{name}" } : undefined,
        );
        const error = errors[`copy.${key}`];
        const props = {
          value: value[key] ?? "",
          maxLength: serviceCopyLimit(key),
          placeholder: example,
          onChange: (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => onChange({ ...value, [key]: e.target.value }),
        };
        return (
          <ServiceField
            key={key}
            fieldPath={`copy.${key}`}
            label={p("copyFieldLabel", { label: example })}
            hint={key === "enquiryTitle" ? "{name}" : undefined}
            error={error}
          >
            {serviceCopyLimit(key) > 200 ? (
              <TextArea {...props} />
            ) : (
              <TextInput {...props} />
            )}
          </ServiceField>
        );
      })}
    </FieldGrid>
  );
}

export function ServiceCopyEditor(props: {
  value: ServiceCopy;
  onChange: (copy: ServiceCopy) => void;
  errors: Record<string, string>;
}) {
  const t = useTranslations("services");
  const p = useTranslations("services.admin.presentation");
  const hasError = SERVICE_COPY_KEYS.some(
    (key) => !SERVICE_HIDDEN_COPY_KEYS.includes(key) && !BLOCK_KEYS.includes(key) && props.errors[`copy.${key}`],
  );
  return (
    <details
      open={hasError || undefined}
      data-service-copy
      className="space-y-4 border-t border-line pt-5"
    >
      <summary className="cursor-pointer text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-accent">
        {p("additional")}
      </summary>
      <p className="text-sm text-ink-soft">{p("additionalHint")}</p>
      {GROUPS.map(([title, keys]) => (
        <fieldset key={title} className="space-y-3">
          <legend className="mb-3 text-sm font-semibold text-ink">
            {t(title)}
          </legend>
          <ServiceCopyFields {...props} keys={keys} />
        </fieldset>
      ))}
    </details>
  );
}
