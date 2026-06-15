import type { AdminScreen } from "@slices/backoffice/contract";

/**
 * The translation slice's contribution to the backoffice sidebar (S14 — S12
 * plug-in framework). The app panel layout spreads this into `composeAdminNav`.
 * Labels are i18n **keys** resolved against the `backoffice` namespace
 * (`nav.translations`); screen-body strings use the `translation` namespace. Sits
 * in the reserved `translation` ("Translations") group, visible to any staff —
 * including the `translator` role. Type-only import — safe to re-export from
 * `contract.ts`.
 */
export const translationAdminScreens: AdminScreen[] = [
  {
    id: "translation.inbox",
    href: "/admin/translations",
    label: "nav.translations",
    group: "translation",
    order: 0,
  },
];
