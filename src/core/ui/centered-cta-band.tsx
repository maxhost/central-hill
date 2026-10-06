import type { ReactNode } from "react";
import { ButtonLink } from "./button";

/**
 * Closing call-to-action band, centred and photo-less: an eyebrow, a serif `<h2>`, a lede, one
 * button (or a custom action slot, see below) and an optional contact line, stacked in a 760px
 * centred column on the full-bleed dark "feature" band (`bg-feature`/`text-on-feature*`). First built for Guides' "Make It a Stay to
 * Remember" (`guides-listing.tsx`'s old `.mk` `section.stats` closing band, identical to the
 * original `mock/owners.html` final CTA): `padding:var(--section-y) 0`, a `.wrap` capped at
 * `760px` and centred, the `feature-accent` eyebrow, a white `h2.section-title`, an `18px`
 * `on-feature-soft` lede (`max-width:60ch`, `18px` offset) and the button `34px` below it.
 *
 * **Copy column = `FeatureCtaBand`'s** (consistency over mock fidelity): the eyebrow, title,
 * lede, `ButtonLink` primary and contact line use exactly that component's classes, so both
 * closing CTAs read the same. Only the layout differs: one centred column, no photo.
 *
 * **Reuse check**: not `FeatureCtaBand` (its image isn't optional and it's a two-column
 * split), not `ActionBand` (copy and action side by side, smaller `46px` title, no centring),
 * not `FeaturePanel` (a bordered panel with a `30px` `<h3>`, no full-bleed band), not
 * `CalloutBand` (light and accent-tinted). Making any of them photo-less or centred would
 * change their existing consumers' render. The title is on a dark band, so it can't be
 * `SectionHead` (light palette only); see `docs/parqueado.md` (the parked `StatBand` title)
 * for the planned dark `SectionHead` variant, which this title should adopt too.
 *
 * **Action slot**: pass exactly one of `cta` (the `ButtonLink` primary, as Guides does) or
 * `children` (any action content rendered in the same slot, same `34px` offset — e.g. the blog
 * newsletter's signup form; the caller sizes/aligns it). The type enforces one or the other;
 * the `cta` render is unchanged.
 *
 * Includes its own section shell (standard `clamp(72px,10vw,150px)` padding, 84px scroll
 * margin), like `FeatureCtaBand`/`ActionBand`. Purely presentational: no i18n, no data, no
 * entrance animation (wrap it in `Reveal` where the page animates). Render it outside any
 * `.mk` subtree (see `SpecStrip`'s docstring).
 */
type CenteredCtaBandAction =
  | { cta: { href: string; label: string }; children?: never }
  /** Action content in place of the button (e.g. a form). */
  | { cta?: never; children: ReactNode };

export function CenteredCtaBand({
  id,
  eyebrow,
  headline,
  body,
  cta,
  children,
  contactLine,
}: {
  /** Optional scroll anchor on the `<section>`. */
  id?: string;
  eyebrow?: string;
  headline: string;
  body?: string;
  contactLine?: string;
} & CenteredCtaBandAction) {
  return (
    <section id={id} className="scroll-mt-[84px] bg-feature py-[clamp(72px,10vw,150px)]">
      <div className="mx-auto max-w-[760px] px-[28px] text-center">
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-feature-accent">{eyebrow}</span>
        ) : null}
        <h2 className="mt-[14px] font-serif text-[clamp(1.875rem,4vw,3.125rem)] font-medium leading-[1.08] tracking-[-0.015em] text-white">
          {headline}
        </h2>
        {body ? <p className="mx-auto mt-[18px] max-w-[60ch] text-lg text-on-feature-soft">{body}</p> : null}
        <div className="mt-[34px]">
          {cta ? (
            <ButtonLink href={cta.href} variant="primary">
              {cta.label}
            </ButtonLink>
          ) : (
            children
          )}
        </div>
        {contactLine ? (
          <p className="mt-[26px] text-sm tracking-[0.03em] text-on-feature-soft">{contactLine}</p>
        ) : null}
      </div>
    </section>
  );
}
