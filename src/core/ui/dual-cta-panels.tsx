import type { ReactNode } from "react";
import { ButtonLink } from "./button";

export type DualCtaPanel = {
  /** Caller's `<MediaImage>`/`<img>` — fallback image already resolved by the composer. */
  image: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  cta: { href: string; label: string; variant?: "primary" | "light" };
  /** Pre-joined "phone · email · WhatsApp …" (or omitted). */
  contactLine?: string;
};

/**
 * Owner/Guest dual call-to-action band — "Immersive Panels" layout (owner-chosen). Two
 * full-bleed image panels with a dark scrim and white copy overlaid; the image zooms gently
 * on hover (CSS only, so this stays safe as a server component). Edge-to-edge (no
 * `Container`, client feedback) — one full-width row, split 50/50 in two columns from `md`,
 * stacked into two rows below it. No entrance/reveal animation (two-panel/single-block rule
 * — only the hover zoom).
 *
 * Pure presentational: every string/image/link arrives already resolved by the caller (e.g.
 * `slices/pages/ui/components/dual-cta.tsx`, which fetches CMS content + i18n fallbacks +
 * the settings-singleton contact line and builds the two `DualCtaPanel` props). No `Locale`,
 * no data fetching, no i18n here. The first panel renders with the feature-accent eyebrow
 * (e.g. the owner side); the second renders with the white/80 eyebrow (e.g. the guest side).
 */
export function DualCtaPanels({ panels }: { panels: [DualCtaPanel, DualCtaPanel] }) {
  return (
    <section className="pb-[clamp(64px,10vw,160px)]">
      <div className="grid grid-cols-1 gap-px overflow-hidden border-y border-line bg-line md:grid-cols-2">
        {panels.map((panel, index) => (
          <div
            key={index}
            className="group relative flex min-h-[clamp(440px,54vh,580px)] overflow-hidden"
          >
            {panel.image}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15" />
            <div className="relative mt-auto p-8 text-white md:p-12">
              <span
                className={
                  index === 0
                    ? "text-xs font-medium uppercase tracking-[0.16em] text-feature-accent"
                    : "text-xs font-medium uppercase tracking-[0.16em] text-white/80"
                }
              >
                {panel.eyebrow}
              </span>
              <h3 className="mt-3 font-serif text-2xl leading-snug">{panel.title}</h3>
              <p className="mt-3 max-w-md leading-relaxed text-white/85">{panel.body}</p>
              <div className="mt-6">
                <ButtonLink href={panel.cta.href} variant={panel.cta.variant}>
                  {panel.cta.label}
                </ButtonLink>
              </div>
              {panel.contactLine ? (
                <p className="mt-5 text-sm text-white/75">{panel.contactLine}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
