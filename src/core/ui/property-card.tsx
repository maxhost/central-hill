import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Generic property card (ADR 0033): a single `<Link>`-wrapped card with a cover image, an
 * optional featured badge, a name, a meta line and a "view" label. Pulled out of Home's
 * featured-portfolio inline `PortfolioCard` (`docs/specs/home-component-library/
 * 06-property-card.md`) so any slice can reuse the same card shape — fed as `slides` into
 * `Carousel`, same pattern as `TwoColumnShowcase`'s `image` prop.
 *
 * Purely presentational, per the `core/ui` ground rule: no `@core/media`, no `BuildingSummary`,
 * no i18n. `image` is the caller's already-resolved `<MediaImage>` element; `meta` and `badge`
 * are pre-joined/pre-translated strings the composer builds (e.g.
 * `src/slices/pages/ui/components/featured-portfolio.tsx`).
 */
export function PropertyCard({
  href,
  image,
  name,
  meta,
  badge,
  viewLabel,
}: {
  href: string;
  /** Caller's own `<MediaImage>`/`<img>`, same pattern as `TwoColumnShowcase`'s `image` prop. */
  image: ReactNode;
  name: string;
  /** Pre-joined "X apartments · Y guests" — i18n stays in the composer. */
  meta: string;
  /** Pre-translated "★ Featured" label — omitted entirely when absent. */
  badge?: string;
  /** Pre-translated "View" label. */
  viewLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden border border-line bg-surface transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_-26px_rgba(0,0,0,0.42)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {image}
        {badge ? (
          <span className="absolute left-3.5 top-3.5 bg-accent px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-surface">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="p-6">
        <h3 className="font-serif text-2xl text-ink">{name}</h3>
        <p className="mt-1.5 text-xs uppercase tracking-[0.05em] text-ink-soft">{meta}</p>
        <span className="mt-4 inline-block text-sm font-semibold text-accent-deep">
          {viewLabel}
        </span>
      </div>
    </Link>
  );
}
