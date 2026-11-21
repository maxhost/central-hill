import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { browser, root, base, database, pageSnapshot } from "./common.mjs";
const sql = await database(),
  row = await pageSnapshot(sql, "buildings"),
  id = row.published.content.calculator.media_media_id;
const b = await browser(),
  c = await b.newContext(),
  p = await c.newPage(),
  results = [];
try {
  for (const width of [1440, 981, 980, 768, 390]) {
    await p.setViewportSize({ width, height: 1000 });
    await p.goto(base + "/en/buildings", {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    const img = p.locator(`img[src*="${id}"]`).first();
    await img.scrollIntoViewIfNeeded();
    await img.evaluate((e) => e.decode());
    const m = await img.evaluate((e) => {
      const r = e.getBoundingClientRect(),
        frame = e.parentElement,
        grid = frame.parentElement,
        s = getComputedStyle(e);
      return {
        width: r.width,
        height: r.height,
        formHeight: grid.children[0].getBoundingClientRect().height,
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        fit: s.objectFit,
        position: s.objectPosition,
        naturalWidth: e.naturalWidth,
        naturalHeight: e.naturalHeight,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    const expected = width >= 981 ? m.formHeight : m.width / (4 / 5);
    assert.ok(
      Math.abs(m.height - expected) <= 1,
      JSON.stringify({ width, ...m, expected }),
    );
    assert.equal(m.columns, width >= 981 ? 2 : 1);
    assert.equal(m.fit, "cover");
    assert.equal(m.position, "50% 50%");
    assert.equal(m.overflow, false);
    const screenshot = "calculator-frame-" + width + ".png";
    await img.screenshot({ path: root + "/matrix/" + screenshot });
    results.push({ viewport: width, ...m, expected, screenshot });
  }
  await fs.writeFile(
    root + "/matrix/calculator-contract-results.json",
    JSON.stringify({ id, results }, null, 2),
  );
  console.log("calculator breakpoints", results.length);
} finally {
  await b.close();
}
