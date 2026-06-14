import type { ReactNode } from "react";
import { ButtonLink, Container, Eyebrow, Section, cn } from "@core/ui";

/**
 * Presentational building blocks shared by the S9 page compositions. No data access —
 * each takes already-resolved [T] strings from a page's `content`. Visual language
 * follows design-system.md (serif display headings, accent eyebrows, generous rhythm).
 */

type Cta = { label: string; url: string };
type CtaNote = { label: string; url: string; note?: string };
type IconCard = { icon_key?: string; title: string; description: string };
type TitledItem = { title: string; description: string };

/** Eyebrow + serif title + optional lede, left- or centre-aligned. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  center,
  className,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(center ? "mx-auto max-w-2xl text-center" : "max-w-2xl", className)}>
      {eyebrow ? <Eyebrow accent>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">{title}</h2>
      {intro ? <p className="mt-4 text-lg leading-relaxed text-ink-soft">{intro}</p> : null}
    </div>
  );
}

/** A responsive grid of "title + description" cards (benefits, features, audiences…). */
export function FeatureGrid({
  items,
  columns = 3,
  className,
}: {
  items: (IconCard | TitledItem)[];
  columns?: 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-8 gap-y-10",
        columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {items.map((item, i) => (
        <div key={i} className="border-t border-line pt-5">
          <span className="block h-0.5 w-8 -translate-y-[21px] bg-accent" aria-hidden />
          <h3 className="font-serif text-xl text-ink">{item.title}</h3>
          <p className="mt-3 leading-relaxed text-ink-soft">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

/** A numbered vertical journey/process list. */
export function Steps({ steps }: { steps: TitledItem[] }) {
  return (
    <ol className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-4">
          <span className="font-serif text-2xl text-accent tabular-nums">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="font-medium text-ink">{s.title}</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">{s.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** One or two CTAs in a row, each with an optional helper note beneath. */
export function CtaRow({
  primary,
  secondary,
  center,
  className,
}: {
  primary: CtaNote;
  secondary?: CtaNote;
  center?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-x-8 gap-y-5 sm:flex-row sm:flex-wrap sm:items-center",
        center && "justify-center",
        className,
      )}
    >
      <CtaWithNote cta={primary} />
      {secondary ? <CtaWithNote cta={secondary} variant="outline" /> : null}
    </div>
  );
}

function CtaWithNote({ cta, variant }: { cta: CtaNote; variant?: "primary" | "outline" }) {
  return (
    <div className="flex flex-col gap-1">
      <ButtonLink href={cta.url} variant={variant}>
        {cta.label}
      </ButtonLink>
      {cta.note ? <span className="text-sm text-ink-soft">{cta.note}</span> : null}
    </div>
  );
}

/** Plain-paragraph prose: split on blank lines (page copy is plain [T] text). */
export function Prose({ text, className }: { text: string; className?: string }) {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className={cn("space-y-4", className)}>
      {paras.map((p, i) => (
        <p key={i} className="leading-relaxed text-ink-soft">
          {p}
        </p>
      ))}
    </div>
  );
}

/** A full-bleed editorial section wrapper with a `Container` inside. */
export function Band({
  children,
  className,
  containerClassName,
  id,
  as,
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
  as?: "section" | "div" | "header" | "footer";
}) {
  return (
    <Section as={as} className={className}>
      <Container className={containerClassName}>
        {id ? <span id={id} className="block scroll-mt-24" aria-hidden /> : null}
        {children}
      </Container>
    </Section>
  );
}

export type { Cta, CtaNote, IconCard, TitledItem };
