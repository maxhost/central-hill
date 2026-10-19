import { AsideCta } from "@core/ui";
import type { BlogAsideCta } from "@slices/pages/contract";
export function BlogSharedAside({ asideCta, cta = asideCta.cta, divided = false }: { asideCta: BlogAsideCta; cta?: BlogAsideCta["cta"]; divided?: boolean }) {
 return <AsideCta eyebrow={asideCta.eyebrow} title={asideCta.title} body={asideCta.body} cta={cta} divided={divided} />;
}
