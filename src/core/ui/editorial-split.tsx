import type { ReactNode } from "react";
import { ButtonLink } from "./button";
import { cn } from "./cn";
import { Container } from "./container";
import { Eyebrow } from "./eyebrow";
import { Reveal } from "./motion/reveal";
import { Section } from "./section";

/**
 * "Editorial Split" two-column section: a sticky headline + CTAs column beside a
 * hairline-divided list of icon/title/description rows. First built for Owners' "Why
 * property owners trust us" (`#why`), ported 1:1 from its old `.mk`-scoped CSS
 * (`.owner-pitch` in `owners-page.tsx`'s `OWNERS_STYLE`) — not a new design, same
 * sticky-text/benefit-list pattern ADR 0022 called "Editorial Split" when Home briefly
 * had its own version (since removed, ADR 0031). Purely presentational, per the `core/ui`
 * ground rule: no `@core/media`, no slice icon registry, no i18n — each item's `icon` is a
 * caller-built `ReactNode` (same convention as `TwoColumnShowcase`'s bullets).
 *
 * Unlike this file's siblings (`Hero`, `StatBand`, `TwoColumnShowcase`), the entrance
 * animation is wired up *inside* this component rather than left to the call site: the
 * left column is `position:sticky`, and a `Reveal`'d ancestor would permanently break that
 * (any non-`none` `transform` on an ancestor — including `Reveal`'s settled
 * `translate-y-0` — takes a `position:sticky` descendant out of the page's scrolling
 * frame in every browser, not just during the one-time entrance transition). Nesting the
 * `Reveal` *inside* the sticky wrapper instead of outside it sidesteps that: the sticky
 * element itself never carries a transform, only its content does. Exposing that ordering
 * constraint to every call site would be fragile, so it lives here once.
 */

export type EditorialSplitItem = {
  /** Caller-built icon element (e.g. the slice's own `<Icon name=.../>`), rendered as-is. */
  icon?: ReactNode;
  title: string;
  description: string;
};

export type EditorialSplitCta = {
  href: string;
  label: string;
};

export function EditorialSplit({
  eyebrow,
  headline,
  body,
  items,
  primaryCta,
  secondaryCta,
  note,
  id,
}: {
  eyebrow?: string;
  headline: string;
  body?: string;
  items: EditorialSplitItem[];
  primaryCta?: EditorialSplitCta;
  secondaryCta?: EditorialSplitCta;
  /** Helper copy under the CTAs (e.g. "No long-term contracts"). */
  note?: string;
  /** Optional scroll anchor, rendered the same way `TwoColumnShowcase`/`Band`'s `id` prop does. */
  id?: string;
}) {
  return (
    <Section>
      <Container>
        {id ? <span id={id} className="block scroll-mt-24" aria-hidden /> : null}
        <div className="grid items-start gap-16 min-[981px]:grid-cols-[0.9fr_1.1fr]">
          <div className="min-[981px]:sticky min-[981px]:top-[120px]">
            <Reveal>
              {eyebrow ? <Eyebrow accent>{eyebrow}</Eyebrow> : null}
              <h2
                className={cn(
                  "font-serif text-[clamp(1.875rem,4vw,3.125rem)] font-medium leading-[1.08] tracking-[-0.015em] text-ink",
                  eyebrow ? "mt-3" : "mt-[14px]",
                )}
              >
                {headline}
              </h2>
              {body ? <p className="mt-[18px] text-lg leading-[1.6] text-ink-soft">{body}</p> : null}
              {primaryCta || secondaryCta ? (
                <div className="mt-7 flex flex-wrap gap-3.5">
                  {primaryCta ? <ButtonLink href={primaryCta.href}>{primaryCta.label}</ButtonLink> : null}
                  {secondaryCta ? (
                    <ButtonLink href={secondaryCta.href} variant="ghost">
                      {secondaryCta.label}
                    </ButtonLink>
                  ) : null}
                </div>
              ) : null}
              {note ? <p className="mt-3.5 text-sm text-ink-soft">{note}</p> : null}
            </Reveal>
          </div>

          <Reveal>
            <ul className="list-none border-t border-line">
              {items.map((item, i) => (
                <li key={i} className="flex gap-5 border-b border-line py-6">
                  {item.icon}
                  <div>
                    <h3 className="mb-1.5 text-[19px] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
                      {item.title}
                    </h3>
                    <p className="text-[15px] leading-[1.6] text-ink-soft">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
