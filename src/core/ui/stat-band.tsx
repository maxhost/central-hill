import { CountUp } from "./motion/count-up";
import { Container } from "./container";

/**
 * Presentational stats band (ADR 0033, `docs/specs/home-component-library/03-stat-band.md`):
 * a full-bleed dark feature (cacao) band holding an optional centred title in cream, then a
 * grid of count-up figures in warm cream (`feature-accent`) below it. No data fetching, no
 * i18n, no `Locale` — every cell arrives already resolved. The data-fetching half (reading
 * the settings singleton, filtering by `StatKey[]`, resolving the title string) stays in the
 * slice composer (`src/slices/pages/ui/components/stats-band.tsx`), which renders this.
 *
 * No `durationMs` prop: `CountUp` (`./motion/count-up.tsx`) still hardcodes its 4000ms
 * duration as a module constant, not a prop (per `01-motion-primitives.md`) — out of scope
 * for this component's migration. Forwarding one here would be dead plumbing.
 */
export function StatBand({
  title,
  cells,
}: {
  /** Centred heading in the band; omitted entirely renders a bare proof band (Owners-style). */
  title?: string;
  cells: { value: string; label: string }[];
}) {
  return (
    <section className="bg-feature py-[clamp(56px,8vw,104px)]">
      <Container>
        {title ? (
          <h2 className="mx-auto max-w-2xl text-center font-serif text-3xl leading-tight text-on-feature md:text-4xl">
            {title}
          </h2>
        ) : null}
        <dl
          className={`grid grid-cols-2 gap-x-8 gap-y-10 text-center lg:grid-cols-4 ${
            title ? "mt-[clamp(40px,6vw,72px)]" : ""
          }`}
        >
          {cells.map((s) => (
            <div key={s.label}>
              <dt className="font-serif text-4xl text-feature-accent md:text-5xl">
                <CountUp value={s.value} />
              </dt>
              <dd className="mt-3 text-xs uppercase tracking-[0.14em] text-on-feature-soft">
                {s.label}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
