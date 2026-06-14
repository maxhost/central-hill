import { Eyebrow } from "@core/ui";
import { NewsletterForm } from "@slices/leads/contract";

/**
 * Newsletter signup band (blog). Visual shell only — the dark feature band — wrapping
 * the leads-slice `NewsletterForm` (S10), which owns the email field, GDPR consent,
 * submit, and success state. Rendered on a dark band, so the form uses `theme="dark"`.
 */
export function NewsletterSignup({
  eyebrow,
  title,
  description,
  source = "blog",
}: {
  eyebrow: string;
  title: string;
  description: string;
  source?: string;
}) {
  return (
    <div className="rounded-2xl bg-feature px-8 py-12 text-bg md:px-14">
      <div className="mx-auto max-w-xl text-center">
        <Eyebrow className="text-bg/70">{eyebrow}</Eyebrow>
        <h2 className="mt-3 font-serif text-3xl leading-tight">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-bg/80">{description}</p>
        <div className="mt-8 text-left">
          <NewsletterForm theme="dark" source={source} />
        </div>
      </div>
    </div>
  );
}
