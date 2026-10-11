/**
 * "Media is preparing" counter (spec `home-admin-editor` → S2).
 *
 * Picking a file runs `reserveUpload` (a presign round-trip) before the pick is queued.
 * During that window the form's value does not hold the new id yet, so a save would
 * silently persist the page without it. The queue counts in-flight reservations; forms
 * disable Save while the count is above zero.
 *
 * Pure (no React) so the counting rules are unit-testable.
 */

export type ReservationEvent = "start" | "settle";

/** Next count: `start` adds one in-flight reservation, `settle` removes one (never below 0). */
export function reservationCount(count: number, event: ReservationEvent): number {
  return event === "start" ? count + 1 : Math.max(0, count - 1);
}

/**
 * Run `work` as one in-flight reservation: `start` before it, `settle` after it — whether
 * it resolves or throws, so a failed reservation never leaves the form stuck as busy.
 */
export async function trackReservation<T>(
  work: () => Promise<T>,
  dispatch: (event: ReservationEvent) => void,
): Promise<T> {
  dispatch("start");
  try {
    return await work();
  } finally {
    dispatch("settle");
  }
}
