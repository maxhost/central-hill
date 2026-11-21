import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { playerNetwork } from "./player-network.mjs";
import {
  browser,
  login,
  section,
  fieldUpload,
  saveDraft,
  publish,
  fixture,
  until,
  root,
  base,
} from "../guests-welcome-media/common.mjs";

export async function createHarness(only = "all") {
  const req = createRequire(new URL("../../../package.json", import.meta.url));
  req("dotenv").config({ path: root + "/qa.env.local", quiet: true });
  const u = new URL(process.env.DATABASE_URL);
  assert.equal(u.hostname, "welcomeqa20261121.local");
  assert.equal(u.username, "welcomeqa20261121");
  assert.equal(u.pathname, "/welcomeqa20261121");
  const { neon } = req("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  assert.deepEqual(
    (await sql`select current_database() db,current_user role`)[0],
    { db: "welcomeqa20261121", role: "welcomeqa20261121" },
  );
  const artifact = root + "/welcome-qa";
  await fs.mkdir(artifact, { recursive: true });
  const result = {
    source: {
      head: execFileSync("git", ["rev-parse", "HEAD"]).toString().trim(),
      dirty: execFileSync("git", ["diff", "--name-only"])
        .toString()
        .trim()
        .split("\n"),
    },
    browser: "Playwright Chromium (not Safari)",
    started: new Date().toISOString(),
    cases: [],
    errors: [],
    failures: [],
  };

  const b = await browser(),
    context = await b.newContext({ viewport: { width: 1440, height: 1000 } }),
    networkObservation = playerNetwork(context),
    p = await login(context);
  p.setDefaultTimeout(90000);
  p.setDefaultNavigationTimeout(90000);
  p.on("pageerror", (e) =>
    result.errors.push({ page: "editor", message: e.message }),
  );
  await p.goto(base + "/admin/pages/guest", { waitUntil: "domcontentloaded" });
  await until(
    () => p.frames().find((f) => f.url().includes("/admin/preview/guest?")),
    "hydrated editor preview",
  );
  await section(p, "welcome");
  const row = async () =>
    (
      await sql`select * from page_locale_content where page_key='guest' and locale='en'`
    )[0];
  const selected = (r, pub = false) =>
    (pub ? r.published : r.draft || r.published)?.content?.welcome
      ?.image_media_id;
  async function record(id, fn) {
    console.log("CASE", id);
    try {
      const data = await fn();
      result.cases.push({ ...data, caseId: id, status: "pass" });
    } catch (e) {
      result.failures.push({ caseId: id, error: e.stack });
      await p
        .screenshot({
          path: artifact + "/" + id + "-failure.png",
          fullPage: true,
        })
        .catch(() => {});
      console.log("FAIL", id, e.stack);
      throw e;
    } finally {
      await fs.writeFile(
        artifact + "/results-" + only + ".json",
        JSON.stringify(result, null, 2),
      );
    }
  }
  async function frame() {
    return until(
      () => p.frames().find((f) => f.url().includes("/admin/preview/guest?")),
      "guest iframe",
    );
  }
  const frameSelector = '[data-intro-media-frame="3:2"]';
  async function box(scope, name, { shot = true, ready = false } = {}) {
    const outer = scope.locator(frameSelector);
    await outer.scrollIntoViewIfNeeded();
    if (ready)
      await until(
        async () =>
          (await outer
            .locator("[data-welcome-media-state]")
            .getAttribute("data-welcome-media-state")) === "ready",
        "first media render " + name,
      );
    const m = await outer.evaluate((e) => {
      const r = e.getBoundingClientRect(),
        media = e.querySelector("img,video,canvas"),
        c = media?.getBoundingClientRect(),
        s = media && getComputedStyle(media);
      return {
        width: r.width,
        height: r.height,
        background: getComputedStyle(e).backgroundColor,
        media: media
          ? {
              tag: media.tagName,
              width: c.width,
              height: c.height,
              src: media.currentSrc || media.src || null,
              widthAttribute: media.getAttribute("width"),
              heightAttribute: media.getAttribute("height"),
              naturalWidth:
                media.tagName === "IMG"
                  ? media.naturalWidth
                  : media.tagName === "VIDEO"
                    ? media.videoWidth
                    : media.width,
              naturalHeight:
                media.tagName === "IMG"
                  ? media.naturalHeight
                  : media.tagName === "VIDEO"
                    ? media.videoHeight
                    : media.height,
              objectFit: s.objectFit,
              objectPosition: s.objectPosition,
            }
          : null,
        images: e.querySelectorAll("img").length,
        state:
          e
            .querySelector("[data-welcome-media-state]")
            ?.getAttribute("data-welcome-media-state") || "fallback",
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    assert.ok(Math.abs(m.height - m.width / 1.5) <= 1, JSON.stringify(m));
    assert.equal(m.overflow, false);
    if (m.media) {
      assert.ok(Math.abs(m.media.width - m.width) <= 1);
      assert.ok(Math.abs(m.media.height - m.height) <= 1);
      if (m.media.tag !== "CANVAS") {
        assert.equal(m.media.objectFit, "cover");
        assert.equal(m.media.objectPosition, "50% 50%");
      }
    }
    if (shot) {
      await outer.screenshot({ path: artifact + "/" + name + ".png" });
      if (
        /^(chain-(image|video|lottie)-public-|video-public-error|lottie-render-error)/.test(
          name,
        )
      )
        await outer
          .locator("xpath=ancestor::section[1]")
          .screenshot({ path: artifact + "/visual-" + name + ".png" });
    }
    return m;
  }
  async function publicPage(locale = "en", options = {}) {
    const c = options.context || context;
    const out = await c.newPage();
    out.setDefaultTimeout(90000);
    out.on("pageerror", (e) =>
      result.errors.push({ page: "public", message: e.message }),
    );
    if (options.onResponse) out.on("response", options.onResponse);
    const response = await out.goto(base + `/${locale}/guests`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    assert.equal(response.status(), 200, "Public HTTP " + response.status());
    return out;
  }
  async function choose(file) {
    await section(p, "welcome");
    const f = await frame();
    const prior = f.locator(frameSelector + " [data-welcome-media-state]");
    const old = (await prior.count()) ? await prior.elementHandle() : null;
    await fieldUpload(p, "welcome.image_media_id", file);
    await until(async () => {
      if (old && (await old.evaluate((e) => e.isConnected))) return false;
      return (
        (await f
          .locator(frameSelector + " [data-welcome-media-state]")
          .count()) > 0
      );
    }, "new selected preview boundary");
    await f.locator(frameSelector).scrollIntoViewIfNeeded();
    return f;
  }
  async function selectedSource(scope, measurement, id, label) {
    if (measurement.media?.tag === "CANVAS") {
      const requests = await scope.evaluate(
        (selectedId) =>
          performance
            .getEntriesByType("resource")
            .map((entry) => entry.name)
            .filter((name) => name.includes(selectedId)),
        id,
      );
      assert.ok(
        requests.length > 0,
        label + " actual Lottie resource URL contains selected UUID",
      );
      return { id, requests };
    }
    assert.ok(
      decodeURIComponent(measurement.media?.src || "").includes(id),
      label + " actual media src contains selected UUID",
    );
    return { id, src: measurement.media.src };
  }
  async function persist(file, name, { publicWidths = [1440, 390] } = {}) {
    console.log("UPLOAD", name);
    const f = await choose(file);
    const local = await box(f, name + "-local", { ready: true });
    const before = await row();
    await saveDraft(p);
    console.log("SAVED", name);
    const draft = await until(async () => {
      const r = await row();
      return r.revision > before.revision &&
        r.draft &&
        selected(r) !== selected(before)
        ? r
        : null;
    }, "draft persisted " + name);
    const id = selected(draft);
    const media = (
      await sql`select * from media_asset where id=${id}::uuid`
    )[0];
    assert.ok(media);
    await p.reload({ waitUntil: "domcontentloaded" });
    await section(p, "welcome");
    const savedFrame = await frame();
    const saved = await box(savedFrame, name + "-saved", { ready: true });
    const savedSource = await selectedSource(
      savedFrame,
      saved,
      id,
      name + " saved preview",
    );
    assert.ok(!saved.media?.src?.startsWith("blob:"));
    await publish(p);
    console.log("PUBLISHED", name);
    await until(
      async () => selected(await row(), true) === id,
      "published selected " + name,
    );
    const downloads = [];
    const captureResponse = (response) => {
      if (
        !response.url().includes(id) ||
        !/^application\/(json|zip\+dotlottie)/.test(media.mime || "")
      )
        return;
      downloads.push(
        (async () => {
          const bytes = await response.body();
          return {
            url: response.url(),
            status: response.status(),
            bytes: bytes.length,
            sha256: createHash("sha256").update(bytes).digest("hex"),
          };
        })(),
      );
    };
    const out = await publicPage("en", { onResponse: captureResponse });
    console.log("PUBLIC", name);
    const dimensions = [];
    for (const width of publicWidths) {
      await out.setViewportSize({ width, height: 1000 });
      const measurement = await box(out, name + "-public-" + width, {
        ready: true,
      });
      dimensions.push({
        viewport: width,
        ...measurement,
        selectedSource: await selectedSource(
          out,
          measurement,
          id,
          name + " public",
        ),
      });
    }
    const publicDownloads = await Promise.all(downloads);
    let uploadedSha256;
    if (/^application\/(json|zip\+dotlottie)/.test(media.mime || "")) {
      uploadedSha256 = createHash("sha256")
        .update(await fs.readFile(file))
        .digest("hex");
      assert.ok(
        publicDownloads.length > 0,
        name + " actual browser payload captured",
      );
      for (const download of publicDownloads) {
        assert.equal(download.status, 200, name + " actual payload HTTP");
        assert.equal(
          download.sha256,
          uploadedSha256,
          name + " browser bytes match selected upload",
        );
      }
    }
    return {
      out,
      id,
      media,
      local,
      saved,
      savedSource,
      dimensions,
      publicDownloads,
      uploadedSha256,
    };
  }

  return {
    req,
    sql,
    artifact,
    result,
    b,
    context,
    p,
    networkObservation,
    row,
    selected,
    record,
    frame,
    box,
    publicPage,
    choose,
    persist,
    only,
    root,
    base,
    until,
    section,
    fieldUpload,
    saveDraft,
    publish,
    fixture,
    finish: async () => {
      result.finished = new Date().toISOString();
      await fs.writeFile(
        artifact + "/results-" + only + ".json",
        JSON.stringify(result, null, 2),
      );
      await b.close();
    },
  };
}
