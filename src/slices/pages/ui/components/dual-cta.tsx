import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { ButtonLink, Container, Eyebrow } from "@core/ui";
import { avantioBookingUrl, getGlobals } from "@slices/settings/contract";

/**
 * Owner/Guest dual call-to-action band (Home/Guest). The two-column copy is UI chrome
 * (`pages.dualCta.*`); the contact line is read from the settings singleton
 * (data-model.md → dual-CTA = company_settings). Subscribes transitively to `globals`.
 */
export async function DualCta({ locale }: { locale: Locale }) {
  const [globals, t] = await Promise.all([getGlobals(locale), getTranslations("pages")]);

  const contact = globals
    ? [globals.phone, globals.email, globals.whatsapp ? `WhatsApp ${globals.whatsapp}` : null]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <section className="pb-[clamp(64px,10vw,160px)]">
      <Container>
        <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-line md:grid-cols-2">
          <div className="bg-accent/[0.06] p-8 md:p-12">
            <Eyebrow accent>{t("dualCta.ownerEyebrow")}</Eyebrow>
            <h3 className="mt-3 font-serif text-2xl leading-snug text-ink">
              {t("dualCta.ownerTitle")}
            </h3>
            <p className="mt-3 leading-relaxed text-ink-soft">{t("dualCta.ownerBody")}</p>
            <div className="mt-6">
              <ButtonLink href={`/${locale}/owners`}>{t("dualCta.ownerCta")}</ButtonLink>
            </div>
            {contact ? <p className="mt-5 text-sm text-ink-soft">{contact}</p> : null}
          </div>
          <div className="bg-surface p-8 md:p-12">
            <Eyebrow>{t("dualCta.guestEyebrow")}</Eyebrow>
            <h3 className="mt-3 font-serif text-2xl leading-snug text-ink">
              {t("dualCta.guestTitle")}
            </h3>
            <p className="mt-3 leading-relaxed text-ink-soft">{t("dualCta.guestBody")}</p>
            <div className="mt-6">
              <ButtonLink href={avantioBookingUrl(locale)} variant="outline">
                {t("dualCta.guestCta")}
              </ButtonLink>
            </div>
            {globals ? (
              <p className="mt-5 text-sm text-ink-soft">
                {globals.phone} · {globals.email}
              </p>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
