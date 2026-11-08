import { REAL_ESTATE_SECTIONS } from "./ui/subnav-sections";

export const isFixedNavigationEntity = (type: string): boolean => type === "nav_item";
export interface FixedNavEntry { key: string; labelKey: string; url: string; children?: readonly FixedNavEntry[] }
const sections = (prefix: string, route: string, pairs: readonly (readonly [string, string])[]): FixedNavEntry[] =>
  pairs.map(([key, anchor]) => ({ key, labelKey: `subnav.${prefix}.${key}`, url: `${route}#${anchor}` }));
export const FIXED_HEADER: readonly FixedNavEntry[] = [
  { key: "owners", labelKey: "nav.owners", url: "/owners", children: sections("owners", "/owners", [
    ["worth", "worth"], ["numbers", "numbers"], ["why", "why"], ["services", "services"],
    ["plans", "plans"], ["journey", "journey"], ["technology", "technology"],
    ["testimonials", "testimonials"], ["faq", "faq"], ["start", "start"],
  ]) },
  { key: "buildings", labelKey: "nav.buildings", url: "/buildings" },
  { key: "realEstate", labelKey: "nav.realEstate", url: "/real-estate", children: REAL_ESTATE_SECTIONS.map(s => ({ key: s.key, labelKey: `subnav.realEstate.${s.key}`, url: s.href })) },
  { key: "guests", labelKey: "nav.guests", url: "/guests", children: [
    { key: "services", labelKey: "subnav.guests.services", url: "/services" },
    { key: "guides", labelKey: "subnav.guests.guides", url: "/guides" },
  ] },
  { key: "about", labelKey: "nav.about", url: "/about", children: sections("about", "/about", [
    ["whoWeAre", "who-we-are"], ["story", "story"], ["serve", "serve"], ["values", "values"],
    ["organised", "organised"], ["certifications", "certifications"], ["community", "community"], ["contact", "contact"],
  ]) },
  { key: "blog", labelKey: "nav.blog", url: "/blog" },
];
export const FIXED_FOOTER: readonly FixedNavEntry[] = [
  { key: "owners", labelKey: "footer.ownersTitle", url: "/owners", children: [
    ["earningsEstimate", "/owners"], ["ownerServices", "/owners"], ["pricing", "/owners"],
    ["listProperty", "/owners"], ["ownerTestimonials", "/owners"],
  ].map(([key, url]) => ({ key, labelKey: `footer.${key}`, url })) },
  { key: "company", labelKey: "footer.companyTitle", url: "/about", children: [
    ["browseApartments", "/buildings"], ["buildings", "/buildings"], ["about", "/about"],
    ["blog", "/blog"], ["contact", "/about"],
  ].map(([key, url]) => ({ key, labelKey: `footer.${key}`, url })) },
];
