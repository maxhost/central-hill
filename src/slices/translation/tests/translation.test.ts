import assert from "node:assert/strict";
import { test } from "node:test";

import type { TranslationRow } from "@core/i18n";
import {
  buildEntity,
  buildInbox,
  cellStatus,
  deriveTitle,
  entityTypesOf,
  statusTone,
  sumRollups,
  TARGET_LOCALES,
} from "../admin/derive";

/**
 * Slice `translation` (S14) — pure tests (no DB/IO). Covers the review-matrix
 * derivation (cell status incl. stale-vs-approved, the entity rollup, inbox
 * attention-first ordering, title derivation). A fake `hashOf` keeps the tests
 * deterministic. The kernel hash/provider live in the server-only `translate.ts`
 * (Next-resolved `server-only`; not loadable under `tsx`, so untested here — the
 * same convention the seo slice follows for its server-only modules). Run:
 * `npx tsx --test src/slices/translation/tests/translation.test.ts`.
 */

const fakeHash = (v: string) => `H(${v.trim()})`;

function row(
  entity_type: string,
  entity_id: string,
  field: string,
  locale: TranslationRow["locale"],
  value: string,
  state: TranslationRow["state"] = "approved",
  source_hash: string | null = null,
  updated_at = new Date("2026-01-01T00:00:00Z"),
): TranslationRow {
  return { entity_type, entity_id, field, locale, value, state, source_hash, updated_at, updated_by: null };
}

test("cellStatus classifies missing / stale / approved / needs_review", () => {
  assert.equal(cellStatus(undefined, "Casa", fakeHash).status, "missing");
  assert.equal(
    cellStatus({ value: "x", state: "approved", source_hash: "OLD" }, "Casa", fakeHash).status,
    "stale",
  );
  assert.equal(
    cellStatus({ value: "x", state: "approved", source_hash: fakeHash("Casa") }, "Casa", fakeHash).status,
    "approved",
  );
  assert.equal(
    cellStatus({ value: "x", state: "needs_review", source_hash: fakeHash("Casa") }, "Casa", fakeHash).status,
    "needs_review",
  );
  // null hash is always stale (never translated against a known source)
  assert.equal(
    cellStatus({ value: "x", state: "approved", source_hash: null }, "Casa", fakeHash).status,
    "stale",
  );
});

test("statusTone maps statuses to badge tones", () => {
  assert.equal(statusTone("approved"), "approved");
  assert.equal(statusTone("missing"), "neutral");
  assert.equal(statusTone("stale"), "review");
  assert.equal(statusTone("needs_review"), "review");
});

test("deriveTitle prefers name/title over arbitrary fields", () => {
  assert.equal(deriveTitle(new Map([["desc", "D"], ["name", "Casa"]])), "Casa");
  assert.equal(deriveTitle(new Map([["question", "Q?"]])), "Q?");
  assert.equal(deriveTitle(new Map([["body", "First"]])), "First");
  assert.equal(deriveTitle(new Map()), "—");
});

test("buildEntity builds the field matrix + rollup over all target locales", () => {
  const rows: TranslationRow[] = [
    row("building", "b1", "name", "en", "Casa"),
    row("building", "b1", "desc", "en", "Hello"),
    row("building", "b1", "name", "pt", "Casa PT", "approved", fakeHash("Casa")), // approved
    row("building", "b1", "desc", "pt", "Antigo", "approved", "OLD"), // stale
    row("building", "b1", "name", "es", "Casa ES", "needs_review", fakeHash("Casa")), // needs_review
    // es/desc, fr/name, fr/desc missing
  ];
  const e = buildEntity("building", "b1", rows, fakeHash);

  assert.equal(e.title, "Casa");
  assert.deepEqual(e.fields.map((f) => f.field), ["desc", "name"]); // sorted
  assert.equal(e.fields[0]!.cells.length, TARGET_LOCALES.length);

  const name = e.fields.find((f) => f.field === "name")!;
  assert.equal(name.cells.find((c) => c.locale === "pt")!.status, "approved");
  assert.equal(name.cells.find((c) => c.locale === "es")!.status, "needs_review");
  assert.equal(name.cells.find((c) => c.locale === "fr")!.status, "missing");

  assert.deepEqual(e.rollup, { total: 6, missing: 3, stale: 1, needsReview: 1, approved: 1 });
});

test("buildInbox sorts entities needing attention first", () => {
  const rows: TranslationRow[] = [
    // fully approved service → no attention
    row("service", "s1", "name", "en", "Svc"),
    row("service", "s1", "name", "pt", "Svc", "approved", fakeHash("Svc")),
    row("service", "s1", "name", "es", "Svc", "approved", fakeHash("Svc")),
    row("service", "s1", "name", "fr", "Svc", "approved", fakeHash("Svc")),
    // building with gaps → attention
    row("building", "b1", "name", "en", "Casa"),
  ];
  const items = buildInbox(rows, fakeHash);
  assert.equal(items.length, 2);
  assert.equal(items[0]!.entityType, "building");
  assert.equal(items[0]!.needsAttention, true);
  assert.equal(items[1]!.entityType, "service");
  assert.equal(items[1]!.needsAttention, false);

  assert.deepEqual(entityTypesOf(items), ["building", "service"]);
  const totals = sumRollups(items);
  assert.equal(totals.approved, 3); // the service's three locales
  assert.equal(totals.missing, 3); // the building's three target locales
});
