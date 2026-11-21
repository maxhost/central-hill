import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { browser, root, base, database, pageSnapshot } from "./common.mjs";
const key = process.argv[2];
assert.ok(
  [
    "home",
    "owners",
    "about",
    "real_estate",
    "services",
    "guides",
    "buildings",
    "blog",
    "guest",
  ].includes(key),
);
const sql = await database();
const snap = await pageSnapshot(sql, key);
assert.ok(snap.published);
const b = await browser();
const ctx = await b.newContext({ viewport: { width: 768, height: 1000 } }),
  p = await ctx.newPage();
const fields = [];
function walk(x, path = []) {
  if (Array.isArray(x)) x.forEach((v, i) => walk(v, [...path, "" + i]));
  else if (x && typeof x === "object")
    Object.entries(x).forEach(([k, v]) => walk(v, [...path, k]));
  else if (typeof x === "string" && path.at(-1)?.endsWith("_media_id") && x)
    fields.push({ path: path.join("."), id: x });
}
walk(snap.published.content);
const route =
  key === "home"
    ? ""
    : key === "guest"
      ? "/guests"
      : key === "real_estate"
        ? "/real-estate"
        : "/" + key;
const results = [];
try {
  await p.goto(base + "/en" + route, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  for (const f of fields) {
    if (!/\.\d+\./.test(f.path)) continue;
    const targets = p.locator(`img[src*="${f.id}"],[style*="${f.id}"]`);
    assert.ok(await targets.count(), f.path + " tablet destination");
    for (const target of await targets.all()) {
      await target.scrollIntoViewIfNeeded();
      const m = await target.evaluate(async (e) => {
        const im = e instanceof HTMLImageElement ? e : new Image();
        if (e instanceof HTMLImageElement) await e.decode();
        else {
          im.src = e.style.backgroundImage.slice(5, -2);
          await im.decode();
        }
        const r = e.getBoundingClientRect(),
          s = getComputedStyle(e);
        return {
          width: r.width,
          height: r.height,
          naturalWidth: im.naturalWidth,
          naturalHeight: im.naturalHeight,
          fit: e instanceof HTMLImageElement ? s.objectFit : s.backgroundSize,
          position:
            e instanceof HTMLImageElement
              ? s.objectPosition
              : s.backgroundPosition,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert.ok(m.width > 0 && m.height > 0);
      assert.equal(m.overflow, false);
      assert.ok(["cover", "contain"].includes(m.fit));
      assert.equal(m.position, "50% 50%");
      const shot = `${key}-tablet-${f.path.replaceAll(".", "-")}.png`;
      await target.screenshot({
        path: root + "/matrix/" + shot,
        timeout: 15000,
      });
      results.push({ ...f, viewport: 768, ...m, screenshot: shot });
    }
  }
  await fs.writeFile(
    root + "/matrix/" + key + "-tablet-results.json",
    JSON.stringify({ key, results }, null, 2),
  );
  console.log("tablet", key, results.length);
} finally {
  await b.close();
}
