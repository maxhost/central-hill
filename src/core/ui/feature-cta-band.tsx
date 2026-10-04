import type { ReactNode } from "react";
import { ButtonLink } from "./button";
import { Container } from "./container";
import { Section } from "./section";

/**
 * Closing call-to-action band: a photo on one side, an eyebrow/headline/body/CTA/contact-line
 * on the other, on the dark "feature" band (`bg-feature`/`text-on-feature*`, the same tokens
 * `StatBand`/`DualCtaPanels`/`Hero`'s dark surfaces use). First built for Owners' "Start Earning
 * More Today" closing section (`#start`), ported 1:1 from its old `.mk`-scoped CSS
 * (`.cta-band`/`.cta-wrap` in `owners-page.tsx`'s `OWNERS_STYLE`, now deleted) — no new design.
 *
 * Unlike `TwoColumnShowcase` (always light-themed, `tone` only tints the background), this
 * component is always dark — the two don't share an implementation because every text color in
 * `TwoColumnShowcase` would need its own dark-mode override, and this is this component's only
 * consumer so far. The eyebrow/headline/body colors are inlined rather than routed through the
 * shared `Eyebrow`/heading conventions for the same reason `DualCtaPanels`' owner-column eyebrow
 * is inlined: those primitives assume the light palette.
 *
 * Image is always first/left (the original never mirrors it) — no `imagePosition` prop, unlike
 * `TwoColumnShowcase`/`StepGallery`'s callers which do need both orientations. Purely
 * presentational, per the `core/ui` ground rule: no `@core/media`, no slice icon registry, no
 * i18n — every string, including `contactLine`, arrives already resolved (this section has no
 * schema field at all yet; Owners still hardcodes it, same as before this port).
 */
export function FeatureCtaBand({
  eyebrow,
  headline,
  body,
  cta,
  contactLine,
  image,
}: {
  eyebrow?: string;
  headline: string;
  body?: string;
  cta: { href: string; label: string };
  contactLine?: string;
  /** Caller's `<MediaImage>`/`<img>` (own fallback logic already applied), 4:5 portrait. */
  image: ReactNode;
}) {
  return (
    <Section className="bg-feature">
      <Container>
        <div className="grid grid-cols-1 items-center gap-[34px] min-[981px]:grid-cols-2 min-[981px]:gap-16">
          <div>{image}</div>
          <div className="text-center min-[981px]:text-left">
            {eyebrow ? (
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-feature-accent">
                {eyebrow}
              </span>
            ) : null}
            <h2 className="mt-[14px] font-serif text-[clamp(1.875rem,4vw,3.125rem)] font-medium leading-[1.08] tracking-[-0.015em] text-white">
              {headline}
            </h2>
            {body ? (
              <p className="mx-auto mt-[18px] max-w-[48ch] text-lg text-on-feature-soft min-[981px]:mx-0">
                {body}
              </p>
            ) : null}
            <div className="mt-[34px]">
              <ButtonLink href={cta.href} variant="primary">
                {cta.label}
              </ButtonLink>
            </div>
            {contactLine ? (
              <p className="mt-[26px] text-sm tracking-[0.03em] text-on-feature-soft">{contactLine}</p>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}
