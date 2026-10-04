import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { Footer, type FooterNavGroup, type FooterSocialLink } from "@core/ui";
import { DEFAULT_GLOBALS } from "../defaults";
import { getGlobals, getNav } from "../server/queries";
import { FooterNewsletter } from "./components/footer-newsletter";
import { LocaleSwitcher } from "./components/locale-switcher";

/**
 * Site-wide footer (app-shell chrome) — data composer for the presentational `Footer`
 * (`core/ui/footer.tsx`, ADR 0033). Reads the settings singleton (falling back to
 * `DEFAULT_GLOBALS` until S12 configures settings) and the `nav_item` footer columns
 * (falling back to a localized default), resolves every i18n string, and builds the
 * `contact`/`social`/`groups`/`copyrightLabel` props. See `Footer` for the actual markup.
 */

/** Default columns (key → route) used when no footer `nav_item` rows exist yet. */
function defaultGroups(t: (k: string) => string): FooterNavGroup[] {
  return [
    {
      title: t("footer.ownersTitle"),
      links: [
        { label: t("footer.earningsEstimate"), href: "/owners" },
        { label: t("footer.ownerServices"), href: "/owners" },
        { label: t("footer.pricing"), href: "/owners" },
        { label: t("footer.listProperty"), href: "/owners" },
        { label: t("footer.ownerTestimonials"), href: "/owners" },
      ],
    },
    {
      title: t("footer.companyTitle"),
      links: [
        { label: t("footer.browseApartments"), href: "/buildings" },
        { label: t("footer.buildings"), href: "/buildings" },
        { label: t("footer.about"), href: "/about" },
        { label: t("footer.blog"), href: "/blog" },
        { label: t("footer.contact"), href: "/about" },
      ],
    },
  ];
}

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "ig",
  facebook: "f",
  linkedin: "in",
  youtube: "yt",
  tiktok: "tk",
};

export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = await getTranslations("settings");
  const g = (await getGlobals(locale)) ?? DEFAULT_GLOBALS;
  const navGroups = await getNav(locale, "footer");

  const groups: FooterNavGroup[] = navGroups.length
    ? navGroups.map((grp) => ({
        title: grp.label,
        links: grp.children.map((c) => ({ label: c.label, href: c.url })),
      }))
    : defaultGroups(t);

  const social: FooterSocialLink[] = Object.entries(g.social)
    .filter(([, url]) => Boolean(url))
    .map(([key, url]) => ({
      key,
      url: url as string,
      label: SOCIAL_LABELS[key] ?? key.slice(0, 2),
    }));

  const year = new Date().getFullYear();

  return (
    <Footer
      brand={
        <div className="font-serif text-[27px] font-semibold">
          Central<span className="text-feature-accent">Hill</span>
        </div>
      }
      toggleLabel={t("footer.toggle")}
      ownerLabel={t("footer.owner")}
      guestLabel={t("footer.guest")}
      newsletter={
        <FooterNewsletter
          labels={{
            placeholder: t("footer.newsletter.placeholder"),
            cta: t("footer.newsletter.cta"),
            ariaLabel: t("footer.newsletter.ariaLabel"),
            modalTitle: t("footer.newsletter.modalTitle"),
            modalIntro: t("footer.newsletter.modalIntro"),
            emailLabel: t("footer.newsletter.emailLabel"),
            termsLabel: t("footer.newsletter.termsLabel"),
            marketingLabel: t("footer.newsletter.marketingLabel"),
            submit: t("footer.newsletter.submit"),
            success: t("footer.newsletter.success"),
            close: t("footer.newsletter.close"),
          }}
        />
      }
      contact={{
        callLabel: t("footer.call"),
        phone: g.phone,
        email: g.email,
        whatsappLabel: g.whatsapp ? t("footer.whatsapp") : undefined,
        whatsapp: g.whatsapp || undefined,
      }}
      social={social}
      groups={groups}
      copyrightLabel={t("footer.rights", { year })}
      localeSwitcher={<LocaleSwitcher current={locale} label={t("language")} tone="bg" />}
    />
  );
}
