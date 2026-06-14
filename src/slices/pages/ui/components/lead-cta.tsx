import { getTranslations } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { ButtonLink, Container, Eyebrow } from "@core/ui";
import { getGlobals } from "@slices/settings/contract";

/**
 * Lead capture block (Owners earnings estimate · Real-Estate deal enquiry · About
 * contact). The page schema stores only the section copy (headline/subheadline/cta_label/
 * note); the *form fields* are fixed in code and belong to the **leads slice (S10)**.
 *
 * INTEGRATION HANDOFF (S10): replace the contact-link button below with the leads slice's
 * interactive widget once it exports one on its contract, e.g.
 *   `<LeadForm kind="earnings_estimate" />` (kind ∈ earnings_estimate | deal_enquiry |
 *   contact). Until then this renders the section copy with a direct contact CTA so the
 *   page is complete and never ships a non-functional form.
 */
export async function LeadCta({
  locale,
  eyebrow,
  headline,
  subheadline,
  ctaLabel,
  note,
  id,
}: {
  locale: Locale;
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  ctaLabel: string;
  note?: string;
  id?: string;
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
          <div className="mt-8 flex flex-col items-center gap-3">
            <ButtonLink href={href}>{ctaLabel}</ButtonLink>
            {note ? <span className="text-sm text-ink-soft">{note}</span> : null}
          </div>
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
