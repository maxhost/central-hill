import { AsideCta } from "@core/ui";
import type { BlogAsideCta } from "@slices/pages/contract";

/** Public article composition; editor context and annotations exist only in private preview. */
export function BlogSharedAside({
  asideCta,
  cta = asideCta.cta,
  divided = false,
  preview = false,
}: {
  asideCta: BlogAsideCta;
  cta?: BlogAsideCta["cta"];
  divided?: boolean;
  preview?: boolean;
}) {
  const aside = <AsideCta eyebrow={asideCta.eyebrow} title={asideCta.title} body={asideCta.body} cta={cta} divided={divided} />;
  return preview ? (
    <div data-editor-binding="post_aside">{aside}</div>
  ) : aside;
}
