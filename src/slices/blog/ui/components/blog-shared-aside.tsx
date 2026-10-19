import { AsideCta } from "@core/ui";
import type { BlogAsideCta } from "@slices/pages/contract";

/** Public article composition; editor context and annotations exist only in private preview. */
export function BlogSharedAside({
  asideCta,
  cta = asideCta.cta,
  divided = false,
  preview = false,
  previewLabel,
}: {
  asideCta: BlogAsideCta;
  cta?: BlogAsideCta["cta"];
  divided?: boolean;
  preview?: boolean;
  previewLabel?: string;
}) {
  const aside = <AsideCta eyebrow={asideCta.eyebrow} title={asideCta.title} body={asideCta.body} cta={cta} divided={divided} />;
  return preview ? (
    <section className="mx-auto max-w-[420px] px-7 py-12" aria-label={previewLabel}>
      <p className="mb-6 text-sm text-ink-soft">{previewLabel}</p>
      <div data-editor-binding="post_aside">{aside}</div>
    </section>
  ) : aside;
}
