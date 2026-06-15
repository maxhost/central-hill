import type { Locale } from "@core/db/columns";
import { JsonLd, localBusinessLd, organizationLd } from "@core/seo";
import { getGlobals } from "@slices/settings/contract";
import { SITE_NAME, siteUrl } from "../config";

/**
 * Slice `seo` (S13) — site-wide `Organization` + `LodgingBusiness` JSON-LD (ADR
 * 0020). Composed once into the public root layout so every page carries a stable
 * NAP for search/answer engines. Data comes from `settings.getGlobals` (already
 * `unstable_cache`-tagged `globals`); the org **name** is the constant `SITE_NAME`
 * (`SiteGlobals` has no name field). Renders the Organization with name+url even
 * when globals are unconfigured, so identity is never missing.
 */
export async function SiteJsonLd({ locale }: { locale: Locale }) {
  const globals = await getGlobals(locale);
  const url = siteUrl();
  const logo = globals?.defaultOgImage?.url;
  const sameAs = globals
    ? Object.values(globals.social).filter((v): v is string => Boolean(v))
    : [];

  const shared = {
    name: SITE_NAME,
    url,
    logo,
    email: globals?.email,
    telephone: globals?.phone,
    sameAs,
  };

  const data = [
    organizationLd(shared),
    localBusinessLd({
      ...shared,
      address: globals?.officeAddress,
      image: logo ? [logo] : undefined,
      currency: globals?.currency,
    }),
  ];

  return <JsonLd data={data} />;
}
