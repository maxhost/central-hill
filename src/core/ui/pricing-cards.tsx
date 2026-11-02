"use client";

import { useId, useState, type ReactNode } from "react";
import { ButtonLink, buttonClassName } from "./button";
import { cn } from "./cn";
import { Container } from "./container";
import { Section } from "./section";

/**
 * Pricing/plan cards grid: a centred heading above up to 4 bordered cards (name, optional
 * tag line, a "most popular" ribbon, an optional corner badge, a feature list with a
 * CSS-drawn checkmark, and a CTA). First built for Owners' "A management plan built around
 * your goals" (`#plans`), ported 1:1 from its old `.mk`-scoped CSS (`.plans`/`.plan` in
 * `owners-page.tsx`'s `OWNERS_STYLE`, now deleted). Optional selectors hold local UI state,
 * per the `core/ui` ground rule: no `@core/media`, no slice icon registry, no i18n.
 *
 * `footer` slots arbitrary content at the exact `mt-20`
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
  /** Decorative connector before this tier in the desktop column layout. */
  separatorBefore?: ReactNode;
  /** Single-choice base plan, or an independently toggleable extra. Omit for link CTAs. */
  selectionMode?: "single" | "multiple";
  /** Percentage points added when selected; omitted/invalid values never become a zero fee. */
  feePercent?: number | null;
  features: string[];
  cta: { href: string; label: string };
};

