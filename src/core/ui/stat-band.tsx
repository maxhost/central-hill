import { CountUp } from "./motion/count-up";
import { Container } from "./container";

/**
 * Presentational stats band (ADR 0033, `docs/specs/home-component-library/03-stat-band.md`):
 * a full-bleed dark feature (cacao) band holding an optional centred title in cream, then a
 * grid of count-up figures in warm cream (`feature-accent`) below it. No data fetching, no
 * i18n, no `Locale` — every cell arrives already resolved by the caller. Home and Owners
 * build their cells from their own page rows (`statFigureCells` in slice `pages`); the
 * Settings-backed composer (`src/slices/pages/ui/components/stats-band.tsx`) is currently
 * unused.
 *
 * No `durationMs` prop: `CountUp` (`./motion/count-up.tsx`) still hardcodes its 4000ms
 * duration as a module constant, not a prop (per `01-motion-primitives.md`) — out of scope
 * for this component's migration. Forwarding one here would be dead plumbing.
 *
 * `columns` (default 4, Home/Owners' cell count) and each cell's optional `description` are
 * additive — Buildings' listing (`#` stats band, 3 cells, each with a second descriptive line
 * under the label, e.g. "Bookings Completed" / "Across all managed properties") needed both,
 * ported 1:1 from its old `.mk`-scoped `.stats`/`.stats-grid`/`.stat .lbl` CSS (two stacked
 * `.lbl`s per cell — the original reused one class for both lines via an inline style
 * override; `description` is a real second field here instead).
 */
/** Literal class strings (never built dynamically) so Tailwind generates every one. */
const LG_COLUMNS = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
} as const;

export function StatBand({
  title,
  cells,
  columns = 4,
}: {
  /** Centred heading in the band; omitted entirely renders a bare proof band (Owners-style). */
  title?: string;
  cells: { value: string; label: string; description?: string }[];
  /** Desktop column count (`lg:grid-cols-N`); mobile stays a fixed 2-up either way. `5` is
   *  About's founding/apartments/buildings/guests/reservations band. `1`/`2` added
   *  additively for the Home's variable figures band (spec home-admin-editor S5). */
  columns?: 1 | 2 | 3 | 4 | 5;
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
          className={`grid grid-cols-2 gap-x-8 gap-y-10 text-center ${LG_COLUMNS[columns]} ${
            title ? "mt-[clamp(40px,6vw,72px)]" : ""
          }`}
        >
          {/* Index in the key: the Home's editable rows may repeat a label. */}
          {cells.map((s, i) => (
            <div key={`${i}:${s.label}`}>
              <dt className="font-serif text-4xl text-feature-accent md:text-5xl">
                <CountUp value={s.value} />
              </dt>
              <dd className="mt-3 text-xs uppercase tracking-[0.14em] text-on-feature-soft">
                {s.label}
              </dd>
              {s.description ? (
                <dd className="mt-1.5 text-xs tracking-[0.02em] text-on-feature-soft">
                  {s.description}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
