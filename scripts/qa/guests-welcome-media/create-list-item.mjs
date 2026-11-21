import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  browser,
  login,
  section,
  until,
  saveDraft,
  publish,
  fixture,
  root,
  base,
  database,
  pageSnapshot,
} from "./common.mjs";
const key = process.argv[2],
  group = process.argv[3],
  list = process.argv[4];
assert.ok(["about", "real_estate"].includes(key));
const sql = await database();
const b = await browser(),
  c = await b.newContext({ viewport: { width: 1440, height: 1000 } }),
  p = await login(c);
p.on("dialog", (d) => d.accept());
async function evidence(surface, url, label) {
  const target = surface
    .locator(`img[src*="${url}"],[style*="${url}"]`)
    .first();
  await until(() => target.count(), "new item rendered " + label);
  await target.scrollIntoViewIfNeeded();
  const m = await target.evaluate(async (e) => {
    const im = e instanceof HTMLImageElement ? e : new Image();
    if (e instanceof HTMLImageElement) await e.decode();
    else {
      im.src = e.style.backgroundImage.slice(5, -2);
      await im.decode();
    }
    const r = e.getBoundingClientRect(),
      cs = getComputedStyle(e);
    return {
      width: r.width,
      height: r.height,
      naturalWidth: im.naturalWidth,
      naturalHeight: im.naturalHeight,
      fit: e instanceof HTMLImageElement ? cs.objectFit : cs.backgroundSize,
      position:
        e instanceof HTMLImageElement
          ? cs.objectPosition
          : cs.backgroundPosition,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  assert.ok(m.width > 0 && m.height > 0);
  assert.equal(m.overflow, false);
  assert.ok(["cover", "contain"].includes(m.fit));
  assert.equal(m.position, "50% 50%");
  await target.screenshot({
    path: root + "/matrix/" + key + "-" + group + "-created-" + label + ".png",
    timeout: 15000,
  });
  return m;
}
try {
  await p.goto(base + "/admin/pages/" + key, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1500);
  await section(p, group);
  const inputs = p.locator("input[type=file]");
  const before = await inputs.count();
  await p.getByRole("button", { name: /^\+ / }).first().click();
  await until(
    async () => (await inputs.count()) === before + 1,
    "new list uploader",
  );
  const input = inputs.last();
  const row = input.locator(
    'xpath=ancestor::div[contains(@class,"rounded-md") and contains(@class,"p-3")][1]',
  );
  for (const control of await row
    .locator("input:not([type=file]),textarea")
    .all()) {
    if ((await control.isEditable()) && !(await control.inputValue()))
      await control.fill("QA " + list + " item");
  }
  for (const icon of await row.locator('button[id^="page-field-"]').all()) {
    await icon.click();
    await p.getByTitle("check", { exact: true }).click();
  }
  await input.setInputFiles(
    await fixture(key + "-" + group + "-created-3-2", [2250, 1500]),
  );
  await until(
    () => input.locator("xpath=..").locator('img[src^="blob:"]').count(),
    "new local image",
  );
  await until(
    () =>
      p
        .getByRole("button", { name: "Save draft", exact: true })
        .first()
        .isEnabled(),
    "reservation",
  );
  const blob = await input
    .locator("xpath=..")
    .locator("img")
    .first()
    .getAttribute("src");
  const frame = await until(
    () =>
      p.frames().find((f) => f.url().includes("/admin/preview/" + key + "?")),
    "live frame",
  );
  const previewDesktop = await evidence(frame, blob, "preview-desktop");
  await p.getByRole("button", { name: "Mobile, 390 px", exact: true }).click();
  const previewMobile = await evidence(frame, blob, "preview-mobile");
  await p
    .getByRole("button", { name: "Desktop, 1440 px", exact: true })
    .click();
  await saveDraft(p);
  let snap = await pageSnapshot(sql, key);
  assert.ok(snap.draft);
  const path = list.split(".");
  let items = path.reduce((x, k) => x[k], snap.draft.content);
  assert.equal(items.length, before + 1);
  const id = items.at(-1).image_media_id || items.at(-1).logo_media_id;
  const asset = (await sql`select * from media_asset where id=${id}::uuid`)[0];
  assert.equal(asset.width, 2250);
  assert.equal(asset.height, 1500);
  await p.reload({ waitUntil: "domcontentloaded" });
  await publish(p);
  snap = await pageSnapshot(sql, key);
  items = path.reduce((x, k) => x[k], snap.published.content);
  assert.equal(items.length, before + 1);
  const publicEvidence = [];
  for (const width of [1440, 390]) {
    await p.setViewportSize({ width, height: 1000 });
    await p.goto(
      base + "/en/" + (key === "real_estate" ? "real-estate" : key),
      { waitUntil: "domcontentloaded" },
    );
    publicEvidence.push({
      viewport: width,
      ...(await evidence(p, id, "public-" + width)),
    });
  }
  await fs.writeFile(
    root + "/matrix/" + key + "-" + group + "-created.json",
    JSON.stringify(
      {
        key,
        group,
        list,
        before,
        after: items.length,
        id,
        asset,
        previewDesktop,
        previewMobile,
        publicEvidence,
        field:
          list +
          "." +
          (items.length - 1) +
          "." +
          (items.at(-1).logo_media_id ? "logo_media_id" : "image_media_id"),
      },
      null,
      2,
    ),
  );
  console.log("created", key, list, items.length, id);
} catch (e) {
  console.log(await p.locator("body").innerText());
  throw e;
} finally {
  await b.close();
}
