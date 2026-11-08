import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { DEFAULT_GLOBALS } from "../../defaults";
import { getGlobals } from "../../server/queries";
import { Link } from "@/i18n/navigation";

/**
 * Floating owner/WhatsApp actions (app-shell chrome): two bottom-right circular CTAs
 * separated by12px. Owners opens the localized Owners page; WhatsApp opens a chat
 * in a new tab. Pure server component — no client island. The brand green (`#25d366`) is an
 * intentional, scoped exception to the locked "Warm Editorial" palette: it identifies the
 * third-party WhatsApp brand and is confined to this single chrome element.
 *
 * `--fab-lift` (default 0) raises both buttons above page-owned fixed bottom chrome — e.g. the
 * services detail mobile booking bar sets it while that bar is visible — without either side
 * importing the other.
 *
 * Number comes from Settings in the active locale, normalized for wa.me. Only an
 * absent singleton uses the shared defaults; an explicit blank hides WhatsApp.
 */
export async function WhatsAppFab({ locale }: { locale: Locale }) {
  const [t, globals] = await Promise.all([
    getTranslations("settings"),
    getGlobals(locale),
  ]);
  const number = (globals ? globals.whatsapp : DEFAULT_GLOBALS.whatsapp)?.replace(/\D/g, "");
  const whatsappHref = number ? `https://wa.me/${number}` : null;
  const label = t("whatsappCta");
  const ownerLabel = t("ctaEarn");

  return (
    <div className="fixed bottom-[calc(1.25rem_+_var(--fab-lift,0px))] right-5 z-50 flex flex-col items-center gap-[30px] sm:bottom-[calc(320px_+_var(--fab-lift,0px))] sm:right-7">
      <Link
        href="/owners"
        aria-label={ownerLabel}
        title={ownerLabel}
        className="inline-flex h-[73.92px] w-[73.92px] items-center justify-center rounded-full bg-accent px-[7.92px] text-center text-[13.2px] font-semibold leading-tight text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none sm:h-[84.48px] sm:w-[84.48px] sm:text-[14.52px]"
      >
        <span className="text-balance">{ownerLabel}</span>
      </Link>
      {whatsappHref ? <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25d366] motion-reduce:transition-none sm:h-16 sm:w-16"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="h-7 w-7 sm:h-8 sm:w-8"
        >
        <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
        </svg>
      </a> : null}
    </div>
  );
}
