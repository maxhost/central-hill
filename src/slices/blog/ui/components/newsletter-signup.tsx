import { CenteredCtaBand } from "@core/ui";
import { NewsletterForm } from "@slices/leads/contract";

/**
 * Newsletter signup band (blog listing) — the mock's `section.newsletter`. A thin composer:
 * `core/ui`'s `CenteredCtaBand` (the full-bleed centred dark band Guides closes with;
 * `<h2>`, lede) with the leads slice's `NewsletterForm` in its action slot instead of a button.
 * The form (S10) owns the email field, GDPR consent, submit (`submitLead`, `kind: "newsletter"`)
 * and the success state; it sits on `bg-feature`, so `theme="dark"`.
 *
 * Consistency over mock fidelity: the band's title/lede use `CenteredCtaBand`'s classes (Guides'
 * closing band) rather than the mock's `44px`/`17px` newsletter values, and the form keeps the
 * leads layout (labelled email field, consent line, full-width submit — stacked) instead of the
 * mock's inline input + button. The form column is capped at `480px` and left-aligned so the
 * label/consent read naturally inside the centred band.
 */
export function NewsletterSignup({
  title,
  description,
  source = "blog",
  preview = false,
}: {
  title: string;
  description: string;
  source?: string;
  preview?: boolean;
}) {
  const band = (
    <CenteredCtaBand headline={title} body={description}>
      <div className="mx-auto max-w-[480px] text-left" inert={preview || undefined}>
        <NewsletterForm theme="dark" source={source} />
      </div>
    </CenteredCtaBand>
  );
  return preview ? <div data-editor-binding="newsletter">{band}</div> : band;
}
