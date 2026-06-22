import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import type { MediaImageData } from "@core/media";
import { ButtonLink, Container } from "@core/ui";
import { avantioBookingUrl, getGlobals } from "@slices/settings/contract";

/**
 * Owner/Guest dual call-to-action band (Home) — "Immersive Panels" layout (owner-chosen).
 * Two full-bleed image panels with a dark scrim and white copy overlaid; the image zooms
 * gently on hover (CSS only, so this stays a server component). Owner side links to the
 * owners page; guest side links to the Avantio booking engine.
 *
 * The panel copy + background images are **editable in the Home editor** (`home.dual_cta`,
 * resolved upstream into `content`/`media`). When a panel field is unset — or for legacy
 * rows authored before this block existed — it falls back to the localized `pages.dualCta.*`
 * chrome and the approved mock photos below. The contact line is read from the settings
 * singleton (data-model.md → dual-CTA = company_settings). Subscribes transitively to `globals`.
 */
const OWNER_IMG =
  "https://images.pexels.com/photos/20143167/pexels-photo-20143167.jpeg?auto=compress&cs=tinysrgb&w=1400";
const GUEST_IMG =
  "https://images.pexels.com/photos/4450201/pexels-photo-4450201.jpeg?auto=compress&cs=tinysrgb&w=1400";

type Panel = {
  image_media_id?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  cta_label?: string;
};

export async function DualCta({
  locale,
  content,
  media = {},
}: {
  locale: Locale;
  content?: { owner?: Panel; guest?: Panel };
  media?: Record<string, MediaImageData>;
}) {
  const [globals, t] = await Promise.all([getGlobals(locale), getTranslations("pages")]);

  const owner = content?.owner;
  const guest = content?.guest;
  const ownerImg = (owner?.image_media_id && media[owner.image_media_id]?.url) || OWNER_IMG;
  const guestImg = (guest?.image_media_id && media[guest.image_media_id]?.url) || GUEST_IMG;

  const ownerContact = globals
    ? [globals.phone, globals.email, globals.whatsapp ? `WhatsApp ${globals.whatsapp}` : null]
        .filter(Boolean)
        .join(" · ")
    : null;
  const guestContact = globals ? `${globals.phone} · ${globals.email}` : null;

  return (
    <section className="pb-[clamp(64px,10vw,160px)]">
      <Container>
        <div className="grid grid-cols-1 gap-px overflow-hidden border border-line bg-line md:grid-cols-2">
          {/* Owner panel */}
          <div className="group relative flex min-h-[clamp(440px,54vh,580px)] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- external/R2 panel image */}
            <img
              src={ownerImg}
              alt={owner?.title || t("dualCta.ownerTitle")}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15" />
            <div className="relative mt-auto p-8 text-white md:p-12">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-feature-accent">
                {owner?.eyebrow || t("dualCta.ownerEyebrow")}
              </span>
              <h3 className="mt-3 font-serif text-2xl leading-snug">
                {owner?.title || t("dualCta.ownerTitle")}
              </h3>
              <p className="mt-3 max-w-md leading-relaxed text-white/85">
                {owner?.body || t("dualCta.ownerBody")}
              </p>
              <div className="mt-6">
                <ButtonLink href={`/${locale}/owners`}>
                  {owner?.cta_label || t("dualCta.ownerCta")}
                </ButtonLink>
              </div>
              {ownerContact ? (
                <p className="mt-5 text-sm text-white/75">{ownerContact}</p>
              ) : null}
            </div>
          </div>

          {/* Guest panel */}
          <div className="group relative flex min-h-[clamp(440px,54vh,580px)] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- external/R2 panel image */}
            <img
              src={guestImg}
              alt={guest?.title || t("dualCta.guestTitle")}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15" />
            <div className="relative mt-auto p-8 text-white md:p-12">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/80">
                {guest?.eyebrow || t("dualCta.guestEyebrow")}
              </span>
              <h3 className="mt-3 font-serif text-2xl leading-snug">
                {guest?.title || t("dualCta.guestTitle")}
              </h3>
              <p className="mt-3 max-w-md leading-relaxed text-white/85">
                {guest?.body || t("dualCta.guestBody")}
              </p>
              <div className="mt-6">
                <ButtonLink href={avantioBookingUrl(locale)} variant="light">
                  {guest?.cta_label || t("dualCta.guestCta")}
                </ButtonLink>
              </div>
              {guestContact ? <p className="mt-5 text-sm text-white/75">{guestContact}</p> : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
