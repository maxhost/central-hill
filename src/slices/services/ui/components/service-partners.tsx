import { ButtonLink } from "@core/ui";
import type { DetailPartner } from "../../contract";

/**
 * Partner cards for a service fulfilled by third parties (Luggage Storage's Bounce/Luggit):
 * serif name, description, and an outbound `core/ui` `ButtonLink` (`ghost`, the old
 * `.btn-ghost`; an absolute URL opens in a new tab with `noopener`). 2 → 1 columns at 680px.
 * Port of the old `.mk .partner-grid`/`.partner-card`. Not `BenefitCards`' link variant: that
 * grid starts at 3 columns on a hairline `line` background, so a 2-partner list would leave an
 * empty grey cell, and its whole-card `next/link` has no new-tab behaviour for external URLs.
 */
export function ServicePartners({ partners }: { partners: DetailPartner[] }) {
  return (
    <ul className="grid grid-cols-1 gap-[22px] min-[681px]:grid-cols-2">
      {partners.map((p, i) => (
        <li key={i} className="flex flex-col gap-[14px] rounded-[4px] border border-line bg-surface p-[30px]">
          <h3 className="font-serif text-[22px] font-medium leading-[1.2] text-ink">{p.name}</h3>
          <p className="flex-1 text-[14.5px] leading-[1.65] text-ink-soft">{p.desc}</p>
          <ButtonLink href={p.url} variant="ghost" className="self-start">
            {p.cta_label} →
          </ButtonLink>
        </li>
      ))}
    </ul>
  );
}
