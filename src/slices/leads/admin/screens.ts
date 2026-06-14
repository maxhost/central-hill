import type { AdminScreen } from "@slices/backoffice/contract";

/**
 * The leads slice's contribution to the backoffice sidebar (S12 plug-in
 * framework). The app panel layout spreads this into `composeAdminNav`. Labels
 * are i18n **keys** resolved against the `backoffice` namespace by the nav
 * renderer (`nav.leads` lives there); screen-body strings use the `leads`
 * namespace. The inbox sits in the `crm` ("Leads & CRM") group. Type-only import
 * — no runtime/`server-only`, safe to re-export from `contract.ts`.
 */
export const leadsAdminScreens: AdminScreen[] = [
  { id: "leads.inbox", href: "/admin/leads", label: "nav.leads", group: "crm", order: 0 },
];
