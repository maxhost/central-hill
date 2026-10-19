import { AsideCta } from "@core/ui";
import { MediaImage } from "@core/media";
import { GUIDE_ASIDE_FALLBACK_IMAGE, type GuideAsideCta } from "@slices/pages/contract";
export function GuideSharedAside({ asideCta, divided = false }: { asideCta: GuideAsideCta; divided?: boolean }) {
  return (            <AsideCta
              className={divided ? undefined : "mt-0! border-t-0! pt-0!"}
              image={
                asideCta.image ? (
                  <MediaImage data={asideCta.image} sizes={"(max-width: 980px) calc(100vw - 118px), 318px"} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- static fallback photo until one is picked in the backoffice
                  <img
                    src={GUIDE_ASIDE_FALLBACK_IMAGE.url}
                    alt={GUIDE_ASIDE_FALLBACK_IMAGE.alt}
                    loading="lazy"
                    decoding="async"
                  />
                )
              }
              eyebrow={asideCta.eyebrow}
              title={asideCta.title}
              body={asideCta.body}
              cta={asideCta.cta}
            />);
}
