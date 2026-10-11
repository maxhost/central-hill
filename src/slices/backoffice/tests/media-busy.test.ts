import assert from "node:assert/strict";
import { test } from "node:test";
import { type ReservationEvent, reservationCount, trackReservation } from "../ui/media-busy";

/**
 * The queue's "media is preparing" counter (pure, no React). Run:
 *   npx tsx --test src/slices/backoffice/tests/media-busy.test.ts
 */

function counter() {
  let count = 0;
  const seen: number[] = [];
  const dispatch = (e: ReservationEvent) => {
    count = reservationCount(count, e);
    seen.push(count);
  };
  return { dispatch, get count() { return count; }, seen };
}

test("start increments, settle decrements, never below zero", () => {
  assert.equal(reservationCount(0, "start"), 1);
  assert.equal(reservationCount(2, "settle"), 1);
  assert.equal(reservationCount(0, "settle"), 0);
});

test("a tracked reservation is busy while it runs and clears when it resolves", async () => {
  const c = counter();
  const result = await trackReservation(async () => {
    assert.equal(c.count, 1);
    return "id";
  }, c.dispatch);
  assert.equal(result, "id");
  assert.equal(c.count, 0);
});

test("a failed reservation also clears the busy state", async () => {
  const c = counter();
  await assert.rejects(
    trackReservation(async () => {
      throw new Error("presign failed");
    }, c.dispatch),
  );
  assert.equal(c.count, 0);
  assert.deepEqual(c.seen, [1, 0]);
});

test("overlapping reservations stay busy until the last one settles", async () => {
  const c = counter();
  let release!: () => void;
  const slow = trackReservation(() => new Promise<void>((r) => (release = r)), c.dispatch);
  await trackReservation(async () => {}, c.dispatch);
  assert.equal(c.count, 1);
  release();
  await slow;
  assert.equal(c.count, 0);
});
