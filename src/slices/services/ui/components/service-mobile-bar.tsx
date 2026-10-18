"use client";

import { useEffect, useRef } from "react";
import { ButtonLink } from "@core/ui";
import type { BookingAction } from "./service-booking-card";

/**
 * Mobile booking bar (≤980px, where the sticky booking card falls back into the flow): a
 * fixed bottom `surface` bar with a hairline top, the serif 22px price (13px suffix) on the
 * left and the primary action on the right. Hidden above 980px. Ported 1:1 from
 * `mock/service-detail.html`'s `.mbar`; the button is `core/ui`'s `ButtonLink` (as in the card).
 * While visible it sets `--fab-lift` so the app shell's floating WhatsApp button sits above it.
 * The same measured space follows the global footer, keeping its final controls reachable.
 */
const MOBILE_SPACE = `@media (max-width:980px){
  :root:has([data-service-mobile-bar]){--fab-lift:76px}
  body:has([data-service-mobile-bar]){padding-bottom:var(--fab-lift,76px)}
}`;

export function ServiceMobileBar({
  price,
  suffix,
  action,
}: {
  /** Formatted price, the "On request" label, or null to keep only the action. */
  price: string | null;
  suffix: string | null;
  action: BookingAction;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const root = document.documentElement;
    const mobile = window.matchMedia("(max-width:980px)");
    const previousLift = root.style.getPropertyValue("--fab-lift");
    const previousPriority = root.style.getPropertyPriority("--fab-lift");
    const restoreLift = () => {
      if (previousLift)
        root.style.setProperty("--fab-lift", previousLift, previousPriority);
      else root.style.removeProperty("--fab-lift");
    };
    const updateLift = () => {
      if (mobile.matches)
        root.style.setProperty("--fab-lift", `${Math.ceil(bar.getBoundingClientRect().height)}px`);
      else restoreLift();
    };
    // Labels, fonts and viewport changes can all change the bar's rendered height.
    const observer = new ResizeObserver(updateLift);
    observer.observe(bar);
    mobile.addEventListener("change", updateLift);
    updateLift();
    return () => {
      observer.disconnect();
      mobile.removeEventListener("change", updateLift);
      restoreLift();
    };
  }, []);

  return (
    <>
      <style>{MOBILE_SPACE}</style>
      <div ref={barRef} data-service-mobile-bar className="fixed inset-x-0 bottom-0 z-[55] flex items-center justify-between gap-4 border-t border-line bg-surface px-5 py-[14px] min-[981px]:hidden">
        {price !== null ? <div className="min-w-0 font-serif text-[22px] leading-[1.6] text-ink [overflow-wrap:anywhere]">
          {price}
          {suffix ? (
            <small className="font-sans text-[13px] text-ink-soft">
              {" "}
              {suffix}
            </small>
          ) : null}
        </div> : null}
        <ButtonLink href={action.href} className={`min-w-0 max-w-full [overflow-wrap:anywhere] ${price === null ? "w-full" : ""}`}>{action.label}</ButtonLink>
      </div>
    </>
  );
}
