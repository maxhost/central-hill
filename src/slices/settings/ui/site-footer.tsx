import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { Container } from "@core/ui";
import { Link } from "@/i18n/navigation";
import { DEFAULT_GLOBALS } from "../defaults";
import { getGlobals, getNav } from "../server/queries";
import { LocaleSwitcher } from "./components/locale-switcher";

/**
 * Site-wide footer (app-shell chrome): brand + contact + social, the navigation
 * columns from the `nav_item` table (location `footer`, grouped by parent), and a
 * bottom bar with copyright + language switcher. Globals come from the singleton
 * (`getGlobals`), falling back to `DEFAULT_GLOBALS` until S12 configures settings;
 * footer columns fall back to a localized default (i18n `settings.footer.*`).
 */

interface FooterGroup {
  title: string;
  links: Array<{ label: string; href: string }>;
}

/** Default columns (key → route) used when no footer `nav_item` rows exist yet. */
function defaultGroups(t: (k: string) => string): FooterGroup[] {
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

  const groups: FooterGroup[] = navGroups.length
    ? navGroups.map((grp) => ({
        title: grp.label,
        links: grp.children.map((c) => ({ label: c.label, href: c.url })),
      }))
    : defaultGroups(t);

  const social = Object.entries(g.social).filter(([, url]) => Boolean(url));
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-feature text-bg">
      <Container className="py-16">
        <div className="mb-10 text-sm text-bg/70">
          {t("footer.toggle")}{" "}
          <Link href="/owners" className="text-bg underline-offset-4 hover:underline">
            {t("footer.owner")}
          </Link>{" "}
          ·{" "}
          <Link href="/guests" className="text-bg underline-offset-4 hover:underline">
            {t("footer.guest")}
          </Link>
        </div>

        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="font-serif text-2xl font-semibold">
              Central<span className="text-accent">Hill</span>
            </div>
            <div className="mt-4 space-y-1 text-sm text-bg/70">
              <div>
                {t("footer.call")}{" "}
                <a href={`tel:${g.phone.replace(/\s+/g, "")}`} className="hover:text-bg">
                  {g.phone}
                </a>
              </div>
              <div>
                <a href={`mailto:${g.email}`} className="hover:text-bg">
                  {g.email}
                </a>
              </div>
              {g.whatsapp ? (
                <div>
                  {t("footer.whatsapp")} {g.whatsapp}
                </div>
              ) : null}
            </div>
            {social.length ? (
              <div className="mt-4 flex gap-3 text-sm">
                {social.map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    aria-label={key}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-bg/30 text-bg/80 transition-colors hover:border-bg hover:text-bg"
                  >
                    {SOCIAL_LABELS[key] ?? key.slice(0, 2)}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {groups.map((grp) => (
            <div key={grp.title}>
              <h4 className="text-xs font-medium uppercase tracking-[0.14em] text-bg/60">
                {grp.title}
              </h4>
              <ul className="mt-4 space-y-2 text-sm">
                {grp.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-bg/75 transition-colors hover:text-bg">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-bg/15 pt-6 text-xs text-bg/60 sm:flex-row sm:items-center sm:justify-between">
          <span>{t("footer.rights", { year })}</span>
          <LocaleSwitcher current={locale} label={t("language")} />
        </div>
      </Container>
    </footer>
  );
}
