import type { ReactNode } from "react";
import { ButtonLink } from "./button";
import { cn } from "./cn";
import { Container } from "./container";
import { Section } from "./section";

/**
 * Pricing/plan cards grid: a centred heading above up to 4 bordered cards (name, optional
 * tag line, a "most popular" ribbon, an optional corner badge, a feature list with a
 * CSS-drawn checkmark, and a CTA). First built for Owners' "A management plan built around
 * your goals" (`#plans`), ported 1:1 from its old `.mk`-scoped CSS (`.plans`/`.plan` in
 * `owners-page.tsx`'s `OWNERS_STYLE`, now deleted) — no new design. Purely presentational,
 * per the `core/ui` ground rule: no `@core/media`, no slice icon registry, no i18n.
 *
 * `footer` slots arbitrary content (Owners passes a `CalloutBand`) at the exact `mt-20`
 * gap the original `.plan-helpers` used, inside this component's own `Section`/`Container`
 * — not a second, separately-padded section — because the original markup nested both
 * inside the same `<section id="plans"><div class="wrap">`. Kept generic (`ReactNode`,
 * not a `CalloutBand`-shaped prop) so this component doesn't need to know what follows.
 *
 * The heading (`section-title` in the old CSS: `clamp(30px,4vw,50px)`) matches
 * `EditorialSplit`'s own heading treatment exactly, not `blocks.tsx`'s `SectionHeading` —
 * same reasoning as that component's docstring: this page's `.section-title` class is a
 * different, larger scale than `SectionHeading`'s fixed `text-3xl md:text-4xl`.
 *
 * Like `EditorialSplit`/`TwoColumnShowcase`, no animation is wired in here — the caller
 * wraps the whole thing in `core/ui`'s `Reveal`, same as every other Owners section. The
 * original had three independent `reveal-io` regions (heading, card grid with a per-card
 * stagger, the helper band) — simplified to one, the same simplification already made for
 * Owners' "numbers" band (`StatBand`) when that was ported; no new stagger primitive exists
 * in `core/ui` yet.
 */

export type PricingTier = {
  name: string;
  /** Short line under the name (e.g. a commission rate or positioning tag). */
  tag?: string;
  /** Figure shown in the small circular corner badge (e.g. "+5%"). */
  cornerBadge?: string;
  isPopular?: boolean;
  features: string[];
  cta: { href: string; label: string };
};

export function PricingCards({
  headline,
  body,
  tiers,
  footer,
}: {
  headline: string;
  body?: string;
  tiers: PricingTier[];
  /** Extra content below the grid, at the original `.plan-helpers` spacing (e.g. `CalloutBand`). */
  footer?: ReactNode;
}) {
  return (
    <Section>
      <Container>
        <div className="mx-auto mb-[54px] max-w-[45rem] text-center">
          <h2 className="font-serif text-[clamp(1.875rem,4vw,3.125rem)] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
            {headline}
          </h2>
          {body ? (
            <p className="mx-auto mt-4 max-w-[62ch] text-lg text-ink-soft">{body}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 items-start gap-5 min-[681px]:grid-cols-2 min-[981px]:grid-cols-4">
          {tiers.map((t, i) => (
            <div
              key={i}
              className={cn(
                "relative flex flex-col rounded-lg border bg-surface pt-[34px] pb-[34px] px-[26px] transition-[transform,box-shadow] duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_24px_50px_-30px_rgba(0,0,0,0.42)]",
                t.isPopular
                  ? "border-accent shadow-[0_24px_54px_-28px_color-mix(in_srgb,var(--color-accent)_55%,transparent)]"
                  : "border-line",
              )}
            >
              {t.isPopular ? (
                <span className="absolute -top-[13px] left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-white">
                  Most Popular
                </span>
              ) : null}
              {t.cornerBadge ? (
                <span className="absolute -top-4 -right-4 flex h-[54px] w-[54px] items-center justify-center rounded-full border-[3px] border-bg bg-accent font-serif text-sm font-semibold text-white shadow-[0_10px_24px_-10px_color-mix(in_srgb,var(--color-accent)_75%,transparent)]">
                  {t.cornerBadge}
                </span>
              ) : null}
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-deep">
                {t.name}
              </div>
              {t.tag ? (
                <div className="mt-[10px] mb-[22px] font-serif text-[25px] leading-[1.2] text-ink">
                  {t.tag}
                </div>
              ) : null}
              <ul className="mb-7 flex-1 list-none">
                {t.features.map((f, j) => (
                  <li
                    key={j}
                    className="relative border-t border-line py-[9px] pl-7 text-[14.5px] text-ink-soft first:border-t-0 before:absolute before:left-0 before:top-[14px] before:h-2 before:w-3.5 before:border-l-2 before:border-b-2 before:border-accent before:content-[''] before:[transform:rotate(-45deg)]"
                  >
                    {f}
                  </li>
                ))}
              </ul>
              <ButtonLink
                href={t.cta.href}
                variant={t.isPopular ? "primary" : "ghost"}
                className="w-full"
              >
                {t.cta.label}
              </ButtonLink>
            </div>
          ))}
        </div>

        {footer ? <div className="mt-20">{footer}</div> : null}
      </Container>
    </Section>
  );
}
