import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { MediaImage, type MediaImageData } from "@core/media";
import { DualCtaPanels, type DualCtaPanel } from "@core/ui";
import { avantioBookingUrl, getGlobals } from "@slices/settings/contract";

/**
 * Owner/Guest dual call-to-action band (Home) — data composer for the presentational
 * `DualCtaPanels` (`core/ui/dual-cta-panels.tsx`). Owner side links to the owners page;
 * guest side links to the Avantio booking engine.
 *
 * The panel copy + background images are **editable in the Home editor** (`home.dual_cta`,
 * resolved upstream into `content`/`media`). When a panel field is unset — or for legacy
 * rows authored before this block existed — it falls back to the localized `pages.dualCta.*`
 * chrome and the approved mock photos below. The contact line is read from the settings
 * singleton (data-model.md → dual-CTA = company_settings). Subscribes transitively to
 * `globals`. See `DualCtaPanels` for the actual layout/markup.
 */
const OWNER_IMG =
  "https://images.pexels.com/photos/20143167/pexels-photo-20143167.jpeg?auto=compress&cs=tinysrgb&w=1400";
const GUEST_IMG =
  "https://images.pexels.com/photos/4450201/pexels-photo-4450201.jpeg?auto=compress&cs=tinysrgb&w=1400";

const PANEL_CLASS =
  "absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105";
// Two equal panels from `md`, one full-width column below.
const PANEL_SIZES = "(max-width: 768px) 100vw, 50vw";

/** The panel background: optimised when the backoffice has an asset, otherwise the approved
 *  mock photo emitted verbatim — Pexels already serves it pre-sized (ADR 0027). */
function PanelImage({
  asset,
  fallbackSrc,
  alt,
}: {
  asset?: MediaImageData;
  fallbackSrc: string;
  alt: string;
}) {
  if (asset) {
    return (
      <MediaImage
        data={asset.alt ? asset : { ...asset, alt }}
        className={PANEL_CLASS}
        sizes={PANEL_SIZES}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- external mock photo, CDN-sized
  return <img src={fallbackSrc} alt={alt} className={PANEL_CLASS} />;
}

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
  const ownerAsset = owner?.image_media_id ? media[owner.image_media_id] : undefined;
  const guestAsset = guest?.image_media_id ? media[guest.image_media_id] : undefined;

  const ownerContact = globals
    ? [globals.phone, globals.email, globals.whatsapp ? `WhatsApp ${globals.whatsapp}` : null]
        .filter(Boolean)
        .join(" · ")
    : null;
  const guestContact = globals ? `${globals.phone} · ${globals.email}` : null;

  const ownerTitle = owner?.title || t("dualCta.ownerTitle");
  const guestTitle = guest?.title || t("dualCta.guestTitle");

  const ownerPanel: DualCtaPanel = {
    image: <PanelImage asset={ownerAsset} fallbackSrc={OWNER_IMG} alt={ownerTitle} />,
    eyebrow: owner?.eyebrow || t("dualCta.ownerEyebrow"),
    title: ownerTitle,
    body: owner?.body || t("dualCta.ownerBody"),
    cta: {
      href: `/${locale}/owners`,
      label: owner?.cta_label || t("dualCta.ownerCta"),
    },
    contactLine: ownerContact ?? undefined,
  };

  const guestPanel: DualCtaPanel = {
    image: <PanelImage asset={guestAsset} fallbackSrc={GUEST_IMG} alt={guestTitle} />,
    eyebrow: guest?.eyebrow || t("dualCta.guestEyebrow"),
    title: guestTitle,
    body: guest?.body || t("dualCta.guestBody"),
    cta: {
      href: avantioBookingUrl(locale),
      label: guest?.cta_label || t("dualCta.guestCta"),
      variant: "light",
    },
    contactLine: guestContact ?? undefined,
  };

  return <DualCtaPanels panels={[ownerPanel, guestPanel]} />;
}
