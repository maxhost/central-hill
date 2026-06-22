import type { CSSProperties } from "react";
import { countryFlag } from "./country-flag";

/**
 * Testimonials presentation (S9) — an **infinite marquee**: a full-bleed track of pull-quote cards
 * that scrolls horizontally and loops seamlessly (two identical copies translated by -50%). Pure
 * CSS (no JS / no client island): pauses on hover, and on `prefers-reduced-motion` the animation
 * stops and the track becomes manually scrollable. Cards mirror `mock/home.html` `.tcard` (bordered
 * surface, type label, oversized rating stars, serif quote, author + country flag). Purely
 * presentational; data is resolved by `TestimonialsRow`.
 */
export interface GridItem {
  id: string;
  roleLabel: string;
  rating: number;
  quote: string;
  authorName: string;
  authorCountry: string;
  propertyLocation: string | null;
}

/** Scoped keyframes + behaviour for the marquee. Inlined so the kernel `globals.css` stays untouched. */
const MARQUEE_CSS = `
.ch-tm-marquee{
  -webkit-mask-image:linear-gradient(to right,transparent,#000 6%,#000 94%,transparent);
  mask-image:linear-gradient(to right,transparent,#000 6%,#000 94%,transparent);
}
.ch-tm-track{ animation: ch-tm-scroll var(--tm-duration,48s) linear infinite; will-change: transform; }
.ch-tm-marquee:hover .ch-tm-track{ animation-play-state: paused; }
@keyframes ch-tm-scroll{ from{ transform: translateX(0); } to{ transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce){
  .ch-tm-track{ animation: none; }
  .ch-tm-marquee{ overflow-x: auto; }
}
`;

export function TestimonialsMarquee({ items }: { items: GridItem[] }) {
  if (items.length === 0) return null;
  // Slower for longer lists so the pace stays calm/premium; ~8s per card, floored at 28s.
  const duration = Math.max(28, items.length * 8);

  return (
    <div
      className="ch-tm-marquee relative mt-12 overflow-hidden py-2"
      role="region"
      aria-label="Customer testimonials"
    >
      <div
        className="ch-tm-track flex w-max"
        style={{ "--tm-duration": `${duration}s` } as CSSProperties}
      >
        {items.map((tm) => (
          <Card key={tm.id} tm={tm} />
        ))}
        {/* Second identical copy — the seamless half of the -50% loop; hidden from a11y tree. */}
        {items.map((tm) => (
          <Card key={`dup-${tm.id}`} tm={tm} ariaHidden />
        ))}
      </div>
      <style>{MARQUEE_CSS}</style>
    </div>
  );
}

function Card({ tm, ariaHidden }: { tm: GridItem; ariaHidden?: boolean }) {
  const flag = countryFlag(tm.authorCountry);
  return (
    <figure
      aria-hidden={ariaHidden}
      className="mr-7 flex w-[clamp(280px,78vw,360px)] shrink-0 flex-col border border-line bg-surface p-8"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-deep">
        {tm.roleLabel}
      </span>
      <Stars rating={tm.rating} />
      <blockquote className="grow font-serif text-xl leading-snug text-ink">
        “{tm.quote}”
      </blockquote>
      <figcaption className="mt-5 text-sm text-ink-soft">
        <span className="font-semibold text-ink">{tm.authorName}</span>
        {" · "}
        {flag ? <span aria-hidden>{flag} </span> : null}
        {tm.authorCountry}
        {tm.propertyLocation ? <span className="block">{tm.propertyLocation}</span> : null}
      </figcaption>
    </figure>
  );
}

/** Five stars (3× the prior size); the first `rating` filled in accent, the rest dimmed to hairline. */
function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="my-4 flex gap-1 text-[2.625rem] leading-none text-accent"
      aria-label={`${rating} / 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden className={i < rating ? "" : "text-line"}>
          ★
        </span>
      ))}
    </span>
  );
}
