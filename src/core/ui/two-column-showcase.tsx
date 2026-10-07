import type { ReactNode } from "react";
import { ButtonLink } from "./button";
import { cn } from "./cn";
import { SectionHead } from "./section-head";
import { UiIcon } from "./ui-icon";

/**
 * Generic "Image Showcase" two-column section (ADR 0033): copy + compact bullet highlights +
 * a single CTA on one side, a lifestyle image with an optional floating reassurance badge on
 * the other. Generalized out of Home's "guests pitch"
 * (`src/slices/pages/ui/components/guests-section.tsx`, now a thin composer over this
 * primitive) so any slice can reuse the same pattern — see `docs/specs/home-component-library/
 * 05-two-column-showcase.md`.
 *
 * Purely presentational, per the `core/ui` ground rule: no `@core/media`, no slice icon
 * registry, no i18n. `image` and each bullet's `icon` are caller-built `ReactNode`s (exactly
 * like `PropertyCard`/`Carousel` take their slides) — the caller resolves media + icon lookups
 * and passes the finished elements in. Second real consumer: Owners' `services`/`dashboard`
 * showcases (`owners-page.tsx`) — `imagePosition="left"` mirrors the layout for `dashboard`,
 * no new component needed. Their floating-badge text differs from the under-CTA caption
 * (unlike Home's guests pitch, where one `cta.note` always served both), hence `badge`.
 *
 * The eyebrow, title and body are `SectionHead` (left, `flush`), and the shell is the standard
 * page one (`clamp(72px,10vw,150px)` padding, 1240px/28px column), so the showcase's head and
 * edges match every other section head on Home, Owners and Real Estate.
 */

export type TwoColumnShowcaseBullet = {
  /** Caller-built icon element (e.g. the slice's own `<Icon name=.../>`), rendered as-is. */
  icon?: ReactNode;
  title: string;
  description: string;
};

export type TwoColumnShowcaseCta = {
  href: string;
  label: string;
  /** Helper copy under the CTA button; also the image's floating badge text, unless the
   * caller passes its own `badge` (Owners' services/dashboard showcases: the two differ). */
  note?: string;
};

// Mirrors `src/slices/pages/ui/components/blocks.tsx`'s `altBg` token formula exactly (same
// warm off-paper tint, same value) — duplicated as a literal rather than imported, because
// `core/ui` must have zero imports from any slice (00-overview.md §3).
const ALT_BG = "bg-[color-mix(in_srgb,var(--color-line)_38%,var(--color-bg))]";

// `compact` override: 10%-tighter vertical rhythm than the original kernel `Section`'s
// `clamp(64px,10vw,160px)` — a deliberate, documented client-requested deviation for Home's
// guests pitch, not a new default. Applied as an inline style (never a second Tailwind padding
// class) so the -10% stays deterministic regardless of utility-class cascade/build order —
// exactly the guarantee the original `guests-section.tsx` comment called out.
const COMPACT_PADDING = "clamp(57.6px, 9vw, 144px)";

export function TwoColumnShowcase({
  eyebrow,
  headline,
  body,
  bullets,
  cta,
  badge,
  badgeIcon,
  image,
  imagePosition = "right",
  tone = "default",
  compact = false,
  id,
}: {
  eyebrow?: string;
  headline: string;
  /** Generalized name for the old `subheadline`. */
  body?: string;
  /** Generalized name for the old `benefits`; caller caps the count it passes. */
  bullets?: TwoColumnShowcaseBullet[];
  cta?: TwoColumnShowcaseCta;
  /** Image's floating badge text, when it must differ from `cta.note` (defaults to it). */
  badge?: string;
  /** Badge glyph (e.g. a server-rendered `<Icon>` from an `icon_key`); defaults to Iconoir `check`. */
  badgeIcon?: ReactNode;
  /** Caller's own `<MediaImage>`/`<img>` (with its own fallback logic already applied). */
  image: ReactNode;
  /** Desktop column order only — mobile always stacks the image first (CSS-only, unchanged). */
  imagePosition?: "left" | "right";
  /** `"alt"` = the warm `altBg` band used by Home's guests pitch. */
  tone?: "default" | "alt";
  /** See `COMPACT_PADDING` above — today's -10% Home override, opt-in for other callers. */
  compact?: boolean;
  /** Optional scroll anchor, rendered the same way `Band`'s `id` prop does. */
  id?: string;
}) {
  const toneClass = tone === "alt" ? ALT_BG : undefined;
  const imageOnLeft = imagePosition === "left";
  const badgeText = badge ?? cta?.note;

  const content = (
    <div className="mx-auto max-w-[1240px] px-[28px]">
      {id ? <span id={id} className="block scroll-mt-24" aria-hidden /> : null}
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHead flush eyebrow={eyebrow || undefined} headline={headline} intro={body || undefined} />
          {bullets && bullets.length > 0 ? (
            <ul className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {bullets.map((b, i) => (
                <li key={i} className="flex gap-3">
                  {b.icon}
                  <div>
                    <h3 className="font-medium text-ink">{b.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{b.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {cta ? (
            <div className="mt-9">
              <ButtonLink href={cta.href}>{cta.label}</ButtonLink>
              {cta.note ? <p className="mt-3 text-sm text-ink-soft">{cta.note}</p> : null}
            </div>
          ) : null}
        </div>

        <div className={cn("relative order-first", !imageOnLeft && "lg:order-last")}>
          {image}
          {badgeText ? (
            <div className="absolute -bottom-5 -left-4 hidden max-w-[15rem] items-start gap-2.5 rounded-sm border border-line bg-surface px-5 py-4 shadow-xl sm:flex">
              <span className="mt-0.5 shrink-0 text-accent-deep [&_svg]:h-5 [&_svg]:w-5">
                {badgeIcon ?? <UiIcon name="check" size={20} />}
              </span>
              <span className="text-sm leading-snug text-ink">{badgeText}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (compact) {
    return (
      <section className={toneClass} style={{ paddingBlock: COMPACT_PADDING }}>
        {content}
      </section>
    );
  }

  return <section className={cn("py-[clamp(72px,10vw,150px)]", toneClass)}>{content}</section>;
}
