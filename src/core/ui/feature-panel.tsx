import { ButtonLink } from "./button";

/**
 * A single bordered panel on the dark "feature" band (`bg-feature`/`text-on-feature*`, the
 * same tokens `StatBand`/`DualCtaPanels`/`FeatureCtaBand`'s copy side use): eyebrow, heading,
 * body copy, one CTA, and an optional contact line. First built for Buildings' "For Owners"
 * band (`#owners` anchor target lives on the CTA's `href`, not this component), ported 1:1
 * from its old `.mk`-scoped `.dual`/`.dcol.owner`/`.contact-line` CSS (`buildings-listing.tsx`'s
 * `PAGE_STYLE`, now deleted) — no new design.
 *
 * Not `DualCtaPanels`: that component is always a *pair* of full-bleed **photo** panels with a
 * gradient scrim (`panel.image` isn't optional there) — this is a single **solid-color** panel,
 * no image at all, which is a different enough shape that stretching `DualCtaPanels` to cover
 * it (making `image` optional, un-fixing the tuple length) would blur what `DualCtaPanels`
 * guarantees for its existing consumers. Not `FeatureCtaBand` either — that one is always a
 * two-column image+copy split; this is copy only, one column, framed by a hairline border
 * (`.dual`'s `border:1px solid var(--line)` in the original CSS) instead of sitting in a
 * bigger photo band.
 *
 * Deliberately bare: no `Section`/`Container` of its own, same reasoning as `CalloutBand` —
 * the original's `padding-top:0` on its wrapping `<section>` is a page-composition choice
 * (it sits flush under Buildings' building grid, which already carries the vertical rhythm
 * below it), not an intrinsic part of this panel's own design, so baking a `Section` in here
 * would make that placement impossible to reproduce for this or any other caller.
 */
export function FeaturePanel({
  eyebrow,
  title,
  body,
  cta,
  contactLine,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  cta: { href: string; label: string };
  contactLine?: string;
}) {
  return (
    <div className="border border-line bg-feature px-12 py-[62px] text-on-feature">
      {eyebrow ? (
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-feature-accent">
          {eyebrow}
        </span>
      ) : null}
      <h3 className="mt-[10px] mb-[14px] font-serif text-[30px] font-medium leading-[1.08] tracking-[-0.015em] text-white">
        {title}
      </h3>
      {body ? <p className="mb-6 text-base leading-relaxed text-on-feature-soft">{body}</p> : null}
      <ButtonLink href={cta.href} variant="primary">
        {cta.label}
      </ButtonLink>
      {contactLine ? (
        <p className="mt-5 text-[13px] tracking-[0.03em] text-on-feature-soft">{contactLine}</p>
      ) : null}
    </div>
  );
}
