import fs from "node:fs/promises";
import {
  browser,
  login,
  fieldUpload,
  saveDraft,
  publish,
  fixture,
  imageMeasurement,
  until,
  root,
  base,
  database,
  pageSnapshot,
} from "./common.mjs";
const b = await browser();
const context = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await login(context);
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(base + "/admin/pages/guest", {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
console.log(
  "editor",
  await p.locator('select[id$="-binding"] option').allTextContents(),
);
const localURL = await fieldUpload(
  p,
  "welcome.image_media_id",
  await fixture(),
);
console.log("selected local");
const frame = await until(
  () => p.frames().find((f) => f.url().includes("/admin/preview/guest?")),
  "preview frame",
);
await until(
  () => frame.locator(`img[src="${localURL}"]`).count(),
  "selected Welcome preview image",
);
const preview = await imageMeasurement(
  frame.locator(`img[src="${localURL}"]`).first(),
);
console.log("baseline preview geometry", JSON.stringify(preview));
await fs.mkdir(root + "/baseline", { recursive: true });
await frame
  .locator('[data-editor-binding="welcome"]')
  .screenshot({ path: root + "/baseline/preview-local-desktop.png" });
await saveDraft(p);
console.log("saved");
await p.reload({ waitUntil: "domcontentloaded" });
await publish(p);
console.log("published");
const pub = await context.newPage();
await pub.goto(base + "/en/guests", {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
const sql = await database();
const id = (await pageSnapshot(sql, "guest")).published.content.welcome
  .image_media_id;
const selected = pub.locator(`img[src*="${id}"],img[srcset*="${id}"]`);
console.log(
  "images",
  await pub.locator("img").evaluateAll((es) => es.map((e) => e.src)),
);
const measurements = [];
for (const width of [1440, 390]) {
  await pub.setViewportSize({ width, height: 1000 });
  const m = await imageMeasurement(selected.first());
  measurements.push({ width, ...m });
  await selected
    .first()
    .screenshot({ path: root + `/baseline/public-${width}.png` });
}
await fs.writeFile(
  root + "/baseline/results.json",
  JSON.stringify(
    {
      base: "ec7f610",
      expectedRatio: 1.5,
      geometryFailures: measurements.filter(
        (x) => Math.abs(x.height - x.width / 1.5) > 1,
      ),
      preview,
      measurements,
      errors,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ preview, measurements, errors }));
await b.close();
