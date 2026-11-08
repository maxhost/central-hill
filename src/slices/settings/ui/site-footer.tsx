import { getTranslations } from "next-intl/server";
import Image from "next/image";
import footerLogo from "../../../../logos/Logo footer.png";
import type { Locale } from "@core/db/columns";
import { Footer, type FooterNavGroup, type FooterSocialLink } from "@core/ui";
import { Icon } from "@core/ui/icon";
import { DEFAULT_GLOBALS } from "../defaults";
import { getGlobals, getNav } from "../server/queries";
import { FooterNewsletter } from "./components/footer-newsletter";
import { LocaleSwitcher } from "./components/locale-switcher";

/**
 * Site-wide footer composer. Contact and social details come from Settings;
 * navigation columns use the fixed localized code tree returned by getNav.
 * The presentational Footer retains the existing markup and behavior.
 */

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

  const groups: FooterNavGroup[] = navGroups.map((group) => ({
    title: group.label,
    links: group.children.map((child) => ({ label: child.label, href: child.url })),
  }));

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
        <Image
          src={footerLogo}
          alt="Central Hill"
          className="h-auto w-[200px] max-w-full"
          sizes="200px"
        />
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
            consentLabel: t("footer.newsletter.consentLabel"),
            submit: t("footer.newsletter.submit"),
            pending: t("footer.newsletter.pending"),
            error: t("footer.newsletter.error"),
            success: t("footer.newsletter.success"),
            close: t("footer.newsletter.close"),
          }}
        />
      }
      contact={{
        callLabel: t("footer.call"),
        phone: g.phone,
        email: g.email,
        officeAddress: g.officeAddress,
        officeLabel: t("footer.office"),
        bookingsLabel: t("footer.bookings"),
        ownersPhone: g.ownersPhone?.trim() || undefined,
        ownersLabel: t("footer.ownersPhone"),
        checkinPhone: g.checkinPhone || undefined,
        checkinLabel: t("footer.checkin"),
        phoneIcon: <Icon name="phone" size={18} />,
        emailIcon: <Icon name="mail" size={18} />,
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