export function PricingCards({
  headline,
  body,
  tiers,
  footer,
  summary,
  renderSummaryAction,
  popularLabel = "Most Popular",
}: {
  headline: string;
  body?: string;
  tiers: PricingTier[];
  /** Extra content below the grid, at the original `.plan-helpers` spacing (e.g. `CalloutBand`). */
  footer?: ReactNode;
  /** Client-owned action that can consume the current selection (e.g. open a dialog). */
  renderSummaryAction?: (selected: PricingTier[]) => ReactNode;
  /** Live fee summary replacing the static footer when supplied. All copy comes from the caller. */
  summary?: {
    title: string;
    description: string;
    emptyLabel: string;
    unavailableLabel: string;
    locale: string;
    cta: { href: string; label: string };
  };
  /** Text of the popular tier's ribbon (the caller passes its localized copy). */
  popularLabel?: string;
}) {
  const selectionId = useId();
  const [baseTier, setBaseTier] = useState<number | null>(null);
  const [extraTiers, setExtraTiers] = useState<number[]>([]);
  const selectedTiers = tiers.filter((tier, index) =>
    tier.selectionMode === "single"
      ? baseTier === index
      : tier.selectionMode === "multiple" && extraTiers.includes(index),
  );
  const total = selectedTiers.some(
    (tier) => tier.feePercent == null || !Number.isFinite(tier.feePercent),
  )
    ? null
    : selectedTiers.reduce(
        (sum, tier) => sum + Math.round((tier.feePercent ?? 0) * 100),
        0,
      ) / 100;

  function selectTier(index: number, mode: PricingTier["selectionMode"]) {
    if (mode === "single") {
      setBaseTier(index);
    } else if (mode === "multiple") {
      setExtraTiers((current) =>
        current.includes(index)
          ? current.filter((selected) => selected !== index)
          : [...current, index],
      );
    }
  }

  return (
    <Section>
      <Container>
        <div className="mx-auto mb-[54px] max-w-[45rem] text-center">
          <h2 className="font-serif text-[clamp(1.875rem,4vw,3.125rem)] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
            {headline}
          </h2>
          {body ? (
            <p className="mx-auto mt-4 max-w-[62ch] text-lg text-ink-soft">
              {body}
            </p>
          ) : null}
        </div>

        <div
          className={cn(
            "grid grid-cols-1 items-start gap-5 min-[681px]:grid-cols-2 min-[981px]:grid-cols-4",
            tiers.some((tier) => tier.separatorBefore) &&
              "min-[981px]:gap-x-10",
          )}
        >
          {tiers.map((t, i) => {
            const selected =
              t.selectionMode === "single"
                ? baseTier === i
                : t.selectionMode === "multiple" && extraTiers.includes(i);
            return (
              <div
                key={i}
                className={cn(
                  "relative flex flex-col rounded-lg border bg-surface pt-[34px] pb-[34px] px-[26px] transition-[transform,box-shadow] duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_24px_50px_-30px_rgba(0,0,0,0.42)]",
                  t.isPopular || selected
                    ? "border-accent shadow-[0_24px_54px_-28px_color-mix(in_srgb,var(--color-accent)_55%,transparent)]"
                    : "border-line",
                  selected && "ring-1 ring-accent",
                )}
              >
                {t.separatorBefore ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-8 top-1/2 hidden -translate-y-1/2 text-accent-deep min-[981px]:flex"
                  >
                    {t.separatorBefore}
                  </span>
                ) : null}
                {t.isPopular ? (
                  <span className="absolute -top-[13px] left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-white">
                    {popularLabel}
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
                {t.selectionMode ? (
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectTier(i, t.selectionMode)}
                    className={buttonClassName(
                      selected || t.isPopular ? "primary" : "ghost",
                      "w-full",
                    )}
                  >
                    {t.cta.label}
                  </button>
                ) : (
                  <ButtonLink
                    href={t.cta.href}
                    variant={t.isPopular ? "primary" : "ghost"}
                    className="w-full"
                  >
                    {t.cta.label}
                  </ButtonLink>
                )}
                {t.selectionMode ? (
                  <label
                    htmlFor={`${selectionId}-${i}`}
                    className="mx-auto mt-4 inline-flex size-11 cursor-pointer items-center justify-center"
                  >
                    <input
                      id={`${selectionId}-${i}`}
                      type={t.selectionMode === "single" ? "radio" : "checkbox"}
                      name={
                        t.selectionMode === "single"
                          ? `${selectionId}-base`
                          : `${selectionId}-${i}`
                      }
                      value={t.name}
                      aria-label={t.tag ? `${t.name}: ${t.tag}` : t.name}
                      checked={selected}
                      onChange={() => selectTier(i, t.selectionMode)}
                      className="size-7 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-accent-deep bg-surface bg-clip-content p-1 checked:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent forced-colors:appearance-auto"
                    />
                  </label>
                ) : null}
              </div>
            );
          })}
        </div>

        {summary ? (
          <div className="mt-8 grid grid-cols-2 items-center gap-x-4 gap-y-5 rounded-[10px] border border-[color-mix(in_srgb,var(--color-accent)_35%,var(--color-line))] bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-surface))] p-6 shadow-[0_26px_56px_-34px_color-mix(in_srgb,var(--color-accent)_50%,transparent)] min-[681px]:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.8fr)] min-[981px]:ml-auto min-[981px]:w-[calc((100%_-_2.5rem)/2)]">
            <div>
              <div className="mb-1 font-serif text-[22px] font-medium text-ink">
                {summary.title}
              </div>
              <div className="text-[13px] text-ink-soft">
                {summary.description}
              </div>
            </div>
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="min-w-0 text-center font-serif font-medium leading-tight text-ink"
            >
              {selectedTiers.length === 0 ? (
                <span className="block text-xl">{summary.emptyLabel}</span>
              ) : total === null ? (
                <span className="block text-lg">
                  {summary.unavailableLabel}
                </span>
              ) : (
                <span className="block text-[40px] tabular-nums tracking-[-0.03em]">
                  {new Intl.NumberFormat(summary.locale, {
                    style: "percent",
                    maximumFractionDigits: 2,
                  }).format(total / 100)}
                </span>
              )}
            </div>
            {renderSummaryAction ? (
              renderSummaryAction(selectedTiers)
            ) : (
              <ButtonLink
                href={summary.cta.href}
                size="sm"
                className="col-span-2 w-full min-w-0 min-[681px]:col-span-1"
              >
                {summary.cta.label}
              </ButtonLink>
            )}
          </div>
        ) : footer ? (
          <div className="mt-20">{footer}</div>
        ) : null}
      </Container>
    </Section>
  );
}
