import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { randomUUID } from "node:crypto";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, loadTranslationRows, setSourceContent, setTargetTranslation } from "@core/i18n";
import { nav_item } from "../schema";
import { getNav } from "../server/queries";
import { saveNavigation } from "../admin/actions";
import { getNavigationForEdit } from "../admin/queries";

const id = randomUUID();
const legacyUrl = "/legacy-fixed-navigation-qa";
const legacyLabel = "OWN LEGACY NAV MUST NEVER RENDER";
let verified = false;
let created = false;
let oldNav: typeof nav_item.$inferSelect[] = [];
const navRows = () => db.select().from(nav_item).orderBy(asc(nav_item.id));
const navTranslations = async () => (await loadTranslationRows({ type: "nav_item", id }))
  .sort((a, b) => a.field.localeCompare(b.field) || a.locale.localeCompare(b.locale));
const flatten = (nodes: Awaited<ReturnType<typeof getNav>>): { label: string; url: string }[] =>
  nodes.flatMap((node) => [{ label: node.label, url: node.url }, ...flatten(node.children)]);

before(async () => {
  assert.equal(new URL(process.env.DATABASE_URL ?? "http://invalid.test").hostname, "propertylocalesqa.local");
  assert.deepEqual((await db.execute(sql`select current_database() as db,current_user as role`)).rows[0], { db: "propertylocalesqa", role: "propertylocalesqa" });
  oldNav = await navRows();
  assert.equal(oldNav.some((row) => row.id === id), false);
  assert.equal((await loadTranslationRows({ type: "nav_item", id })).length, 0);
  verified = true;
  const [row] = await db.insert(nav_item).values({ id, location: "header", position: -999, url: legacyUrl }).returning();
  assert.equal(row?.id, id);
  created = true;
  await setSourceContent("nav_item", id, { label: legacyLabel });
  await setTargetTranslation("nav_item", id, "label", "es", "OWN PENDING NAV", { sourceValue: legacyLabel, state: "needs_review" });
});
after(async () => {
  if (!verified) return;
  if (created) {
    const [row] = await db.select().from(nav_item).where(eq(nav_item.id, id));
    assert.equal(row?.url, legacyUrl, "Refuse cleanup of an unrecognized nav row");
    await db.delete(nav_item).where(eq(nav_item.id, id));
    await deleteContent("nav_item", id);
  }
  assert.deepEqual(await navRows(), oldNav, "All previous nav rows must remain exact");
  assert.equal((await navTranslations()).length, 0);
});

test("fixed navigation ignores an existing legacy DB item in both header and footer for all locales", async () => {
  for (const location of ["header", "footer"] as const) {
    await db.update(nav_item).set({ location }).where(eq(nav_item.id, id));
    for (const locale of ["en", "es", "pt", "fr"] as const) {
      const header = await getNav(locale, "header");
      const footer = await getNav(locale, "footer");
      assert.deepEqual(header.map((node) => node.url), ["/owners", "/buildings", "/real-estate", "/guests", "/about", "/blog"]);
      assert.equal(footer.length, 2);
      assert.ok(footer.every((group) => group.children.length === 5));
      for (const item of [...flatten(header), ...flatten(footer)]) {
        assert.notEqual(item.url, legacyUrl);
        assert.ok(!item.label.includes("OWN "));
      }
    }
  }
});
test("retired legacy Navigation Save rejects valid, empty and malformed payloads without writes", async () => {
  const beforeRows = await navRows();
  const beforeLabels = await navTranslations();
  for (const payload of [
    { header: [{ id, url: "/replace", label: "Replace legacy", children: [] }], footer: [] },
    { header: [], footer: [] },
    null,
  ]) assert.deepEqual(await saveNavigation(payload), { ok: false, error: "validation", fieldErrors: {} });
  assert.deepEqual(await navRows(), beforeRows);
  assert.deepEqual(await navTranslations(), beforeLabels);
});
test("the retired Navigation reader does not load editable legacy DB values", async () => {
  const beforeRows = await navRows();
  const beforeLabels = await navTranslations();
  assert.deepEqual(await getNavigationForEdit(), { header: [], footer: [] });
  assert.deepEqual(await navRows(), beforeRows);
  assert.deepEqual(await navTranslations(), beforeLabels);
});
