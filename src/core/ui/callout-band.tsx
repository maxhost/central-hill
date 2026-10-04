import { ButtonLink } from "./button";
import { cn } from "./cn";

/**
 * A highlighted, accent-tinted horizontal callout: title + copy on one side, a single CTA
 * on the other. First built for Owners' "Not sure which plan fits? Let's talk." band under
 * the pricing grid (`.plan-helper` in `owners-page.tsx`'s old `OWNERS_STYLE`, now deleted)
 * — ported 1:1, not a new design.
 *
 * Deliberately bare: no `Section`/`Container` of its own, unlike `Hero`/`PricingCards`/
 * `EditorialSplit`/`TwoColumnShowcase`. The original markup nested it *inside* the pricing
 * grid's own section/container at a tight `mt-20`, not as its own full section with the
 * kernel's usual ~100px+ vertical rhythm — baking in a `Section` here would make that
 * placement impossible to reproduce. A caller that *does* want it as a standalone section
 * wraps it in `core/ui`'s own `Container` (and `Section`, if a full section is wanted).
 */
export function CalloutBand({
  title,
  body,
  cta,
  className,
}: {
  title: string;
  body: string;
  cta: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-[22px] rounded-[10px] border border-[color-mix(in_srgb,var(--color-accent)_35%,var(--color-line))] bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-surface))] px-[30px] py-8 shadow-[0_26px_56px_-34px_color-mix(in_srgb,var(--color-accent)_50%,transparent)] min-[981px]:flex-row min-[981px]:items-center min-[981px]:justify-between min-[981px]:gap-10 min-[981px]:px-12 min-[981px]:py-[38px]",
        className,
      )}
    >
      <div className="max-w-[62ch]">
        <h4 className="mb-[9px] font-serif text-[25px] font-medium text-ink">{title}</h4>
        <p className="text-[15px] text-ink-soft">{body}</p>
      </div>
      <ButtonLink href={cta.href} className="flex-none">
        {cta.label}
      </ButtonLink>
    </div>
  );
}
