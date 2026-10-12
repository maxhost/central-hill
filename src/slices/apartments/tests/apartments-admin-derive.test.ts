import assert from "node:assert/strict";
import { test } from "node:test";
import { PgDialect } from "drizzle-orm/pg-core";
import {
  apartmentListWhere,
  isBuildingChange,
  nextApartmentPosition,
  planApartmentMove,
  sortApartmentSlots,
  tallyApartmentCounts,
} from "../admin/derive";

/**
 * Slice `apartments` backoffice — pure helpers behind `countApartmentsByBuilding()`
 * and the `buildingId` filter of `listApartmentsAdmin()` (spec
 * building-detail-admin-editor, S1). No DB: the WHERE clause is rendered with
 * Drizzle's Postgres dialect. Run:
 * `npx tsx --test src/slices/apartments/tests/apartments-admin-derive.test.ts`.
 */

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

test("tally: totals every status, published only counts published", () => {
  const counts = tallyApartmentCounts([
    { building_id: A, status: "published", n: 3 },
    { building_id: A, status: "draft", n: 2 },
    { building_id: A, status: "archived", n: 1 },
    { building_id: B, status: "draft", n: 4 },
  ]);
  assert.deepEqual(counts.get(A), { total: 6, published: 3 });
  assert.deepEqual(counts.get(B), { total: 4, published: 0 });
  assert.equal(counts.size, 2);
});

test("tally: a building without apartments is absent; empty input → empty map", () => {
  assert.equal(tallyApartmentCounts([]).size, 0);
  assert.equal(tallyApartmentCounts([{ building_id: A, status: "draft", n: 1 }]).has(B), false);
});

test("tally: coerces driver counts that arrive as strings", () => {
  const counts = tallyApartmentCounts([
    { building_id: A, status: "published", n: "2" as unknown as number },
    { building_id: A, status: "published", n: 1 },
  ]);
  assert.deepEqual(counts.get(A), { total: 3, published: 3 });
});

test("list filter: no buildingId → no WHERE (every apartment)", () => {
  assert.equal(apartmentListWhere(), undefined);
  assert.equal(apartmentListWhere(""), undefined);
});

test("list filter: buildingId → building_id = $1 bound to that id", () => {
  const where = apartmentListWhere(A);
  assert.ok(where);
  const query = new PgDialect().sqlToQuery(where);
  assert.match(query.sql, /"building_id" = \$1/);
  assert.deepEqual(query.params, [A]);
});

/* ── S2: ordering inside a building, create position, D6 guard ─────────────────── */

const slots = [
  { id: "a", position: 0 },
  { id: "b", position: 1 },
  { id: "c", position: 2 },
];

test("move: up swaps with the previous neighbour; only changed rows returned", () => {
  assert.deepEqual(planApartmentMove(slots, "b", "up"), [
    { id: "b", position: 0 },
    { id: "a", position: 1 },
  ]);
});

test("move: down swaps with the next neighbour", () => {
  assert.deepEqual(planApartmentMove(slots, "b", "down"), [
    { id: "c", position: 1 },
    { id: "b", position: 2 },
  ]);
});

test("move: no-op at the ends and for an unknown id", () => {
  assert.equal(planApartmentMove(slots, "a", "up"), null);
  assert.equal(planApartmentMove(slots, "c", "down"), null);
  assert.equal(planApartmentMove(slots, "zzz", "up"), null);
  assert.equal(planApartmentMove([], "a", "down"), null);
});

test("move: input order does not matter — neighbour is by position (same building list)", () => {
  const shuffled = [slots[2]!, slots[0]!, slots[1]!];
  assert.deepEqual(planApartmentMove(shuffled, "c", "up"), [
    { id: "c", position: 1 },
    { id: "b", position: 2 },
  ]);
});

test("move: normalizes gapped / duplicate positions to 0..n-1 (id tiebreaker)", () => {
  const messy = [
    { id: "b", position: 5 },
    { id: "a", position: 5 },
    { id: "c", position: 9 },
  ];
  assert.deepEqual(
    sortApartmentSlots(messy).map((s) => s.id),
    ["a", "b", "c"],
  );
  // c moves above b → a, c, b renumbered 0, 1, 2.
  assert.deepEqual(planApartmentMove(messy, "c", "up"), [
    { id: "a", position: 0 },
    { id: "c", position: 1 },
    { id: "b", position: 2 },
  ]);
});

test("create position: max + 1 of the building; 0 when it has none", () => {
  assert.equal(nextApartmentPosition([]), 0);
  assert.equal(nextApartmentPosition([0, 1, 2]), 3);
  assert.equal(nextApartmentPosition([4, 0, 7]), 8);
});

test("D6 guard: a different building_id on update is a building change", () => {
  assert.equal(isBuildingChange(A, A), false);
  assert.equal(isBuildingChange(A, B), true);
});
