# ADR0056 — Keep displayed figures current when props change

2026-11-05. Accepted for the all-Pages live-preview audit.

## Context

CountUp initializes visible text once. Its effect returns without updating that
text for reduced motion, absent IntersectionObserver or unparseable values, so an
already-mounted figure can retain stale text after a legitimate preview render.

## Decision

Key a private animation component by the authored value inside the existing
CountUp export. Changing value resets only the figure's local animation state to
the current value, cleans up old observers/animation frames and preserves the
existing animation for supported motion. No new DOM wrapper or editor coupling.

## Consequences

Current authored text is immediately visible whenever animation cannot run.
Public and preview consumers share the correction; accessible final text and
static/no-JS output remain unchanged. No data, kernel validation or DB changes.
