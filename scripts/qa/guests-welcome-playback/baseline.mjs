import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import {
  fieldUpload,
  saveDraft,
  publish,
  until,
  root,
} from "../guests-welcome-media/common.mjs";
const req = createRequire(new URL("../../../package.json", import.meta.url));
req("dotenv").config({ path: root + "/base.env.local", quiet: true });
const uri = new URL(process.env.DATABASE_URL);
assert.equal(uri.pathname, "/welcomebaseqa20261121");
assert.equal(uri.username, "welcomebaseqa20261121");
const { neon } = req("@neondatabase/serverless"),
  sql = neon(process.env.DATABASE_URL);
assert.deepEqual(
  (await sql`select current_database() db,current_user role`)[0],
  { db: "welcomebaseqa20261121", role: "welcomebaseqa20261121" },
);
const base = "http://127.0.0.1:3092",
  artifact = root + "/baseline-playback";
await fs.mkdir(artifact, { recursive: true });
const credentials = JSON.parse(
  await fs.readFile(root + "/login-private.json", "utf8"),
);
const b = await req("playwright").chromium.launch({ headless: true }),
  c = await b.newContext({ viewport: { width: 1440, height: 1000 } }),
  p = await c.newPage();
p.setDefaultTimeout(60000);
p.setDefaultNavigationTimeout(90000);
const result = { base: "ec7f610", cases: [], errors: [] };
p.on("pageerror", (e) => result.errors.push(e.message));
await p.goto(base + "/admin/login", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1200);
await p.getByLabel("Email", { exact: true }).fill(credentials.email);
await p.getByLabel("Password", { exact: true }).fill(credentials.password);
await p.getByRole("button", { name: /Sign in|Log in/i }).click();
await p.waitForURL((u) => !u.pathname.includes("/login"), {
  waitUntil: "domcontentloaded",
});
await p.goto(base + "/admin/pages/guest", { waitUntil: "domcontentloaded" });
console.log(
  "editorloaded",
  p.url(),
  await p.locator("iframe").evaluateAll((es) => es.map((e) => e.src)),
);
await p.waitForTimeout(1500);
await until(
  () => p.frames().find((f) => f.url().includes("/admin/preview/guest?")),
  "hydrated base iframe",
  120000,
);
const row = async () =>
  (
    await sql`select * from page_locale_content where page_key='guest' and locale='en'`
  )[0];
async function measurement(el, name) {
  await el.scrollIntoViewIfNeeded();
  const m = await el.evaluate((e) => {
    const r = e.getBoundingClientRect(),
      parent = e.parentElement.getBoundingClientRect();
    return {
      width: r.width,
      height: r.height,
      parent: { width: parent.width, height: parent.height },
      tag: e.tagName,
      fit: getComputedStyle(e).objectFit,
      src: e.src || null,
      naturalWidth: e.videoWidth || e.width,
      naturalHeight: e.videoHeight || e.height,
    };
  });
  assert.ok(Math.abs(m.height - (m.width * 5) / 4) <= 1, JSON.stringify(m));
  assert.ok(
    Math.abs(m.height - m.width / 1.5) > 30,
    "base must fail intended3:2",
  );
  await el.screenshot({ path: artifact + "/" + name + ".png" });
  return m;
}
try {
  for (const [kind, file] of [
    ["video", root + "/fixtures/loop-3-2.webm"],
    ["lottie", root + "/fixtures/lottie-3-2.json"],
  ]) {
    console.log("BASE", kind);
    const before = await row();
    await fieldUpload(p, "welcome.image_media_id", file);
    const f = await until(
      () => p.frames().find((f) => f.url().includes("/admin/preview/guest?")),
      "base preview iframe",
    );
    const localEl = f.locator(
      '[data-editor-binding="welcome"] ' +
        (kind === "video" ? "video" : "canvas"),
    );
    await until(() => localEl.count(), "local " + kind);
    await localEl.scrollIntoViewIfNeeded();
    let local;
    if (kind === "video") {
      await until(
        () => localEl.evaluate((e) => e.readyState >= 2),
        "real local video",
      );
      local = await measurement(localEl, "base-video-local");
    } else {
      await until(async () => {
        const { data } = await req("sharp")(await localEl.screenshot())
          .raw()
          .toBuffer({ resolveWithObject: true });
        return Array.from(data).some(
          (x, i) => i % 3 === 1 && x >= 90 && x < 160,
        );
      }, "actual local Lottie render");
      local = await measurement(localEl, "base-lottie-local");
    }
    await saveDraft(p);
    const draft = await until(async () => {
      const r = await row();
      return r.revision > (before?.revision ?? 0) && r.draft ? r : null;
    }, "base saved");
    const id = draft.draft.content.welcome.image_media_id,
      media = (await sql`select * from media_asset where id=${id}::uuid`)[0];
    await p.reload({ waitUntil: "domcontentloaded" });
    await publish(p);
    const pub = await c.newPage();
    await pub.goto(base + "/en/guests", {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    let target;
    if (kind === "video") target = pub.locator('video[src*="' + id + '"]');
    else target = pub.locator("canvas");
    await target.scrollIntoViewIfNeeded();
    if (kind === "video")
      await until(
        () => target.evaluate((e) => e.readyState >= 2),
        "actual base video decoded",
      );
    else
      await until(async () => {
        const { data } = await req("sharp")(await target.screenshot())
          .raw()
          .toBuffer({ resolveWithObject: true });
        return Array.from(data).some(
          (x, i) => i % 3 === 1 && x >= 90 && x < 160,
        );
      }, "actual public Lottie rendered");
    const dimensions = [];
    for (const width of [1440, 390]) {
      await pub.setViewportSize({ width, height: 1000 });
      dimensions.push({
        viewport: width,
        ...(await measurement(target, "base-" + kind + "-" + width)),
      });
    }
    let playback;
    if (kind === "video") {
      const t = await target.evaluate((e) => e.currentTime);
      await pub.waitForTimeout(450);
      playback = {
        first: t,
        last: await target.evaluate((e) => e.currentTime),
      };
      assert.notEqual(playback.first, playback.last);
    } else {
      const a = await target.screenshot();
      await pub.waitForTimeout(500);
      const z = await target.screenshot();
      playback = { actualRender: true, advanced: !a.equals(z) };
      assert.equal(playback.advanced, true);
    }
    result.cases.push({ kind, id, media, local, dimensions, playback });
    await fs.writeFile(
      artifact + "/results.json",
      JSON.stringify(result, null, 2),
    );
    await pub.close();
  }
} catch (e) {
  console.log(
    "BASE FAILURE",
    p.url(),
    await p.locator("body").innerText(),
    await p.locator("iframe").evaluateAll((es) => es.map((e) => e.src)),
  );
  await p
    .screenshot({ path: artifact + "/failure.png", fullPage: true })
    .catch(() => {});
  throw e;
} finally {
  await fs.writeFile(
    artifact + "/results.json",
    JSON.stringify(result, null, 2),
  );
  await b.close();
}
