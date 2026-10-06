import { ButtonLink } from "@core/ui";
import type { BookingAction } from "./service-booking-card";

/**
 * Mobile booking bar (≤980px, where the sticky booking card falls back into the flow): a
 * fixed bottom `surface` bar with a hairline top, the serif 22px price (13px suffix) on the
 * left and the primary action on the right. Hidden above 980px. Ported 1:1 from
 * `mock/service-detail.html`'s `.mbar`; the button is `core/ui`'s `ButtonLink` (as in the card).
 * While visible it sets `--fab-lift` so the app shell's floating WhatsApp button sits above it.
 */
const LIFT_FAB = "@media (max-width:980px){:root{--fab-lift:76px}}";

export function ServiceMobileBar({
  price,
  suffix,
  action,
}: {
  /** Formatted price, or the "On request" label. */
  price: string;
  suffix: string | null;
  action: BookingAction;
}) {
  return (
    <>
      <style>{LIFT_FAB}</style>
      <div className="fixed inset-x-0 bottom-0 z-[55] flex items-center justify-between gap-4 border-t border-line bg-surface px-5 py-[14px] min-[981px]:hidden">
        <div className="font-serif text-[22px] leading-[1.6] text-ink">
          {price}
          {suffix ? (
            <small className="font-sans text-[13px] text-ink-soft">
              {" "}
              {suffix}
            </small>
          ) : null}
        </div>
        <ButtonLink href={action.href}>{action.label}</ButtonLink>
      </div>
    </>
  );
}
