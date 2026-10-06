import { cn } from "@core/ui";
import type { DetailItineraryStep } from "../../contract";

/**
 * Vertical day-plan timeline (time · title · text per step) for a tour's itinerary — the old
 * `.mk .itin`/`.itin-step` port: a 2px `line` rule on the left with an `accent` dot per step
 * (ringed in `bg` so it reads as sitting on the rule). No `core/ui` primitive draws a timeline
 * (`NumberedFeatureGrid` numbers cards in a grid; `StepGallery` is photo cards), so it stays
 * slice-local. Bare and presentational; the caller owns the section shell and spacing.
 */
export function ServiceItinerary({
  steps,
  className,
}: {
  steps: DetailItineraryStep[];
  className?: string;
}) {
  return (
    <ol className={cn("ml-[6px] max-w-[68ch] border-l-2 border-line", className)}>
      {steps.map((s, i) => (
        <li key={i} className="relative pb-[30px] pl-[30px] last:pb-0">
          <span
            aria-hidden
            className="absolute top-1 -left-[7px] size-3 rounded-full border-[3px] border-bg bg-accent"
          />
          <span className="block text-[11.5px] font-semibold uppercase tracking-[0.12em] text-accent-deep">
            {s.time}
          </span>
          <h3 className="my-1.5 font-serif text-[19px] font-medium leading-[1.3] text-ink">{s.title}</h3>
          <p className="text-[14.5px] leading-[1.65] text-ink-soft">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
