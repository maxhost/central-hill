import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { Locale } from "@core/db/columns";
import { ButtonLink, Container, Eyebrow } from "@core/ui";
import { getGlobals } from "@slices/settings/contract";

/**
 * Lead capture block (Owners earnings estimate · Real-Estate deal enquiry · About
 * contact). The page schema stores only the section copy (headline/subheadline/cta_label/
 * note); the interactive form is the **leads slice (S10)** widget, embedded by the page
 * through `form` (e.g. `<EarningsEstimateForm source="owners" />`). When no `form` is
 * provided it falls back to a direct contact CTA so the block is never empty.
 */
export async function LeadCta({
  locale,
  eyebrow,
  headline,
  subheadline,
  ctaLabel,
  note,
  id,
  form,
}: {
  locale: Locale;
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  ctaLabel?: string;
  note?: string;
  id?: string;
  form?: ReactNode;
}) {
  const globals = await getGlobals(locale);
  const t = await getTranslations("pages");
  const href = globals?.email ? `mailto:${globals.email}` : `/${locale}/about`;

  return (
    <section className="py-[clamp(64px,10vw,160px)]">
      <Container>
        <div className="mx-auto max-w-3xl rounded-3xl border border-line bg-surface p-8 text-center md:p-14">
          {id ? <span id={id} className="block scroll-mt-24" aria-hidden /> : null}
          {eyebrow ? <Eyebrow accent>{eyebrow}</Eyebrow> : null}
          <h2 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">{headline}</h2>
          {subheadline ? (
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
              {subheadline}
            </p>
          ) : null}
          {form ? (
            <div className="mx-auto mt-8 max-w-xl text-left">
              {form}
              {note ? (
                <p className="mt-4 text-center text-sm text-ink-soft">{note}</p>
              ) : null}
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-3">
              {ctaLabel ? <ButtonLink href={href}>{ctaLabel}</ButtonLink> : null}
              {note ? <span className="text-sm text-ink-soft">{note}</span> : null}
            </div>
          )}
          {globals ? (
            <p className="mt-6 text-sm text-ink-soft">
              {[globals.phone, globals.email, globals.whatsapp].filter(Boolean).join(" · ")}
            </p>
          ) : (
            <p className="mt-6 text-xs uppercase tracking-[0.14em] text-ink-soft">{t("leadNote")}</p>
          )}
        </div>
      </Container>
    </section>
  );
}
