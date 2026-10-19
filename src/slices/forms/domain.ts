import type { FormBlueprint, FormCopy, FormField, FormTemplate, FormTranslations, TargetLocale } from "./types";

/** Stable IDs are independent of order, labels and locale. All copy paths are kernel-owned block keys. */
export function textFields(definition: FormBlueprint): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(definition.copy)) fields[`block:copy.${key}`] = value;
  for (const step of definition.steps) fields[`block:steps.${step.id}.title`] = step.title;
  for (const field of definition.fields) {
    for (const key of ["label", "placeholder", "help"] as const) fields[`block:fields.${field.id}.${key}`] = field[key];
    for (const option of field.options) fields[`block:fields.${field.id}.options.${option.id}`] = option.label;
  }
  return fields;
}
export function localizedBlueprint(definition: FormBlueprint, values: Record<string, string>): FormBlueprint {
  const value = (key: string, source: string) => values[key]?.trim() || source;
  return {
    ...definition,
    copy: Object.fromEntries(Object.entries(definition.copy).map(([key, source]) => [key, value(`block:copy.${key}`, source)])) as unknown as FormCopy,
    steps: definition.steps.map(step => ({ ...step, title: value(`block:steps.${step.id}.title`, step.title) })),
    fields: definition.fields.map(field => ({ ...field,
      label: value(`block:fields.${field.id}.label`, field.label),
      placeholder: value(`block:fields.${field.id}.placeholder`, field.placeholder),
      help: value(`block:fields.${field.id}.help`, field.help),
      options: field.options.map(option => ({ ...option, label: value(`block:fields.${field.id}.options.${option.id}`, option.label) })),
    })),
  };
}
/** Approved targets render, including stale approved copy, matching the existing CMS policy. */
export function approvedBlueprint(definition: FormBlueprint, translations: FormTranslations, locale: "en" | TargetLocale): FormBlueprint {
  if (locale === "en") return definition;
  return localizedBlueprint(definition, Object.fromEntries(Object.entries(translations[locale]).filter(([, row]) => row.state === "approved").map(([key, row]) => [key, row.value])));
}
export function newField(stepId: string, type: FormField["type"] = "text"): FormField {
  return { id: crypto.randomUUID(), stepId, type, label: "New field", placeholder: "", help: "", required: false, width: 2, options: [], consent: false };
}
export function createBlueprint(template: FormTemplate): FormBlueprint {
  const propertyStep = crypto.randomUUID();
  const contactStep = crypto.randomUUID();
  const make = (label: string, type: FormField["type"], required = true, stepId = propertyStep): FormField => ({ ...newField(stepId, type), label, required });
  const email = make("Email", "email", true, template === "owner-estimate" ? contactStep : propertyStep);
  const copy: FormCopy = { title: "Contact us", description: "", submit: "Send message", next: "Continue", back: "Back", cancel: "Cancel", successTitle: "Thank you", successMessage: "Your message has been received.", errorMessage: "We could not send your message. Please try again." };
  let steps = [{ id: propertyStep, title: "Contact details" }];
  let fields = [make("Name", "text"), email, make("Subject", "text"), make("Message", "textarea")];
  if (template === "newsletter") {
    copy.title = "Stay informed. Stay ahead."; copy.submit = "Subscribe";
    copy.successMessage = "Your subscription request has been received.";
    fields = [email, { ...make("I agree to receive news by email", "checkbox"), consent: true }];
  }
  if (template === "owner-estimate") {
    copy.title = "EARN +35%"; copy.description = "Get your free profitability study"; copy.submit = "Get my study";
    steps = [{ id: propertyStep, title: "Your property" }, { id: contactStep, title: "Contact details" }];
    const bedrooms = make("Bedrooms", "select");
    bedrooms.options = ["Studio", "1", "2", "3", "4", "5", "6+"].map(label => ({ id: crypto.randomUUID(), label }));
    fields = [make("Property address", "text"), { ...make("Number of properties", "number"), min: 1, max: 1000 }, bedrooms,
      make("Name", "text", true, contactStep), email, make("Phone", "tel", false, contactStep),
      { ...make("I accept the terms and privacy notice", "checkbox", true, contactStep), consent: true },
      { ...make("I would like to receive marketing emails", "checkbox", false, contactStep), consent: true }];
  }
  return { schemaVersion: 1, columns: template === "newsletter" ? 1 : 2, steps, fields, copy, replyToFieldId: email.id };
}
