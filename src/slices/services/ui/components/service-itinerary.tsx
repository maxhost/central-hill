import { MediaImage, type MediaImageData } from "@core/media";
import { cn } from "@core/ui";
import type { DetailItineraryStep } from "../../contract";

/**
 * "The day, step by step" — a tour's itinerary as hairline-separated rows: a 108px rounded
 * square (the step's thumbnail when its `media_id` resolved in `stepImages`, else its 1-based
 * number in serif 30px `accent-deep` on a warm tint) beside the uppercase time, a serif 21px
 * title and the step text. 76px squares and a 16px gap ≤560px. Ported 1:1 from
 * `mock/service-detail.html`'s `.steps`/`.step`/`.thumb`/`.time`. No `core/ui` primitive fits
 * (`NumberedFeatureGrid` numbers cards in a grid; `StepGallery` is overlaid photo cards), so it
 * stays slice-local. Bare and presentational; the caller owns the `ContentBlock` and its head.
 */
export function ServiceItinerary({
  steps,
  images,
  className,
}: {
  steps: DetailItineraryStep[];
  /** Resolved thumbnails keyed by `media_id` (`ServiceDetail.stepImages`). */
  images: Record<string, MediaImageData>;
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {steps.map((s, i) => {
        const img = s.media_id ? images[s.media_id] : undefined;
        return (
          <li
            key={i}
            className="grid grid-cols-[76px_minmax(0,1fr)] gap-4 border-b border-line py-5 first:pt-1 last:border-b-0 last:pb-0 min-[561px]:grid-cols-[108px_minmax(0,1fr)] min-[561px]:gap-[22px]"
          >
            <div className="grid size-[76px] place-items-center overflow-hidden rounded-[6px] bg-[color-mix(in_srgb,var(--color-line)_55%,var(--color-bg))] font-serif text-[30px] text-accent-deep min-[561px]:size-[108px]">
              {img ? (
                <MediaImage data={img} className="h-full w-full object-cover" sizes="(max-width: 560px) 76px, 108px" />
              ) : (
                <span aria-hidden>{i + 1}</span>
              )}
            </div>
            <div className="leading-[1.6]">
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-accent-deep">{s.time}</span>
              <h3 className="my-1.5 font-serif text-[21px] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
                {s.title}
              </h3>
              <p className="text-[15px] leading-[1.6] text-ink-soft">{s.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
