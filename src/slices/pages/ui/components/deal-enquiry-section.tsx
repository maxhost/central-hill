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
import { StaticFormCard } from "./static-form-card";

/**
 * Real Estate's closing "Ready to Explore a Partnership?" section (`#deal-enquiry`, SECTION 10 —
 * formerly the raw `BODY_BOTTOM` markup in `real-estate-page.tsx`), composed from `core/ui`'s
 * `EnquirySplit` (intro + contact | form slot, each column revealed separately like the
 * original's two `reveal-io pre-reveal` hooks) and the `form-card.tsx` primitives. What the form
 * asks for (fields, options, ids/names) lives here, in the slice; the components only style it.
 *
 * Kept exactly as the static mock had it — deliberately, this was a UI-only extraction:
 * - **Copy is hardcoded English** (not i18n'd, not in `page_content`): `/pt`, `/es`, `/fr` show
 *   this same English text. Pending follow-up.
 * - **The form submits nothing** (`StaticFormCard` cancels the submit, like the original
 *   `onsubmit="return false"`). Wiring it to a real deal-enquiry action is a pending follow-up.
 * - The LinkedIn link is still the mock's `href="#"` placeholder.
 * Every field's `id`/`name`/`type`/`placeholder`/`required` is byte-for-byte the original's;
 * `id="deal-enquiry"` is the anchor for the page's `#deal-enquiry` CTAs.
 */

const TITLE = "Ready to Explore a Partnership?";
const LEDE =
  "Whether you represent an investment fund, a development company, a large property operator, or a corporate seeking managed accommodation — we want to hear from you. Complete the enquiry form below and one of our senior team will respond within 24 hours.";
const CONTACT = {
  title: "Contact Our Institutional Team Directly",
  lines: [
    { label: "Email:", href: "mailto:realestate@centralhillapartments.com", text: "realestate@centralhillapartments.com" },
    { label: "Tel:", href: "tel:+351910075725", text: "+351 910 075 725" },
    { label: "LinkedIn:", href: "#", text: "Central Hill Apartments" },
  ],
} as const;

export function DealEnquirySection() {
  return (
    <EnquirySplit id="deal-enquiry" title={TITLE} lede={LEDE} contact={CONTACT} reveal>
      <StaticFormCard>
        <FormGroup title="Organisation Details" tag="Required">
          <FormField htmlFor="company" label="Company / Fund Name" required>
            <FormInput id="company" name="company" type="text" placeholder="Your organisation" required />
          </FormField>
          <FormField htmlFor="contact" label="Contact Name & Title" required>
            <FormInput id="contact" name="contact" type="text" placeholder="Name, role" required />
          </FormField>
          <FormRow>
            <FormField htmlFor="email" label="Email Address" required>
              <FormInput id="email" name="email" type="email" placeholder="name@company.com" required />
            </FormField>
            <FormField htmlFor="phone" label="Phone Number" required>
              <FormInput id="phone" name="phone" type="tel" placeholder="+351 …" required />
            </FormField>
          </FormRow>
          <FormField htmlFor="country" label="Country / Jurisdiction" required>
            <FormInput id="country" name="country" type="text" placeholder="e.g. Portugal, United Kingdom" required />
          </FormField>
        </FormGroup>

        <FormAccordion title="Asset Details" hint="Optional">
          <FormField htmlFor="asset-type" label="Type of Asset">
            <FormSelect
              id="asset-type"
              name="asset-type"
              placeholder="Select asset type…"
              options={["Apartments", "Apart-hotel", "Hotel", "Mixed", "Corporate housing"]}
            />
          </FormField>
          <FormRow>
            <FormField htmlFor="units" label="Number of Units or Keys">
              <FormInput id="units" name="units" type="text" placeholder="e.g. 24" />
            </FormField>
            <FormField htmlFor="locations" label="Location(s) in Portugal">
              <FormInput id="locations" name="locations" type="text" placeholder="e.g. Lisbon, Porto" />
            </FormField>
          </FormRow>
          <FormField htmlFor="status" label="Current Status">
            <FormSelect
              id="status"
              name="status"
              placeholder="Select current status…"
              options={["Operating", "In development", "Acquisition phase"]}
            />
          </FormField>
          <FormRow>
            <FormField htmlFor="model" label="Target Partnership Model">
              <FormSelect
                id="model"
                name="model"
                placeholder="Select model…"
                options={["Fixed rent", "Management commission", "Hybrid", "Open to discussion"]}
              />
            </FormField>
            <FormField htmlFor="timeline" label="Anticipated Start Date / Timeline">
              <FormInput id="timeline" name="timeline" type="text" placeholder="e.g. Q3 2026" />
            </FormField>
          </FormRow>
        </FormAccordion>

        <FormAccordion title="Additional Information" hint="Optional">
          <FormField htmlFor="notes" label="Tell us more about your asset and what you are looking to achieve">
            <FormTextarea id="notes" name="notes" placeholder="Your goals, asset details, any specific requirements…" />
          </FormField>
        </FormAccordion>

        <FormSubmit>Submit Partnership Enquiry →</FormSubmit>
        <FormNote>A senior member of our institutional team will respond within 24 hours.</FormNote>
      </StaticFormCard>
    </EnquirySplit>
  );
}
