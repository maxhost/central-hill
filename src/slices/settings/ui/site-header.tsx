import { getTranslations } from "next-intl/server";
import Image from "next/image";
import topBarLogo from "../../../../logos/Logo Barra Topo bg.png";
import darkTopBarLogo from "../../../../logos/logo-barra-topo-base.png";
import type { Locale } from "@core/db/columns";
import { MobileDrawer, NavBar, buttonClassName, type NavEntry } from "@core/ui";
import { Icon } from "@core/ui/icon";
import { Link } from "@/i18n/navigation";
import { AVANTIO_OWNERS_LOGIN_URL } from "../contract";
import { SITE_ICON_DEFAULTS } from "../site-icons";
import { getGlobals, getNav } from "../server/queries";
import { defaultNavigationCtas } from "../server/navigation-ctas";
import { navigationCtaHref } from "../navigation-cta-types";
import { ContactDialog } from "./components/contact-dialog";
import { HeaderScroll } from "./components/header-scroll";
import { LocaleSwitcher } from "./components/locale-switcher";

/**
 * Site-wide header with fixed localized navigation, shared with the mobile drawer.
 * Labels, destinations and order come from the canonical code tree via getNav;
 * Settings controls the booking CTA and site icons. The bar is fixed and changes
 * from transparent to frosted on scroll (HeaderScroll and globals.css).
 */
export async function SiteHeader({ locale }: { locale: Locale }) {
  const t = await getTranslations("settings");
  const [items, globals] = await Promise.all([getNav(locale, "header"), getGlobals(locale)]);
  // Site icons (Settings → "Site icons", ADR 0034 amendment 2). `?? defaults` also covers a
  // globals entry cached before `icons` existed.
  const icons = globals?.icons ?? SITE_ICON_DEFAULTS;
  const navigationCtas = globals?.navigationCtas ?? defaultNavigationCtas(locale);
  const bookHref = navigationCtaHref(navigationCtas.book.url, locale);

  const links: NavEntry[] = items.map((item) => ({
    label: item.label,
    href: item.url,
    children: item.children.map((child) => ({ label: child.label, href: child.url })),
  }));

  return (
    <>
      <HeaderScroll />
      <NavBar
        skipLinkLabel={t("skip")}
        brand={
          <Link
            href="/"
            aria-label={t("home")}
            data-brand
            className="inline-flex shrink-0 items-center"
          >
            <Image
              data-header-logo="light"
              src={topBarLogo}
              alt="Central Hill"
              className="h-[47.916px] w-auto md:h-[53.24px]"
              sizes="(min-width: 768px) 189px, 170px"
              priority
            />
            <Image
              data-header-logo="dark"
              src={darkTopBarLogo}
              alt="Central Hill"
              className="h-[47.916px] w-auto md:h-[53.24px]"
              sizes="(min-width: 768px) 189px, 170px"
              loading="eager"
            />
          </Link>
        }
        links={links}
        ctas={
          <>
            {/* Both header presentations use the selected language’s configured booking button. */}
            <a
              href={bookHref}
              target="_blank"
              rel="noopener noreferrer"
              data-cta="ghost"
              className={buttonClassName("ghost", undefined, "sm")}
            >
              {navigationCtas.book.label}
            </a>
          </>
        }
        utilities={
          <div className="header-utilities">
            <a
              href={AVANTIO_OWNERS_LOGIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("ownerLogin")}
              title={t("ownerLogin")}
              data-icon-btn
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-ink"
            >
              <Icon name={icons.account} size={20} />
            </a>
            <ContactDialog
              variant="icon"
              label={t("contact")}
              title={t("contactDialog.title")}
              intro={t("contactDialog.intro")}
              icon={<Icon name={icons.contact} size={20} />}
            />
            <LocaleSwitcher
              current={locale}
              label={t("language")}
              icon={<Icon name={icons.language} size={18} />}
            />
          </div>
        }
        mobileDrawer={
          <MobileDrawer
            links={links}
            loginHref={AVANTIO_OWNERS_LOGIN_URL}
            loginLabel={t("ownerLogin")}
            contactSlot={
              // Keyed: without it React (dev) warns "unique key" when this server-built element
              // renders inside the client drawer.
              <ContactDialog
                key="drawer-contact"
                variant="button"
                label={t("contact")}
                title={t("contactDialog.title")}
                intro={t("contactDialog.intro")}
              />
            }
            book={{ href: bookHref, label: navigationCtas.book.label, external: true }}
            openLabel={t("menu")}
            closeLabel={t("close")}
          />
        }
      />
    </>
  );
}
