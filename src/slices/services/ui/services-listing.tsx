import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ServicesPage } from "@slices/pages/contract";
import type { Locale } from "@core/db/columns";
import { Reveal } from "@core/ui";
import {
  getServicesPage,
  ServicesHero,
  ServicesIntro,
  ServicesHowItWorks,
  ServicesFinalCta,
} from "@slices/pages/contract";
import { listServices } from "../contract";
import { ServiceCard } from "./components/service-card";

/** Pages owns the fixed editorial sections; Services retains its tagged, ordered catalogue. */
export async function ServicesListing({ locale }: { locale: Locale }) {
  return ServicesListingRenderer({ locale });
}

export async function ServicesListingRenderer({ locale, page: suppliedPage, preview = false }: { locale: Locale; page?: ServicesPage | null; preview?: boolean }) {
  void preview;
  setRequestLocale(locale);
  const [services, page, t] = await Promise.all([
    listServices(locale),
    suppliedPage ?? getServicesPage(locale),
    getTranslations({ locale, namespace: "services" }),
  ]);
  return (
    <>
      <ServicesHero page={page} locale={locale} />
      {/* Every `Reveal` renders hidden on the server; this keeps them visible with JS off. */}
      <noscript>
        <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <section
        id="services"
        className="scroll-mt-[84px] py-[clamp(72px,10vw,150px)]"
      >
        <div className="mx-auto max-w-[1240px] px-[28px]">
          <ServicesIntro page={page} locale={locale} />
          {services.length > 0 ? (
            <Reveal label="services-grid">
              <div className="grid grid-cols-1 gap-[26px] min-[681px]:grid-cols-2 min-[981px]:grid-cols-3">
                {services.map((service, index) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    locale={locale}
                    viewLabel={t("viewDetails")}
                    priority={index < 3}
                  />
                ))}
              </div>
            </Reveal>
          ) : (
            <p className="text-center text-ink-soft">{t("empty")}</p>
          )}
        </div>
      </section>
      <ServicesHowItWorks page={page} locale={locale} />
      <ServicesFinalCta page={page} locale={locale} />
    </>
  );
}
