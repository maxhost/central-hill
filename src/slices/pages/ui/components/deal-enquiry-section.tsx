import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import {
  EnquirySplit,
  FormAccordion,
  FormField,
  FormGroup,
  FormInput,
  FormNote,
  FormRow,
  FormSelect,
  FormSubmit,
  FormTextarea,
} from "@core/ui";
import { getGlobals } from "@slices/settings/contract";
import type { RealEstateContent } from "../../schemas/real-estate";
import { enquiryContactLines } from "../contact-line";
import { orMessage } from "../or-message";
import { StaticFormCard } from "./static-form-card";

/**
 * Real Estate's closing "Ready to Explore a Partnership?" section (`#deal-enquiry`, SECTION 10),
 * composed from `core/ui`'s `EnquirySplit` (intro + contact | form slot, each column revealed
 * separately) and the `form-card.tsx` primitives. What the form asks for (fields, options,
 * ids/names) lives here, in the slice; the components only style it.
 *
 * Spec real-estate-admin-editor S5:
 * - **Editable copy** (`content.deal_enquiry`): headline, lede, contact title, submit label and
 *   note. Blank / absent → the i18n message of the visitor's locale (`orMessage`):
 *   `pages.realEstate.enquiryTitle` / `enquiryLede` / `enquiryContactTitle`,
 *   `pages.dealEnquiryForm.submit` / `note`. The submit's "→" is appended here (like every
 *   other button on this page), so neither the field nor the message carries it.
 * - **Contact lines from Settings** (`getGlobals`): Email (`mailto:`), Tel (`tel:` without
 *   spaces), LinkedIn (`social.linkedin`, link text `pages.realEstate.contactLinkedinText`);
 *   a line whose Settings value is missing is omitted (`enquiryContactLines`), and with no
 *   line at all the contact block is not rendered.
 * - **Form fields are fixed i18n** (`pages.dealEnquiryForm.*`, not editable). Select options are
 *   `{ value, label }` with stable English values, so the future lead keeps a locale-independent
 *   value; only the label is translated.
 * - **The form still submits nothing** (`StaticFormCard` cancels the submit). Wiring it to leads
 *   is out of scope.
 * Every field's `id`/`name`/`type`/`required` is unchanged; `id="deal-enquiry"` is the anchor for
 * the page's `#deal-enquiry` CTAs.
 */

/** Stable values of the three selects (spec → "Formulario de enquiry: i18n fijo"). */
const ASSET_TYPES = [
  ["apartments", "assetTypeApartments"],
  ["apart_hotel", "assetTypeApartHotel"],
  ["hotel", "assetTypeHotel"],
  ["mixed", "assetTypeMixed"],
  ["corporate_housing", "assetTypeCorporateHousing"],
] as const;
const STATUSES = [
  ["operating", "statusOperating"],
  ["in_development", "statusInDevelopment"],
  ["acquisition", "statusAcquisition"],
] as const;
const MODELS = [
  ["fixed_rent", "modelFixedRent"],
  ["management_commission", "modelManagementCommission"],
  ["hybrid", "modelHybrid"],
  ["open", "modelOpen"],
] as const;

export async function DealEnquirySection({
  locale,
  content,
}: {
  locale: Locale;
  /** The page's optional `deal_enquiry` copy (blank / absent → i18n defaults). */
  content?: RealEstateContent["deal_enquiry"];
}) {
  const [t, f, globals] = await Promise.all([
    getTranslations({ locale, namespace: "pages.realEstate" }),
    getTranslations({ locale, namespace: "pages.dealEnquiryForm" }),
    getGlobals(locale),
  ]);
  const options = (list: readonly (readonly [string, string])[]) =>
    list.map(([value, key]) => ({ value, label: f(key) }));

  const lines = enquiryContactLines(globals, {
    email: t("contactEmail"),
    phone: t("contactPhone"),
    linkedin: t("contactLinkedin"),
    linkedinText: t("contactLinkedinText"),
  });
  const contact =
    lines.length > 0 ? { title: orMessage(content?.contact_title, t("enquiryContactTitle")), lines } : undefined;

  return (
    <EnquirySplit
      id="deal-enquiry"
      title={orMessage(content?.headline, t("enquiryTitle"))}
      lede={orMessage(content?.lede, t("enquiryLede"))}
      contact={contact}
      reveal
    >
      <StaticFormCard>
        <FormGroup title={f("orgTitle")} tag={f("required")}>
          <FormField htmlFor="company" label={f("companyLabel")} required>
            <FormInput id="company" name="company" type="text" placeholder={f("companyPlaceholder")} required />
          </FormField>
          <FormField htmlFor="contact" label={f("contactLabel")} required>
            <FormInput id="contact" name="contact" type="text" placeholder={f("contactPlaceholder")} required />
          </FormField>
          <FormRow>
            <FormField htmlFor="email" label={f("emailLabel")} required>
              <FormInput id="email" name="email" type="email" placeholder={f("emailPlaceholder")} required />
            </FormField>
            <FormField htmlFor="phone" label={f("phoneLabel")} required>
              <FormInput id="phone" name="phone" type="tel" placeholder={f("phonePlaceholder")} required />
            </FormField>
          </FormRow>
          <FormField htmlFor="country" label={f("countryLabel")} required>
            <FormInput id="country" name="country" type="text" placeholder={f("countryPlaceholder")} required />
          </FormField>
        </FormGroup>

        <FormAccordion title={f("assetTitle")} hint={f("optional")}>
          <FormField htmlFor="asset-type" label={f("assetTypeLabel")}>
            <FormSelect
              id="asset-type"
              name="asset-type"
              placeholder={f("assetTypePlaceholder")}
              options={options(ASSET_TYPES)}
            />
          </FormField>
          <FormRow>
            <FormField htmlFor="units" label={f("unitsLabel")}>
              <FormInput id="units" name="units" type="text" placeholder={f("unitsPlaceholder")} />
            </FormField>
            <FormField htmlFor="locations" label={f("locationsLabel")}>
              <FormInput id="locations" name="locations" type="text" placeholder={f("locationsPlaceholder")} />
            </FormField>
          </FormRow>
          <FormField htmlFor="status" label={f("statusLabel")}>
            <FormSelect id="status" name="status" placeholder={f("statusPlaceholder")} options={options(STATUSES)} />
          </FormField>
          <FormRow>
            <FormField htmlFor="model" label={f("modelLabel")}>
              <FormSelect id="model" name="model" placeholder={f("modelPlaceholder")} options={options(MODELS)} />
            </FormField>
            <FormField htmlFor="timeline" label={f("timelineLabel")}>
              <FormInput id="timeline" name="timeline" type="text" placeholder={f("timelinePlaceholder")} />
            </FormField>
          </FormRow>
        </FormAccordion>

        <FormAccordion title={f("additionalTitle")} hint={f("optional")}>
          <FormField htmlFor="notes" label={f("notesLabel")}>
            <FormTextarea id="notes" name="notes" placeholder={f("notesPlaceholder")} />
          </FormField>
        </FormAccordion>

        <FormSubmit>{`${orMessage(content?.submit_label, f("submit"))} →`}</FormSubmit>
        <FormNote>{orMessage(content?.note, f("note"))}</FormNote>
      </StaticFormCard>
    </EnquirySplit>
  );
}
