import assert from "node:assert/strict";
import { test } from "node:test";
import { PgDialect } from "drizzle-orm/pg-core";
import { apartmentListWhere, tallyApartmentCounts } from "../admin/derive";

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
