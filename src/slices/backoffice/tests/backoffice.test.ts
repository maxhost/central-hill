import assert from "node:assert/strict";
import { test } from "node:test";
import { composeAdminNav } from "../registry";
import type { AdminScreen } from "../types";

/**
 * Unit tests for the admin-nav composition (pure logic — no DB / no server-only,
 * runs under `npx tsx --test`). Run:
 *   npx tsx --test src/slices/backoffice/tests/backoffice.test.ts
 */

const extra: AdminScreen[] = [
  { id: "crm.leads", href: "/admin/leads", label: "x", group: "crm", order: 1 },
  { id: "content.blog", href: "/admin/blog", label: "y", group: "content", order: 2 },
  { id: "content.pages", href: "/admin/pages", label: "z", group: "content", order: 1 },
  { id: "system.users", href: "/admin/users", label: "w", group: "system", roles: ["admin"] },
];

test("defaults to just the overview group with the dashboard", () => {
  const nav = composeAdminNav();
  assert.equal(nav.length, 1);
  const [overview] = nav;
  assert.ok(overview);
  assert.equal(overview.id, "overview");
  assert.deepEqual(
    overview.items.map((s) => s.id),
    ["overview.dashboard"],
  );
});

test("merges slice screens, keeps groups in fixed order, drops empty groups", () => {
  const nav = composeAdminNav(extra, "admin");
  assert.deepEqual(
    nav.map((g) => g.id),
    ["overview", "content", "crm", "system"],
  );
});

test("sorts items within a group by order", () => {
  const nav = composeAdminNav(extra, "admin");
  const content = nav.find((g) => g.id === "content");
  assert.deepEqual(
    content?.items.map((s) => s.id),
    ["content.pages", "content.blog"],
  );
});

test("hides role-restricted screens from other roles", () => {
  const editor = composeAdminNav(extra, "editor");
  assert.equal(editor.find((g) => g.id === "system"), undefined);

  const admin = composeAdminNav(extra, "admin");
  assert.ok(admin.find((g) => g.id === "system"));
});

test("unrestricted screens are visible even without a role", () => {
  const nav = composeAdminNav(extra);
  const ids = nav.flatMap((g) => g.items.map((s) => s.id));
  assert.ok(ids.includes("crm.leads"));
  assert.ok(!ids.includes("system.users"));
});
