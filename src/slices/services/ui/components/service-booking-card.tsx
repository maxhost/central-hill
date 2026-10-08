import { ButtonLink, StickyAside } from "@core/ui";
import type { DetailBookingRow } from "../../contract";
import { Icon } from "@core/ui/icon";

export type BookingAction = { href: string; label: string };

/**
 * The service detail page's sticky booking card — `mock/service-detail.html`'s `.book`
 * content inside `core/ui`'s `StickyAside` shell: a "From" label, the serif 40px price with its
 * 15px suffix (or the "On request" line, without "From", when the service is unpriced), the
 * optional `price_note`, the hairline label/value `booking_rows`, then the actions — a full-width
 * primary `ButtonLink` and an optional full-width `ghost` one 10px below — and an optional note
 * with the `service_note` site icon (a shield by default). Which actions exist is the page's call (booking type → enquiry / external / none).
 * Buttons are `core/ui` `ButtonLink` as on every other page (ADR 0035).
 */
export function ServiceBookingCard({
  label,
  fromLabel,
  price,
  suffix,
  onRequestLabel,
  priceNote,
  rows,
  primary,
  secondary,
  note,
  noteIcon = "shield-check",
}: {
  /** Accessible name of the aside landmark. */
  label: string;
  fromLabel: string;
  /** Formatted price, or null when unpriced. */
  price: string | null;
  suffix: string | null;
  onRequestLabel: string;
  priceNote?: string;
  rows: DetailBookingRow[];
  primary?: BookingAction;
  secondary?: BookingAction;
  note?: string;
  /** Iconoir name drawn before the note (the `service_note` site icon). */
  noteIcon?: string;
}) {
  return (
    <StickyAside label={label}>
      {price ? (
        <>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{fromLabel}</div>
          <div className="mt-1.5 font-serif text-[40px] leading-[1.05] text-ink">
            {price}
            {suffix ? <small className="ml-1 font-sans text-[15px] text-ink-soft">{suffix}</small> : null}
          </div>
        </>
      ) : (
        <div className="font-serif text-[40px] leading-[1.05] text-ink">{onRequestLabel}</div>
      )}
      {priceNote ? <div className="mt-1.5 text-[13.5px] text-ink-soft">{priceNote}</div> : null}
      {rows.length ? (
        <dl className="my-6 border-t border-line">
          {rows.map((r, i) => (
            <div key={i} className="flex justify-between gap-4 border-b border-line py-[13px] text-sm">
              <dt className="text-ink-soft">{r.label}</dt>
              <dd className="text-right font-medium text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="h-6" aria-hidden />
      )}
      {primary ? (
        <ButtonLink href={primary.href} className="w-full">
          {primary.label}
        </ButtonLink>
      ) : null}
      {secondary ? (
        <ButtonLink href={secondary.href} variant="ghost" className={primary ? "mt-2.5 w-full" : "w-full"}>
          {secondary.label}
        </ButtonLink>
      ) : null}
      {note ? (
        <div className="mt-[18px] flex items-start gap-2.5 text-[13px] leading-[1.55] text-ink-soft">
          <Icon name={noteIcon} size={17} className="mt-px block flex-none text-accent-deep" />
          <span>{note}</span>
        </div>
      ) : null}
    </StickyAside>
  );
}
