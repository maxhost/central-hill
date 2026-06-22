import { ButtonLink } from "@core/ui";
import { Band, type CtaNote, type IconCard } from "./blocks";
import { Icon } from "./icon";

/**
 * Home "owners pitch" — **Editorial Split** (the chosen design; ADR 0022): a sticky text + dual-CTA
 * column beside an editorial, hairline-divided benefit list. Purely presentational — `owners_pitch`
 * content is resolved upstream in `home-page.tsx`. Stays inside the S9 `pages` slice.
 */
type OwnersContent = {
  headline: string;
  subheadline?: string;
  benefits: IconCard[];
  cta_primary: CtaNote;
  cta_secondary: CtaNote;
};

export function OwnersSection({ content }: { content: OwnersContent }) {
  return (
    <Band id="owners">
      <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="lg:sticky lg:top-28">
          <h2 className="font-serif text-3xl leading-tight text-ink md:text-4xl">{content.headline}</h2>
          {content.subheadline ? (
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">{content.subheadline}</p>
          ) : null}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start">
            <ButtonLink href={content.cta_primary.url}>{content.cta_primary.label}</ButtonLink>
            <ButtonLink href={content.cta_secondary.url} variant="outline">
              {content.cta_secondary.label}
            </ButtonLink>
          </div>
          {content.cta_primary.note ? (
            <p className="mt-4 text-sm text-ink-soft">{content.cta_primary.note}</p>
          ) : null}
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {content.benefits.map((b, i) => (
            <li key={i} className="flex gap-5 py-6">
              <Icon name={b.icon_key} className="mt-0.5 h-7 w-7 shrink-0 text-accent-deep" />
              <div>
                <h3 className="font-serif text-lg text-ink">{b.title}</h3>
                <p className="mt-1.5 leading-relaxed text-ink-soft">{b.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Band>
  );
}
